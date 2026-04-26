import { Resend } from "resend";
import { connectMongoose } from "@/app/lib/mongoose";
import { Otp } from "@/app/lib/models/Otp";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email provider not configured" }, { status: 500 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  await connectMongoose();

  // rate limit: prevent repeated sends within 60s
  const recent = await Otp.findOne({ email }).sort({ createdAt: -1 }).lean();
  if (recent && new Date().getTime() - new Date(recent.createdAt!).getTime() < 60 * 1000) {
    return NextResponse.json({ error: "OTP recently sent. Please wait a moment." }, { status: 429 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await Otp.create({ email: email.toLowerCase().trim(), code, expiresAt });

  try {
    await resend.emails.send({
      from: "LMS <onboarding@resend.dev>",
      to: email,
      subject: "Your Verification Code",
      html: `<p>Your OTP code is <strong>${code}</strong>. It expires in 5 minutes.</p>`,
    });
  } catch (err: any) {
    console.error("Resend send error:", err);
    const message = err?.message || String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "OTP sent" });
}