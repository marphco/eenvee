import mongoose, { Schema, InferSchemaType } from "mongoose";

const inviteSchema = new Schema(
  {
    eventSlug: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    channel: { type: String, enum: ["whatsapp", "email", "sms"], default: "whatsapp" },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export type IInvite = InferSchemaType<typeof inviteSchema>;

export default mongoose.models.Invite || mongoose.model<IInvite>("Invite", inviteSchema);
