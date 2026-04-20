import type Stripe from "stripe";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { sendPaidEventBuyerReceipt, sendPaidEventOpsNotification } from "./donationEmails.js";

/**
 * Ricevuta acquirente + notifica interna, al massimo una volta per PaymentIntent.
 * Chiamare solo da `payment_intent.succeeded` (webhook): se anche le route HTTP
 * invocano questa funzione, due richieste parallele mandano le mail due volte.
 */
export async function dispatchPaidEventEmailsIfNeeded(pi: Stripe.PaymentIntent, ev: { _id: unknown }): Promise<void> {
  if (pi.metadata?.kind !== "event_unlock") return;

  const snap = await Event.findById(ev._id).select("paidReceiptSentForPi premiumReceiptSentForPi");
  if (!snap) return;
  const sentFor = snap.paidReceiptSentForPi || snap.premiumReceiptSentForPi;
  if (sentFor === pi.id) return;

  const claim = await Event.updateOne(
    { _id: ev._id, paidReceiptSentForPi: { $ne: pi.id } },
    { $set: { paidReceiptSentForPi: pi.id } }
  );
  if (claim.matchedCount === 0) return;
  if (claim.modifiedCount === 0) {
    const again = await Event.findById(ev._id).select("paidReceiptSentForPi");
    if (again?.paidReceiptSentForPi === pi.id) return;
    return;
  }

  const fresh = await Event.findById(ev._id).select("title slug ownerId");
  if (!fresh) {
    await Event.updateOne({ _id: ev._id }, { $unset: { paidReceiptSentForPi: 1 } });
    return;
  }

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

  let buyerDelivered = false;
  let opsDelivered = false;
  try {
    if (buyerEmail) {
      const buyerRes = await sendPaidEventBuyerReceipt({
        buyerEmail,
        buyerName,
        eventTitle: fresh.title,
        eventSlug: fresh.slug,
        amountCents,
        invoiceRequested,
      });
      buyerDelivered = buyerRes.success;
      if (!buyerRes.success) {
        console.error(`[paid-event-email] PI ${pi.id}: ricevuta acquirente non inviata:`, buyerRes.error);
      }
    } else {
      console.warn(`[paid-event-email] PI ${pi.id}: nessuna email ricevuta per ricevuta acquirente`);
    }

    const opsRes = await sendPaidEventOpsNotification({
      eventTitle: fresh.title,
      eventSlug: fresh.slug,
      amountCents,
      buyerEmail: buyerEmail || "—",
      buyerName,
      ownerAccountEmail: owner?.email || undefined,
      paymentIntentId: pi.id,
      invoiceMetadata: Object.keys(invoiceMetadata).length ? invoiceMetadata : undefined,
    });
    opsDelivered = opsRes.success;
    if (!opsRes.success) {
      console.error(
        `[paid-event-email] PI ${pi.id}: notifica interna non inviata:`,
        opsRes.error,
        "| Imposta INTERNAL_NOTIFY_EMAIL su una casella che leggi; se coincide con EMAIL_FROM il provider può non recapitarla."
      );
    }
  } catch (err: any) {
    console.error("[paid-event-email] invio fallito:", err.message);
    if (!buyerDelivered && !opsDelivered) {
      await Event.updateOne({ _id: ev._id, paidReceiptSentForPi: pi.id }, { $unset: { paidReceiptSentForPi: 1 } });
    }
    return;
  }

  if (!buyerDelivered && !opsDelivered) {
    await Event.updateOne({ _id: ev._id, paidReceiptSentForPi: pi.id }, { $unset: { paidReceiptSentForPi: 1 } });
  }
}
