import mongoose, { Schema, InferSchemaType } from "mongoose";

const stripeWebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true, index: true },
    processedAt: { type: Date, default: Date.now },
    outcome: { type: String, enum: ["processed", "skipped", "error"], default: "processed" },
    relatedDonationId: { type: Schema.Types.ObjectId, ref: "Donation", default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export type IStripeWebhookEvent = InferSchemaType<typeof stripeWebhookEventSchema>;

export default mongoose.models.StripeWebhookEvent ||
  mongoose.model<IStripeWebhookEvent>("StripeWebhookEvent", stripeWebhookEventSchema);
