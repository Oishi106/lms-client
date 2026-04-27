import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { connectMongoose } from "@/app/lib/mongoose";
import { UserModel } from "@/app/lib/models/User";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000";

type AdminUserRow = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: "user" | "admin";
  initials: string;
  authProvider?: "credentials" | "google";
  lastLoginAt?: Date | null;
  loginCount?: number;
  lastLoginProvider?: string | null;
  createdAt: Date;
};

type LoginEventRow = {
  userId: string;
  createdAt?: Date | string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If a MongoDB URI is configured, read users directly from the local DB.
  if (process.env.MONGODB_URI) {
    await connectMongoose();

    const docs = await UserModel.find(
      { loginCount: { $gt: 0 } },
      {
        name: 1,
        email: 1,
        role: 1,
        initials: 1,
        authProvider: 1,
        lastLoginAt: 1,
        loginCount: 1,
        lastLoginProvider: 1,
        createdAt: 1,
      }
    )
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .limit(500)
      .lean();

    const users = (docs as AdminUserRow[]).map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      initials: doc.initials,
      authProvider: doc.authProvider ?? "credentials",
      lastLoginAt: doc.lastLoginAt ?? null,
      loginCount: doc.loginCount ?? 0,
      lastLoginProvider: doc.lastLoginProvider ?? null,
      createdAt: doc.createdAt,
    }));

    try {
      const { LoginEventModel } = await import("@/app/lib/models/LoginEvent");
      const ids = users.map((u) => u.id);
      const events = await LoginEventModel.find({ userId: { $in: ids } })
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();

      const map = new Map<string, string[]>();
      for (const ev of events as LoginEventRow[]) {
        const list = map.get(ev.userId) || [];
        list.push(new Date(ev.createdAt ?? Date.now()).toISOString());
        map.set(ev.userId, list);
      }

      const usersWithEvents = users.map((u) => ({ ...u, lastLogins: map.get(u.id) || [] }));
      return NextResponse.json({ ok: true, users: usersWithEvents });
    } catch {
      return NextResponse.json({ ok: true, users });
    }
  }

  // Fallback to proxying to external API server
  const res = await fetch(`${SERVER_URL}/api/v1/admin/users`);
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();

  if (process.env.MONGODB_URI) {
    await connectMongoose();
    try {
      await UserModel.deleteOne({ _id: userId });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
  }

  const res = await fetch(`${SERVER_URL}/api/v1/admin/users/${userId}`, {
    method: "DELETE",
  });

  const data = await res.json();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const userId = typeof payload?.userId === "string" ? payload.userId : "";
  const role = payload?.role === "admin" ? "admin" : payload?.role === "user" ? "user" : "";

  if (!userId || !role) {
    return NextResponse.json({ error: "Missing role update fields" }, { status: 400 });
  }

  if (process.env.MONGODB_URI) {
    await connectMongoose();

    try {
      const result = await UserModel.updateOne({ _id: userId }, { $set: { role } });
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }
  }

  const res = await fetch(`${SERVER_URL}/api/v1/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}