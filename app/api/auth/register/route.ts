import { NextResponse } from "next/server";

import { registerUser } from "@/app/lib/auth-users";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  password?: string;
  role?: "user" | "admin";
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const companyName = body.companyName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const role = body.role === "admin" ? "admin" : "user";

    if (!firstName) {
      return NextResponse.json({ error: "First name is required." }, { status: 400 });
    }
    if (!isEmailValid(email)) {
      return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const name = [firstName, lastName].filter(Boolean).join(" ");
    void name;

    const result = await registerUser({
      firstName,
      lastName,
      companyName,
      email,
      password,
      role,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: result.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}