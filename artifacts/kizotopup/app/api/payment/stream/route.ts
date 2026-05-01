import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KHPAY_BASE = (process.env.KHPAY_BASE_URL || "https://khpay.site/api/v1").trim();
const KHPAY_KEY = (process.env.KHPAY_API_KEY || "").trim();

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order");
  if (!orderNumber) {
    return new Response("Missing order parameter", { status: 400 });
  }

  // Look up the order to get the KHPay transaction ID
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    select: { paymentRef: true, status: true },
  });

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  // Don't stream for sim mode, missing key, or already-done orders
  const transactionId = order.paymentRef;
  const terminalStatuses = ["PAID", "PROCESSING", "DELIVERED", "FAILED", "CANCELLED", "REFUNDED"];
  if (
    !KHPAY_KEY ||
    !transactionId ||
    transactionId.startsWith("SIM-") ||
    terminalStatuses.includes(order.status)
  ) {
    // Return a closed stream immediately
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: {\"event\":\"close\"}\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Proxy the KHPay SSE stream
  const upstreamUrl = `${KHPAY_BASE}/stream?token=${encodeURIComponent(KHPAY_KEY)}&txn=${encodeURIComponent(transactionId)}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      headers: {
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new Response("Failed to connect to payment stream", { status: 502 });
  }

  if (!upstreamRes.ok || !upstreamRes.body) {
    return new Response("Payment stream unavailable", { status: 502 });
  }

  // Pipe the upstream SSE directly to the client
  return new Response(upstreamRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
