import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { verifyWebhook, PaymentMethod } from "@/lib/payment";
import { notifyTelegram, escapeHtml } from "@/lib/telegram";
import { NextRequest, NextResponse } from "next/server";

// KHPay webhook receiver.
//   URL:     /api/payment/webhook/khpay
//   Events:  payment.paid | payment.expired | payment.failed
//   Signing: HMAC-SHA256 of raw body using your webhook secret
//            delivered in the `X-Webhook-Signature: sha256=<hex>` header.
//
// The route is parameterized so legacy paths still resolve; unknown methods
// are rejected with 400.

export async function POST(
  req: NextRequest,
  { params }: { params: { method: string } }
) {
  const method = params.method.toUpperCase() as PaymentMethod;

  if (method !== "KHPAY") {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });

  const valid = verifyWebhook(method, rawBody, headers);
  if (!valid) {
    console.warn(`[webhook] Invalid signature from ${method}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // KHPay payload shape:
  // { event: "payment.paid", data: { transaction_id, amount, currency, metadata, ... }, timestamp }
  const event: string = payload.event || "";
  const data = payload.data || {};

  // KHPay sends a test ping to verify the endpoint is reachable — always return 200
  if (event === "webhook.test") {
    return NextResponse.json({ ok: true, received: "webhook.test" });
  }

  const transactionId: string | undefined = data.transaction_id;
  // We set metadata.order_number when creating the QR (see lib/payment.ts)
  const orderNumber: string | undefined =
    data.metadata?.order_number || data.metadata?.orderNumber;

  if (!orderNumber && !transactionId) {
    return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
  }

  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber } })
    : await prisma.order.findFirst({ where: { paymentRef: transactionId! } });

  // Return 200 even for unknown orders to avoid KHPay retrying indefinitely
  if (!order) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Idempotency: do nothing if already in a terminal state
  if (order.status !== "PENDING") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (event === "payment.paid") {
    // Verify amount matches to prevent tampering
    const paidAmount = parseFloat(String(data.amount ?? "0"));
    if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - order.amountUsd) > 0.01) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          failureReason: `Amount mismatch: got ${paidAmount}, expected ${order.amountUsd}`,
        },
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentRef: transactionId || order.paymentRef,
      },
    });

    // Fire-and-forget Telegram notification to the operator.
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { game: true, product: true },
    });
    if (fullOrder) {
      const baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
      const link = baseUrl ? `\n<a href="${baseUrl}/admin/orders/${fullOrder.orderNumber}">Open in admin</a>` : "";
      await notifyTelegram(
        `ðŸ’° <b>New paid order</b>\n` +
          `<b>#${escapeHtml(fullOrder.orderNumber)}</b>\n` +
          `${escapeHtml(fullOrder.game.name)} â€” ${escapeHtml(fullOrder.product.name)}\n` +
          `UID: <code>${escapeHtml(fullOrder.playerUid)}</code>\n` +
          `Amount: $${fullOrder.amountUsd.toFixed(2)}${link}`
      );
    }
    // TODO: enqueue fulfillment job (call game distributor API) here.
  } else if (event === "payment.expired" || event === "payment.failed") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "FAILED",
        failureReason: `KHPay: ${event}`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
