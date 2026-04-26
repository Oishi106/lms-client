import mongoose, { type Model } from "mongoose";

export type LoginEventDoc = {
  userId: string;
  email: string;
  provider: string;
  ip?: string | null;
  createdAt: Date;
};

const LoginEventSchema = new mongoose.Schema<LoginEventDoc>(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    provider: { type: String, required: true },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const LoginEventModel: Model<LoginEventDoc> =
  (mongoose.models.LoginEvent as Model<LoginEventDoc>) || mongoose.model<LoginEventDoc>("LoginEvent", LoginEventSchema);
