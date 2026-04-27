import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, courseName, price, customerEmail, videoUrl } = body;

    if (!courseName || !price) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: courseName },
            unit_amount: Math.round(price * 100), // দশমিক এড়াতে round ব্যবহার করুন
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: typeof customerEmail === 'string' && customerEmail.trim() ? customerEmail.trim() : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/course/${courseId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/course/${courseId}?canceled=true`,
      metadata: {
        courseId,
        videoUrl: typeof videoUrl === 'string' ? videoUrl.trim() : '',
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: unknown) {
    console.error("[STRIPE_ERROR]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}