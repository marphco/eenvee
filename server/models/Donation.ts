import mongoose, { Schema, InferSchemaType } from "mongoose";

const donorSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    message: { type: String, default: "" },
  },
  { _id: false }
);

const donationSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    eventSlug: { type: String, required: true, index: true },
    hostUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    stripeAccountId: { type: String, required: true },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    stripeChargeId: { type: String, default: "" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "eur" },
    applicationFee: { type: Number, required: true },
    netToHost: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded", "disputed"],
      default: "pending",
      index: true,
    },
    donor: { type: donorSchema, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

donationSchema.index({ eventSlug: 1, status: 1, createdAt: -1 });

export type IDonation = InferSchemaType<typeof donationSchema>;

export default mongoose.models.Donation ||
  mongoose.model<IDonation>("Donation", donationSchema);
