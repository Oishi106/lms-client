import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { connectMongoose } from "@/app/lib/mongoose";
import { UserModel } from "@/app/lib/models/User";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
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

    const users = docs.map((doc) => ({
      id: (doc as any)._id.toString(),
      name: (doc as any).name,
      email: (doc as any).email,
      role: (doc as any).role,
      initials: (doc as any).initials,
      authProvider: (doc as any).authProvider ?? "credentials",
      lastLoginAt: (doc as any).lastLoginAt ?? null,
      loginCount: (doc as any).loginCount ?? 0,
      lastLoginProvider: (doc as any).lastLoginProvider ?? null,
      createdAt: (doc as any).createdAt,
    }));

    try {
      const { LoginEventModel } = await import("@/app/lib/models/LoginEvent");
      const ids = users.map((u) => u.id);
      const events = await LoginEventModel.find({ userId: { $in: ids } })
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean();

      const map = new Map<string, string[]>();
      for (const ev of events) {
        const list = map.get(ev.userId) || [];
        list.push((ev as any).createdAt?.toISOString?.() || new Date().toISOString());
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
    } catch (err) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
  }

  const res = await fetch(`${SERVER_URL}/api/v1/admin/users/${userId}`, {
    method: "DELETE",
  });

  const data = await res.json();
  return NextResponse.json(data);
}