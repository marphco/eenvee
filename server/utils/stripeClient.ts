import Stripe from "stripe";
import { stripeConfig } from "../config/env.js";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    if (!stripeConfig.secretKey) {
      throw new Error("Stripe non configurato: STRIPE_SECRET_KEY mancante.");
    }
    client = new Stripe(stripeConfig.secretKey, {
      apiVersion: "2024-06-20" as any,
      typescript: true,
    });
  }
  return client;
}

export function isStripeConfigured(): boolean {
  return stripeConfig.isConfigured;
}

export function calculateApplicationFee(amountCents: number): number {
  const percentFee = Math.round((amountCents * stripeConfig.feePercent) / 100);
  return percentFee + stripeConfig.feeFixedCents;
}
