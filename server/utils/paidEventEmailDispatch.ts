import type Stripe from "stripe";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendPaidEventBuyerReceipt, sendPaidEventOpsNotification } from "./donationEmails.js";

/**
 * Ricevuta acquirente + notifica interna (come donazioni), al massimo una volta per PaymentIntent.
 * Webhook `payment_intent.succeeded` e `complete-unlock-intent` / `complete-checkout`.
 */
export async function dispatchPaidEventEmailsIfNeeded(pi: Stripe.PaymentIntent, ev: { _id: unknown }): Promise<void> {
  if (pi.metadata?.kind !== "event_unlock") return;

  const fresh = await Event.findById(ev._id).select("paidReceiptSentForPi premiumReceiptSentForPi title slug ownerId");
  if (!fresh) return;

  const sentFor = fresh.paidReceiptSentForPi || fresh.premiumReceiptSentForPi;
  if (sentFor === pi.id) return;

  const buyerEmail = (pi.receipt_email || pi.metadata?.receipt_email || "").trim().toLowerCase();
  const buyerName = (pi.metadata?.payer_name || "Cliente").trim().slice(0, 120);
  const amountCents = typeof pi.amount_received === "number" && pi.amount_received > 0 ? pi.amount_received : pi.amount;
  const invoiceRequested = pi.metadata?.invoice_requested === "true";
  const invoiceMetadata: Record<string, string> = {};
  if (pi.metadata && typeof pi.metadata === "object") {
    for (const [k, v] of Object.entries(pi.metadata)) {
      if ((k.startsWith("inv_") || k === "invoice_requested") && v != null && String(v).length > 0) {
        invoiceMetadata[k] = String(v);
      }
    }
  }

  const owner = await User.findById(fresh.ownerId).select("email");

  try {
    if (buyerEmail) {
      await sendPaidEventBuyerReceipt({
        buyerEmail,
        buyerName,
        eventTitle: fresh.title,
        eventSlug: fresh.slug,
        amountCents,
        invoiceRequested,
      });
    } else {
      console.warn(`[paid-event-email] PI ${pi.id}: nessuna email ricevuta per ricevuta acquirente`);
    }

    await sendPaidEventOpsNotification({
      eventTitle: fresh.title,
      eventSlug: fresh.slug,
      amountCents,
      buyerEmail: buyerEmail || "—",
      buyerName,
      ownerAccountEmail: owner?.email || undefined,
      paymentIntentId: pi.id,
      invoiceMetadata: Object.keys(invoiceMetadata).length ? invoiceMetadata : undefined,
    });
  } catch (err: any) {
    console.error("[paid-event-email] invio fallito:", err.message);
    return;
  }

  await Event.updateOne({ _id: fresh._id }, { $set: { paidReceiptSentForPi: pi.id } });
}
