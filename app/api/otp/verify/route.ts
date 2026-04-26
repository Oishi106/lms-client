import { connectMongoose } from "@/app/lib/mongoose";
import { Otp } from "@/app/lib/models/Otp";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Missing email or code" }, { status: 400 });
  }

  await connectMongoose();

  const record = await Otp.findOne({ email: email.toLowerCase().trim(), code }).sort({ createdAt: -1 });
  if (!record) {
    return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 400 });
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "Code expired" }, { status: 400 });
  }

  // consume the OTP
  await Otp.deleteMany({ email: email.toLowerCase().trim() });

  return NextResponse.json({ ok: true, message: "Verified" });
}
