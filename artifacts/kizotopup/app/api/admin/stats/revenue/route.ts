import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/**
 * Revenue summary for the last N days.
 * Returns daily buckets and the top-5 products by revenue.
 */
export async function GET(req: NextRequest) {
  const days = Math.min(365, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "30")));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const paid = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "PROCESSING", "DELIVERED"] },
      paidAt: { gte: since },
    },
    select: {
      amountUsd: true,
      paidAt: true,
      productId: true,
      product: { select: { name: true } },
      game: { select: { name: true } },
    },
  });

  const buckets = new Map<string, { date: string; count: number; revenue: number }>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, count: 0, revenue: 0 });
  }

  const productAgg = new Map<string, { name: string; game: string; count: number; revenue: number }>();

  for (const o of paid) {
    if (!o.paidAt) continue;
    const key = o.paidAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.count += 1;
      b.revenue += o.amountUsd;
    }
    const pk = o.productId;
    const existing = productAgg.get(pk);
    if (existing) {
      existing.count += 1;
      existing.revenue += o.amountUsd;
    } else {
      productAgg.set(pk, {
        name: o.product?.name ?? "â€”",
        game: o.game?.name ?? "â€”",
        count: 1,
        revenue: o.amountUsd,
      });
    }
  }

  const daily = [...buckets.values()]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((b) => ({ ...b, revenue: Math.round(b.revenue * 100) / 100 }));

  const topProducts = [...productAgg.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

  const totalRevenue = Math.round(paid.reduce((s, o) => s + o.amountUsd, 0) * 100) / 100;

  return NextResponse.json({ days, totalRevenue, totalOrders: paid.length, daily, topProducts });
}
