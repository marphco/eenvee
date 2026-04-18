import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

if (process.env.R2_ACCESS_KEY_ID) process.env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID.trim();
if (process.env.R2_SECRET_ACCESS_KEY) process.env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY.trim();
if (process.env.R2_ENDPOINT) process.env.R2_ENDPOINT = process.env.R2_ENDPOINT.trim();
if (process.env.R2_BUCKET_NAME) process.env.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME.trim();

if (process.env.STRIPE_SECRET_KEY) process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY.trim();
if (process.env.STRIPE_WEBHOOK_SECRET) process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET.trim();
if (process.env.STRIPE_PUBLISHABLE_KEY) process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY.trim();

const isProduction = process.env.NODE_ENV === "production";
const missing: string[] = [];

if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");

if (missing.length > 0) {
  const msg = `[ENV] Stripe env mancanti: ${missing.join(", ")}.`;
  if (isProduction) {
    console.error(`${msg} Il server non può partire in produzione senza queste variabili.`);
    process.exit(1);
  } else {
    console.warn(`${msg} Le funzionalità Regali Digitali saranno disabilitate finché non vengono impostate.`);
  }
}

if (!process.env.STRIPE_PLATFORM_FEE_PERCENT) process.env.STRIPE_PLATFORM_FEE_PERCENT = "3";
if (!process.env.STRIPE_PLATFORM_FEE_FIXED_CENTS) process.env.STRIPE_PLATFORM_FEE_FIXED_CENTS = "50";

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  feePercent: Number(process.env.STRIPE_PLATFORM_FEE_PERCENT),
  feeFixedCents: Number(process.env.STRIPE_PLATFORM_FEE_FIXED_CENTS),
  isConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
};

console.log("[ENV] Environment variables loaded and trimmed.");
if (stripeConfig.isConfigured) {
  console.log(`[ENV] Stripe configured · fee ${stripeConfig.feePercent}% + ${stripeConfig.feeFixedCents}¢`);
}

export default process.env;
