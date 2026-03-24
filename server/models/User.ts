import mongoose, { Schema, InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: false }, // Optional for SSO users
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, required: false },
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof userSchema>;

export default mongoose.model<IUser>("User", userSchema);
