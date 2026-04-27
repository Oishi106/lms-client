import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { writeStoredOrder } from '@/app/lib/order-store';
import { connectMongoose } from '@/app/lib/mongoose';
import { CourseOrderModel } from '@/app/lib/models/CourseOrder';
import type { PendingCheckout } from '@/app/lib/payments-data';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
    const pendingOrder = body?.order as PendingCheckout | undefined;

    if (!sessionId && !pendingOrder) {
      return NextResponse.json({ error: 'Missing sessionId or order' }, { status: 400 });
    }

    if (pendingOrder) {
      const savedOrder = {
        id: `pending-${pendingOrder.courseId}-${pendingOrder.createdAt}`,
        courseId: pendingOrder.courseId,
        courseTitle: pendingOrder.courseTitle,
        amount: pendingOrder.amount,
        buyerName: pendingOrder.buyerName,
        buyerEmail: pendingOrder.buyerEmail,
        videoUrl: pendingOrder.videoUrl,
        createdAt: pendingOrder.createdAt,
        status: 'paid' as const,
        source: 'real' as const,
      };

      if (process.env.MONGODB_URI) {
        await connectMongoose();
        await CourseOrderModel.updateOne(
          { orderId: savedOrder.id },
          {
            $setOnInsert: {
              orderId: savedOrder.id,
              courseId: savedOrder.courseId,
              courseTitle: savedOrder.courseTitle,
              amount: savedOrder.amount,
              buyerName: savedOrder.buyerName,
              buyerEmail: savedOrder.buyerEmail,
              videoUrl: savedOrder.videoUrl,
              status: 'paid',
              source: 'real',
            },
          },
          { upsert: true }
        );
      } else {
        await writeStoredOrder(savedOrder);
      }

      return NextResponse.json({ ok: true, order: savedOrder });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const lineItem = session.line_items?.data?.[0];
    const product = lineItem?.price?.product as Stripe.Product | string | null | undefined;
    const courseTitle = typeof product === 'object' && product && 'name' in product ? String(product.name ?? 'Course') : 'Course';
    const amount = typeof lineItem?.amount_total === 'number'
      ? `$${(lineItem.amount_total / 100).toFixed(0)}`
      : session.amount_total
        ? `$${(session.amount_total / 100).toFixed(0)}`
        : '$0';

    const savedOrder = {
      id: session.id,
      courseId: String(session.metadata?.courseId ?? 'unknown-course'),
      courseTitle,
      amount,
      buyerName: session.customer_details?.name?.trim() || session.customer_details?.email?.trim() || 'Paid User',
      buyerEmail: session.customer_details?.email?.trim() || 'unknown@example.com',
      videoUrl: typeof session.metadata?.videoUrl === 'string' ? session.metadata.videoUrl.trim() : undefined,
      createdAt: typeof session.created === 'number' ? session.created * 1000 : Date.now(),
      status: 'paid' as const,
      source: 'real' as const,
    };

    if (process.env.MONGODB_URI) {
      await connectMongoose();
      await CourseOrderModel.updateOne(
        { orderId: savedOrder.id },
        {
          $setOnInsert: {
            orderId: savedOrder.id,
            courseId: savedOrder.courseId,
            courseTitle: savedOrder.courseTitle,
            amount: savedOrder.amount,
            buyerName: savedOrder.buyerName,
            buyerEmail: savedOrder.buyerEmail,
            videoUrl: savedOrder.videoUrl,
            status: 'paid',
            source: 'real',
          },
        },
        { upsert: true }
      );
    } else {
      await writeStoredOrder(savedOrder);
    }

    return NextResponse.json({ ok: true, order: savedOrder });
  } catch (error) {
    console.error('[CHECKOUT_CONFIRM_ERROR]', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
