import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - Stripe types for apiVersion conflict with this project's TS config
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, courseName, price, customerEmail, videoUrl } = body;

    if (!courseName || !price) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // ডাইনামিক অরিজিন ডিটেকশন (লোকালহোস্ট না ভার্সেল সেটা অটোমেটিক ধরবে)
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://lms-client-ne5a.vercel.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: courseName },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: typeof customerEmail === 'string' && customerEmail.trim() ? customerEmail.trim() : undefined,
      // সাকসেস এবং ক্যানসেল ইউআরএল ফিক্স
      success_url: `${origin}/course/${courseId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/course/${courseId}?canceled=true`,
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