import express, { Request, Response } from "express";
import Stripe from "stripe";
import StripeAccount from "../models/StripeAccount.js";
import Donation from "../models/Donation.js";
import StripeWebhookEvent from "../models/StripeWebhookEvent.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { getStripe, isStripeConfigured } from "../utils/stripeClient.js";
import { stripeConfig } from "../config/env.js";
import { sendDonorReceipt, sendHostNotification } from "../utils/donationEmails.js";
import { dispatchPaidEventEmailsIfNeeded } from "../utils/paidEventEmailDispatch.js";
import { isPaidPlan } from "../utils/eventPlan.js";

const router = express.Router();

/**
 * Webhook Stripe. IMPORTANTE: questo router viene montato PRIMA di express.json,
 * con express.raw({ type: 'application/json' }) come middleware per preservare il body raw.
 */
router.post("/", async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    return res.status(503).send("Stripe non configurato");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      stripeConfig.webhookSecret
    );
  } catch (err: any) {
    console.error("[webhook] signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const existing = await StripeWebhookEvent.findOne({ eventId: event.id });
  if (existing) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
        await handleChargeDispute(event.data.object as Stripe.Dispute);
        break;
      default:
        // eventi non gestiti: comunque registriamo per audit
        break;
    }

    await StripeWebhookEvent.create({
      eventId: event.id,
      eventType: event.type,
      outcome: "processed",
    });

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`[webhook] error processing ${event.type}:`, err.message);
    try {
      await StripeWebhookEvent.create({
        eventId: event.id,
        eventType: event.type,
        outcome: "error",
        note: err.message?.slice(0, 200) || "",
      });
    } catch (_) { /* ignore duplicate key on retry */ }
    res.status(500).send("Webhook handler error");
  }
});

async function handleAccountUpdated(account: Stripe.Account) {
  await StripeAccount.findOneAndUpdate(
    { stripeAccountId: account.id },
    {
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirementsCurrentlyDue: account.requirements?.currently_due || [],
      lastSyncedAt: new Date(),
    }
  );
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  if (pi.metadata?.kind === "event_unlock") {
    await handleEventUnlockPaymentSucceeded(pi);
    return;
  }

  const donation = await Donation.findOne({ stripePaymentIntentId: pi.id });
  if (!donation) {
    return;
  }

  if (donation.status === "succeeded") return;

  donation.status = "succeeded";
  if (pi.latest_charge && typeof pi.latest_charge === "string") {
    donation.stripeChargeId = pi.latest_charge;
  }
  await donation.save();

  try {
    const [ev, host] = await Promise.all([
      Event.findById(donation.eventId),
      User.findById(donation.hostUserId),
    ]);

    if (ev && donation.donor?.email) {
      await sendDonorReceipt({
        donorEmail: donation.donor.email,
        donorName: donation.donor.name,
        eventTitle: ev.title,
        eventSlug: donation.eventSlug,
        amountCents: donation.amount,
        message: donation.donor.message,
      });
    }

    if (ev && host?.email) {
      await sendHostNotification({
        hostEmail: host.email,
        eventTitle: ev.title,
        eventSlug: donation.eventSlug,
        donorName: donation.donor.name,
        donorEmail: donation.donor.email,
        amountCents: donation.amount,
        netCents: donation.netToHost,
        feeCents: donation.applicationFee,
        message: donation.donor.message,
      });
    }
  } catch (emailErr: any) {
    console.error("[webhook] errore invio email donazione:", emailErr.message);
  }
}

/**
 * Acquisto piano Evento (PaymentIntent piattaforma): allinea piano `paid` + email come donazioni.
 */
async function handleEventUnlockPaymentSucceeded(pi: Stripe.PaymentIntent) {
  const slug = pi.metadata?.eventSlug;
  const ownerId = pi.metadata?.ownerId;
  if (!slug || !ownerId) {
    console.warn(`[webhook] event_unlock PI ${pi.id}: metadata slug/owner mancanti`);
    return;
  }

  try {
    const ev = await Event.findOne({ slug, ownerId });
    if (!ev) {
      console.warn(`[webhook] event_unlock PI ${pi.id}: evento non trovato ${slug}`);
      return;
    }

    if (!isPaidPlan(ev.plan)) {
      ev.plan = "paid";
      await ev.save();
    }

    await dispatchPaidEventEmailsIfNeeded(pi, ev);
  } catch (err: any) {
    console.error("[webhook] errore event_unlock / email piano Evento:", err.message);
  }
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  await Donation.findOneAndUpdate(
    { stripePaymentIntentId: pi.id, status: { $ne: "succeeded" } },
    { status: "failed" }
  );
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  await Donation.findOneAndUpdate(
    { stripePaymentIntentId: piId },
    { status: "refunded" }
  );
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;
  await Donation.findOneAndUpdate(
    { stripeChargeId: chargeId },
    { status: "disputed" }
  );
}

export default router;
