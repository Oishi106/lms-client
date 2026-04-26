import bcrypt from "bcryptjs";
import crypto from "crypto";

import { connectMongoose } from "@/app/lib/mongoose";
import { UserModel } from "@/app/lib/models/User";

export type AppRole = "user" | "admin";

export type AppUserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AppRole;
  initials: string;
};

type PublicAppUser = Omit<AppUserRecord, "password">;

type RegisterPayload = {
  firstName: string;
  lastName?: string;
  companyName?: string;
  email: string;
  password: string;
  role?: AppRole;
};

function toInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = (parts[1]?.[0] ?? parts[0]?.[1] ?? "").toString();
  return (first + second).toUpperCase();
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return toInitials(name);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getPublicUserByEmail(email: string): Promise<PublicAppUser | null> {
  await connectMongoose();
  const user = await UserModel.findOne({ email: normalizeEmail(email) }).lean();
  if (!user) return null;
  return {
    id: (user as unknown as { _id: { toString(): string } })._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
  };
}

export async function verifyUserCredentials(email: string, password: string, role?: AppRole): Promise<PublicAppUser | null> {
  const normalized = normalizeEmail(email);
  await connectMongoose();
  const user = await UserModel.findOne({ email: normalized }).lean();
  if (!user) return null;
  if (!user.passwordHash) return null;
  if (role && user.role !== role) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: (user as unknown as { _id: { toString(): string } })._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
  };
}

export async function upsertOAuthUser(input: {
  name?: string | null;
  email?: string | null;
  role?: AppRole;
}): Promise<PublicAppUser | null> {
  const email = input.email ? normalizeEmail(input.email) : "";
  const name = (input.name ?? "").trim();
  if (!email || !name) return null;

  await connectMongoose();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return {
      id: (existing as unknown as { _id: { toString(): string } })._id.toString(),
      name: existing.name,
      email: existing.email,
      role: existing.role,
      initials: existing.initials,
    };
  }

  const passwordSeed = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(passwordSeed, 10);
  const initials = toInitials(name);
  const role: AppRole = input.role ?? "user";

  const created = await UserModel.create({
    name,
    email,
    passwordHash,
    role,
    initials,
    authProvider: "google",
  });

  return {
    id: created._id.toString(),
    name: created.name,
    email: created.email,
    role: created.role,
    initials: created.initials,
  };
}

export async function registerUser(
  payload: RegisterPayload
): Promise<{ ok: true; user: PublicAppUser } | { ok: false; message: string }> {
  const email = normalizeEmail(payload.email);
  if (!email) return { ok: false, message: "Email is required." };
  if (payload.password.length < 6) return { ok: false, message: "Password must be at least 6 characters." };

  const firstName = payload.firstName.trim();
  const lastName = (payload.lastName ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  if (!fullName) {
    return { ok: false, message: "Name is required." };
  }

  await connectMongoose();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return { ok: false, message: "An account already exists with this email." };
  }

  const userCount = await UserModel.countDocuments();
  const adminCount = await UserModel.countDocuments({ role: "admin" });

  const isFirstUser = userCount === 0;
  const hasAnyAdmin = adminCount > 0;

  // Real-life rule:
  // - First ever registered account becomes admin.
  // - If users exist but no admin exists yet, allow creating the first admin.
  // - Once an admin exists, admin registration is not allowed via public signup.
  const requestedRole: AppRole = payload.role ?? "user";
  const role: AppRole = isFirstUser ? "admin" : requestedRole;

  if (hasAnyAdmin && requestedRole === "admin") {
    return { ok: false, message: "Admin registration is disabled. Ask an existing admin to promote your account." };
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const initials = toInitials(fullName);

  try {
    const created = await UserModel.create({
      name: fullName,
      email,
      passwordHash,
      role,
      initials,
      companyName: payload.companyName?.trim() || undefined,
      authProvider: "credentials",
    });

    return {
      ok: true,
      user: {
        id: created._id.toString(),
        name: created.name,
        email: created.email,
        role: created.role,
        initials: created.initials,
      },
    };
  } catch (err) {
    const isDuplicate =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000;
    return { ok: false, message: isDuplicate ? "An account already exists with this email." : "Unable to create account." };
  }
}
