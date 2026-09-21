import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  googleId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "local";
  passwordHash?: string;
  allTimePromptQuota: number;
  promptsUsed: number;
  allTimeGameQuota: number;
  gamesUsed: number;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, sparse: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    provider: { type: String, enum: ["google", "local"], default: "google" },
    passwordHash: { type: String },
    allTimePromptQuota: { type: Number, default: 5 },
    promptsUsed: { type: Number, default: 0 },
    allTimeGameQuota: { type: Number, default: 5 },
    gamesUsed: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
