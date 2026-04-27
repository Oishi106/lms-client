import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth-options";
import { connectMongoose } from "@/app/lib/mongoose";
import { CourseOrderModel } from "@/app/lib/models/CourseOrder";
import { readStoredOrders, writeStoredOrder } from "@/app/lib/order-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.MONGODB_URI) {
    const orders = await readStoredOrders();
    return NextResponse.json({ ok: true, orders });
  }

  try {
    await connectMongoose();
    const docs = await CourseOrderModel.find().sort({ createdAt: -1 }).limit(500).lean();
    const orders = docs.map((doc) => ({
      id: doc.orderId,
      courseId: doc.courseId,
      courseTitle: doc.courseTitle,
      amount: doc.amount,
      buyerName: doc.buyerName,
      buyerEmail: doc.buyerEmail,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.getTime() : new Date(doc.createdAt).getTime(),
      status: doc.status,
      source: doc.source ?? "real",
    }));

    return NextResponse.json({ ok: true, orders });
  } catch {
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const orderId = typeof payload.id === "string" ? payload.id : typeof payload.orderId === "string" ? payload.orderId : "";
  const courseId = typeof payload.courseId === "string" ? payload.courseId : "";
  const courseTitle = typeof payload.courseTitle === "string" ? payload.courseTitle : "";
  const amount = typeof payload.amount === "string" ? payload.amount : "";
  const buyerName = typeof payload.buyerName === "string" ? payload.buyerName : "";
  const buyerEmail = typeof payload.buyerEmail === "string" ? payload.buyerEmail : "";

  if (!orderId || !courseId || !courseTitle || !amount || !buyerName || !buyerEmail) {
    return NextResponse.json({ error: "Missing order fields" }, { status: 400 });
  }

  if (!process.env.MONGODB_URI) {
    const savedOrder = {
      id: orderId,
      courseId,
      courseTitle,
      amount,
      buyerName,
      buyerEmail,
      createdAt: Date.now(),
      status: "paid" as const,
      source: "real" as const,
    };

    await writeStoredOrder(savedOrder);
    return NextResponse.json({ ok: true });
  }

  try {
    await connectMongoose();
    await CourseOrderModel.updateOne(
      { orderId },
      {
        $setOnInsert: {
          orderId,
          courseId,
          courseTitle,
          amount,
          buyerName,
          buyerEmail,
          status: "paid",
          source: "real",
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}
