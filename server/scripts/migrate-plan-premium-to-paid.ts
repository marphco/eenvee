/**
 * Migrazione one-shot: plan "premium" → "paid", premiumReceiptSentForPi → paidReceiptSentForPi.
 *
 * Uso (da cartella server, con MONGO_URI in .env):
 *   npx tsx scripts/migrate-plan-premium-to-paid.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import Event from "../models/Event.js";

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("Manca MONGO_URI (o MONGODB_URI) nel .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const coll = Event.collection;

  const r1 = await coll.updateMany({ plan: "premium" }, { $set: { plan: "paid" } });
  console.log(`plan premium → paid: matched ${r1.matchedCount}, modified ${r1.modifiedCount}`);

  const r2 = await coll.updateMany(
    { premiumReceiptSentForPi: { $exists: true, $type: "string", $ne: "" } },
    [{ $set: { paidReceiptSentForPi: "$premiumReceiptSentForPi" } }, { $unset: "premiumReceiptSentForPi" }]
  );
  console.log(`premiumReceiptSentForPi → paidReceiptSentForPi: matched ${r2.matchedCount}, modified ${r2.modifiedCount}`);

  await mongoose.disconnect();
  console.log("Fatto.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
