import { NextResponse } from "next/server";

import { registerUser, type AppRole } from "@/app/lib/auth-users";

type RegisterBody = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  password?: string;
  role?: AppRole;
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

    if (role === "admin" && !companyName) {
      return NextResponse.json({ error: "Organization name is required for admin accounts." }, { status: 400 });
    }

    const result = registerUser({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        initials: result.user.initials,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
