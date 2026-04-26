import mongoose, { type Model } from "mongoose";

export type OtpDoc = {
  email: string;
  code: string;
  expiresAt: Date;
  attempts?: number;
};

const OtpSchema = new mongoose.Schema<OtpDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Otp: Model<OtpDoc> =
  (mongoose.models.Otp as Model<OtpDoc>) || mongoose.model<OtpDoc>("Otp", OtpSchema);
