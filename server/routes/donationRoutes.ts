import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import Event from "../models/Event.js";
import StripeAccount from "../models/StripeAccount.js";
import Donation from "../models/Donation.js";
import requireAuth, { AuthRequest } from "../middleware/requireAuth.js";
import { getStripe, isStripeConfigured, calculateApplicationFee } from "../utils/stripeClient.js";

const router = express.Router();

const MIN_AMOUNT_CENTS = 100;
const MAX_AMOUNT_CENTS = 500000;

const createIntentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Troppe richieste. Riprova fra un minuto." },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeString(s: any, maxLen: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, maxLen);
}

/**
 * POST /api/donations/create-intent
 * Endpoint pubblico: crea un PaymentIntent con application_fee e destination al Connect account dell'host.
 */
router.post("/create-intent", createIntentLimiter, async (req: Request, res: Response) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({ message: "Servizio pagamenti non disponibile." });
    }

    const { eventSlug, amount, donor } = req.body || {};

    if (!eventSlug || typeof eventSlug !== "string") {
      return res.status(400).json({ message: "eventSlug mancante" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || !Number.isInteger(amt)) {
      return res.status(400).json({ message: "Importo non valido" });
    }
    if (amt < MIN_AMOUNT_CENTS || amt > MAX_AMOUNT_CENTS) {
      return res.status(400).json({
        message: `L'importo deve essere compreso fra ${MIN_AMOUNT_CENTS / 100}€ e ${MAX_AMOUNT_CENTS / 100}€.`,
      });
    }

    const donorName = sanitizeString(donor?.name, 120);
    const donorEmail = sanitizeString(donor?.email, 200).toLowerCase();
    const donorMessage = sanitizeString(donor?.message, 300);

    if (!donorName) return res.status(400).json({ message: "Nome obbligatorio" });
    if (!donorEmail || !emailRegex.test(donorEmail)) {
      return res.status(400).json({ message: "Email non valida" });
    }

    const ev = await Event.findOne({ slug: eventSlug });
    if (!ev) return res.status(404).json({ message: "Evento non trovato" });

    const stripeAccount = await StripeAccount.findOne({ userId: ev.ownerId });
    if (!stripeAccount || !stripeAccount.chargesEnabled) {
      return res.status(409).json({ message: "Il destinatario non ha ancora attivato i pagamenti." });
    }

    const applicationFee = calculateApplicationFee(amt);
    const netToHost = amt - applicationFee;

    const stripe = getStripe();
    const idempotencyKey = crypto.randomUUID();

    const pi = await stripe.paymentIntents.create(
      {
        amount: amt,
        currency: "eur",
        application_fee_amount: applicationFee,
        transfer_data: { destination: stripeAccount.stripeAccountId },
        // Whitelist esplicita dei metodi mostrati al donatore:
        //  - `card`        → carte credito/debito, wallet Apple Pay / Google Pay
        //                    auto-rilevati come pulsanti rapidi sopra il form
        //  - `sepa_debit`  → addebito SEPA diretto (il "bonifico automatico"
        //                    per chi non vuole usare la carta)
        // Esclusi volutamente:
        //  - metodi regionali non italiani (bancontact, mb_way, eps, ideal, p24)
        //  - `link` (causa il popup fluttuante "stripe" indesiderato)
        //  - paypal/klarna (richiedono attivazione dashboard + review aggiuntiva)
        // Se in futuro vogliamo abilitare PayPal basta aggiungerlo qui e averlo
        // abilitato sul Platform Stripe Dashboard.
        payment_method_types: ["card", "sepa_debit"],
        receipt_email: donorEmail,
        metadata: {
          eventId: String(ev._id),
          eventSlug,
          donorName,
          donorEmail,
          donorMessage,
        },
      },
      { idempotencyKey }
    );

    await Donation.create({
      eventId: ev._id,
      eventSlug,
      hostUserId: ev.ownerId,
      stripeAccountId: stripeAccount.stripeAccountId,
      stripePaymentIntentId: pi.id,
      amount: amt,
      currency: "eur",
      applicationFee,
      netToHost,
      status: "pending",
      donor: { name: donorName, email: donorEmail, message: donorMessage },
    });

    res.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      applicationFee,
      netToHost,
    });
  } catch (err: any) {
    console.error("[donations/create-intent]", err.message);
    res.status(500).json({ message: "Errore creazione pagamento" });
  }
});

/**
 * GET /api/donations/event/:slug
 * Lista donazioni per l'evento (solo owner autenticato).
 */
router.get("/event/:slug", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const ev = await Event.findOne({ slug: req.params.slug });
    if (!ev) return res.status(404).json({ message: "Evento non trovato" });
    if (String(ev.ownerId) !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const donations = await Donation.find({
      eventSlug: req.params.slug,
      status: { $in: ["succeeded", "refunded", "disputed"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const totals = donations.reduce(
      (acc, d: any) => {
        if (d.status === "succeeded") {
          acc.grossReceived += d.amount;
          acc.netReceived += d.netToHost;
          acc.count += 1;
        }
        return acc;
      },
      { grossReceived: 0, netReceived: 0, count: 0 }
    );

    res.json({ donations, totals });
  } catch (err: any) {
    console.error("[donations/event]", err.message);
    res.status(500).json({ message: "Errore" });
  }
});

/**
 * GET /api/donations/event/:slug/progress
 * Endpoint pubblico light per progress bar: totale donazioni "succeeded" senza dettaglio.
 */
router.get("/event/:slug/progress", async (req: Request, res: Response) => {
  try {
    const donations = await Donation.find({
      eventSlug: req.params.slug,
      status: "succeeded",
    })
      .select("amount")
      .lean();
    const total = donations.reduce((acc: number, d: any) => acc + d.amount, 0);
    res.json({ total, count: donations.length });
  } catch (err: any) {
    res.status(500).json({ total: 0, count: 0 });
  }
});

export default router;
