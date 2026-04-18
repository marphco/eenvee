import mongoose, { Schema, InferSchemaType } from "mongoose";

const stripeAccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    stripeAccountId: { type: String, required: true, unique: true },
    country: { type: String, default: "IT" },
    chargesEnabled: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
    detailsSubmitted: { type: Boolean, default: false },
    requirementsCurrentlyDue: { type: [String], default: [] },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export type IStripeAccount = InferSchemaType<typeof stripeAccountSchema>;

export default mongoose.models.StripeAccount ||
  mongoose.model<IStripeAccount>("StripeAccount", stripeAccountSchema);
