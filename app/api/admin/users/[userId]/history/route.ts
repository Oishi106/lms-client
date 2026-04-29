import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { connectMongoose } from "@/app/lib/mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await params;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    await connectMongoose();
    const { LoginEventModel } = await import("@/app/lib/models/LoginEvent");
    const events = await LoginEventModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const timestamps = events.map((e: { createdAt?: Date | string }) =>
      e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString()
    );
    return NextResponse.json({ ok: true, events: timestamps });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}