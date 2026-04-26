import mongoose, { type Model } from "mongoose";

export type UserRole = "user" | "admin";

export type UserDoc = {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  initials: string;
  companyName?: string;
  authProvider?: "credentials" | "google";
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  loginCount?: number;
  lastLoginProvider?: string;
};

const UserSchema = new mongoose.Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    initials: { type: String, required: true },
    companyName: { type: String, trim: true },
    authProvider: { type: String, enum: ["credentials", "google"] },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    lastLoginProvider: { type: String },
  },
  { timestamps: true }
);

export const UserModel: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);
