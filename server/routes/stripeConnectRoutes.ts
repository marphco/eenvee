import express, { Response } from "express";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import Event from "../models/Event.js";
import StripeAccount from "../models/StripeAccount.js";
import requireAuth, { AuthRequest } from "../middleware/requireAuth.js";
import { getStripe, isStripeConfigured } from "../utils/stripeClient.js";

function sanitizeIban(raw: string): string {
  return (raw || "").replace(/\s+/g, "").toUpperCase();
}

function isValidItalianIban(iban: string): boolean {
  return /^IT\d{2}[A-Z0-9]{23}$/.test(iban);
}

function isValidItalianFiscalCode(cf: string): boolean {
  return /^[A-Z0-9]{16}$/i.test((cf || "").trim());
}

function isValidCap(cap: string): boolean {
  return /^\d{5}$/.test((cap || "").trim());
}

function isValidProvince(p: string): boolean {
  return /^[A-Z]{2}$/.test((p || "").trim().toUpperCase());
}

const router = express.Router();

const createAccountLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Troppe richieste. Riprova fra un minuto." },
});

const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

function requireStripe(res: Response): boolean {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Servizio pagamenti non configurato al momento." });
    return false;
  }
  return true;
}

/**
 * POST /api/stripe/connect/create-account
 * Crea (se non esiste) un Stripe Connect Express account per l'utente loggato.
 */
router.post("/create-account", requireAuth, createAccountLimiter, async (req: AuthRequest, res: Response) => {
  if (!requireStripe(res)) return;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    const { eventSlug, paymentMode } = (req.body || {}) as {
      eventSlug?: string;
      paymentMode?: "gift" | "donation";
    };

    let eventDoc: any = null;
    if (eventSlug) {
      eventDoc = await Event.findOne({ slug: eventSlug, ownerId: req.userId }).select("title slug");
    }

    const existing = await StripeAccount.findOne({ userId: req.userId });
    if (existing) {
      return res.json({
        stripeAccountId: existing.stripeAccountId,
        chargesEnabled: existing.chargesEnabled,
        payoutsEnabled: existing.payoutsEnabled,
        detailsSubmitted: existing.detailsSubmitted,
      });
    }

    const mcc = paymentMode === "donation" ? "8398" : "7299";
    const publicBase = (process.env.PUBLIC_BASE_URL || "https://eenvee.com").replace(/\/$/, "");
    const eventUrl = eventSlug ? `${publicBase}/events/${eventSlug}` : publicBase;
    const productDescription = paymentMode === "donation"
      ? `Raccolta fondi per l'iniziativa "${eventDoc?.title || "Evento"}" tramite la piattaforma eenvee.`
      : `Raccolta regali digitali degli ospiti dell'evento "${eventDoc?.title || "Evento privato"}" tramite la piattaforma eenvee.`;

    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: "express",
      country: "IT",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        sepa_debit_payments: { requested: true },
      },
      business_type: "individual",
      business_profile: {
        mcc,
        url: eventUrl,
        product_description: productDescription,
        support_email: user.email,
      },
      settings: {
        payouts: {
          statement_descriptor: "EENVEE GIFT",
        },
      },
      individual: {
        email: user.email,
      },
      metadata: {
        eenveeUserId: String(req.userId),
        eenveeEventSlug: eventSlug || "",
        eenveePaymentMode: paymentMode || "gift",
      },
    });

    const record = await StripeAccount.create({
      userId: req.userId,
      stripeAccountId: account.id,
      country: account.country || "IT",
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirementsCurrentlyDue: account.requirements?.currently_due || [],
    });

    res.json({
      stripeAccountId: record.stripeAccountId,
      chargesEnabled: record.chargesEnabled,
      payoutsEnabled: record.payoutsEnabled,
      detailsSubmitted: record.detailsSubmitted,
    });
  } catch (err: any) {
    console.error("[stripe/connect/create-account]", err.message);
    res.status(500).json({ message: "Errore creazione account Stripe" });
  }
});

/**
 * POST /api/stripe/connect/prefill-account
 * Pre-compila i dati personali dell'individual + collega IBAN bancario.
 * Dopo questa chiamata Stripe Embedded Onboarding chiede solo:
 *  - upload documento identità
 *  - accettazione TOS Stripe
 */
router.post("/prefill-account", requireAuth, createAccountLimiter, async (req: AuthRequest, res: Response) => {
  if (!requireStripe(res)) return;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });

    const {
      firstName, lastName,
      dobDay, dobMonth, dobYear,
      fiscalCode,
      addressLine1, addressLine2,
      city, postalCode, province,
      phone,
      iban, ibanHolder,
      eventSlug: eventSlugRaw,
      paymentMode: paymentModeRaw,
    } = (req.body || {}) as Record<string, string | number>;

    const errors: string[] = [];
    if (!firstName || String(firstName).trim().length < 1) errors.push("Nome mancante");
    if (!lastName || String(lastName).trim().length < 1) errors.push("Cognome mancante");
    const dd = Number(dobDay), mm = Number(dobMonth), yy = Number(dobYear);
    if (!dd || !mm || !yy || dd < 1 || dd > 31 || mm < 1 || mm > 12 || yy < 1920 || yy > new Date().getFullYear() - 13) {
      errors.push("Data di nascita non valida");
    }
    if (!isValidItalianFiscalCode(String(fiscalCode || ""))) errors.push("Codice fiscale non valido");
    if (!addressLine1 || String(addressLine1).trim().length < 3) errors.push("Indirizzo non valido");
    if (!city || String(city).trim().length < 2) errors.push("Città non valida");
    if (!isValidCap(String(postalCode || ""))) errors.push("CAP non valido (5 cifre)");
    if (!isValidProvince(String(province || ""))) errors.push("Provincia non valida (sigla di 2 lettere)");
    if (!phone || !/^[+0-9\s()-]{6,}$/.test(String(phone))) errors.push("Telefono non valido");

    const ibanClean = sanitizeIban(String(iban || ""));
    if (!isValidItalianIban(ibanClean)) errors.push("IBAN italiano non valido");
    if (!ibanHolder || String(ibanHolder).trim().length < 2) errors.push("Intestatario IBAN mancante");

    if (errors.length > 0) {
      return res.status(400).json({ message: "Dati non validi", errors });
    }

    const stripe = getStripe();
    const existing = await StripeAccount.findOne({ userId: req.userId });

    // Su Stripe Express la platform NON può aggiornare il campo `individual`
    // dopo la creazione: l'unico modo per pre-popolarlo è passarlo direttamente
    // in `accounts.create`. Per questo, se esiste già un account "vuoto" (non
    // ancora abilitato/attivo), lo cancelliamo e ne creiamo uno nuovo con tutti
    // i dati pre-popolati. Se invece l'account è già attivo (chargesEnabled)
    // NON lo tocchiamo: l'utente deve modificare i suoi dati dalla dashboard Stripe.
    if (existing?.chargesEnabled) {
      return res.status(409).json({
        message: "Account Stripe già attivo: modifica i dati dalla dashboard Stripe.",
      });
    }

    // Recupero metadata dal vecchio account (per ricostruire business_profile)
    // prima di cancellarlo, e poi lo elimino.
    let eventSlug = String(eventSlugRaw || "");
    let paymentMode = String(paymentModeRaw || "gift");

    if (existing) {
      try {
        const oldAcc = await stripe.accounts.retrieve(existing.stripeAccountId);
        eventSlug = eventSlug || String(oldAcc.metadata?.eenveeEventSlug || "");
        paymentMode = paymentMode || String(oldAcc.metadata?.eenveePaymentMode || "gift");
      } catch (e: any) {
        // L'account potrebbe non esistere più lato Stripe: ignoriamo.
        console.warn("[stripe/connect/prefill-account] retrieve old failed:", e?.message);
      }
      try {
        await stripe.accounts.del(existing.stripeAccountId);
      } catch (e: any) {
        console.warn("[stripe/connect/prefill-account] delete old failed:", e?.message);
      }
      await StripeAccount.deleteOne({ _id: existing._id });
    }

    let eventDoc: any = null;
    if (eventSlug) {
      eventDoc = await Event.findOne({ slug: eventSlug, ownerId: req.userId }).select("title slug");
    }

    const mcc = paymentMode === "donation" ? "8398" : "7299";
    const publicBase = (process.env.PUBLIC_BASE_URL || "https://eenvee.com").replace(/\/$/, "");
    const eventUrl = eventSlug ? `${publicBase}/events/${eventSlug}` : publicBase;
    const productDescription = paymentMode === "donation"
      ? `Raccolta fondi per l'iniziativa "${eventDoc?.title || "Evento"}" tramite la piattaforma eenvee.`
      : `Raccolta regali digitali degli ospiti dell'evento "${eventDoc?.title || "Evento privato"}" tramite la piattaforma eenvee.`;

    const account = await stripe.accounts.create({
      type: "express",
      country: "IT",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        sepa_debit_payments: { requested: true },
      },
      business_type: "individual",
      business_profile: {
        mcc,
        url: eventUrl,
        product_description: productDescription,
        support_email: user.email,
      },
      settings: {
        payouts: {
          statement_descriptor: "EENVEE GIFT",
        },
      },
      individual: {
        first_name: String(firstName).trim(),
        last_name: String(lastName).trim(),
        email: user.email,
        dob: { day: dd, month: mm, year: yy },
        id_number: String(fiscalCode).trim().toUpperCase(),
        address: {
          line1: String(addressLine1).trim(),
          line2: addressLine2 ? String(addressLine2).trim() : undefined,
          city: String(city).trim(),
          postal_code: String(postalCode).trim(),
          state: String(province).trim().toUpperCase(),
          country: "IT",
        },
        phone: String(phone).trim(),
      },
      external_account: {
        object: "bank_account",
        country: "IT",
        currency: "eur",
        account_holder_name: String(ibanHolder).trim(),
        account_holder_type: "individual",
        account_number: ibanClean,
      },
      metadata: {
        eenveeUserId: String(req.userId),
        eenveeEventSlug: eventSlug || "",
        eenveePaymentMode: paymentMode || "gift",
      },
    });

    const record = await StripeAccount.create({
      userId: req.userId,
      stripeAccountId: account.id,
      country: account.country || "IT",
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirementsCurrentlyDue: account.requirements?.currently_due || [],
      lastSyncedAt: new Date(),
    });

    res.json({
      ok: true,
      stripeAccountId: record.stripeAccountId,
      chargesEnabled: record.chargesEnabled,
      payoutsEnabled: record.payoutsEnabled,
      detailsSubmitted: record.detailsSubmitted,
      requirementsCurrentlyDue: record.requirementsCurrentlyDue,
    });
  } catch (err: any) {
    console.error("[stripe/connect/prefill-account]", err?.message, err?.raw?.message || "");
    const stripeMsg = err?.raw?.message || err?.message || "Errore salvataggio dati";
    res.status(400).json({ message: stripeMsg });
  }
});

/**
 * POST /api/stripe/connect/account-session
 * Genera un client_secret per montare i componenti embedded Stripe lato client.
 */
router.post("/account-session", requireAuth, sessionLimiter, async (req: AuthRequest, res: Response) => {
  if (!requireStripe(res)) return;
  try {
    const account = await StripeAccount.findOne({ userId: req.userId });
    if (!account) {
      return res.status(404).json({ message: "Account Stripe non trovato. Creane uno prima." });
    }

    const stripe = getStripe();
    const session = await stripe.accountSessions.create({
      account: account.stripeAccountId,
      components: {
        account_onboarding: { enabled: true },
        payments: { enabled: true },
        payment_details: { enabled: true },
        notification_banner: { enabled: true },
      },
    });

    res.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    console.error("[stripe/connect/account-session]", err.message);
    res.status(500).json({ message: "Errore creazione sessione Stripe" });
  }
});

/**
 * GET /api/stripe/connect/status
 * Ritorna lo stato cached dell'account. Lo stato fresco viene aggiornato dal webhook account.updated.
 */
router.get("/status", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const account = await StripeAccount.findOne({ userId: req.userId });
    if (!account) {
      return res.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsCurrentlyDue: [],
      });
    }
    res.json({
      connected: true,
      stripeAccountId: account.stripeAccountId,
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
      requirementsCurrentlyDue: account.requirementsCurrentlyDue,
      lastSyncedAt: account.lastSyncedAt,
    });
  } catch (err: any) {
    console.error("[stripe/connect/status]", err.message);
    res.status(500).json({ message: "Errore" });
  }
});

/**
 * GET /api/stripe/connect/public-status/:slug
 * Stato pubblico (non autenticato) per verificare se un evento accetta regali.
 * Serve al PaymentWidget lato public per sapere se abilitare il bottone "Fai un regalo".
 */
router.get("/public-status/:slug", async (req, res) => {
  try {
    const Event = (await import("../models/Event.js")).default;
    const ev = await Event.findOne({ slug: req.params.slug }).select("ownerId");
    if (!ev) return res.status(404).json({ acceptsGifts: false });
    const account = await StripeAccount.findOne({ userId: ev.ownerId });
    res.json({
      acceptsGifts: Boolean(account?.chargesEnabled),
    });
  } catch (err: any) {
    res.status(500).json({ acceptsGifts: false });
  }
});

export default router;
