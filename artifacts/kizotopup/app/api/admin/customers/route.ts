import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/**
 * Aggregated customer list. Groups orders by customerEmail or customerPhone
 * (whichever is present) and returns lifetime value + order counts.
 */
export async function GET() {
  // Pull raw orders (bounded) and aggregate in memory â€” SQLite friendly.
  const orders = await prisma.order.findMany({
    take: 5000,
    orderBy: { createdAt: "desc" },
    select: {
      customerEmail: true,
      customerPhone: true,
      playerUid: true,
      amountUsd: true,
      status: true,
      createdAt: true,
    },
  });

  const map = new Map<
    string,
    {
      key: string;
      email: string | null;
      phone: string | null;
      totalOrders: number;
      paidOrders: number;
      lifetimeUsd: number;
      lastOrderAt: Date;
      uids: Set<string>;
    }
  >();

  for (const o of orders) {
    const key = o.customerEmail || o.customerPhone || `uid:${o.playerUid}`;
    const existing = map.get(key);
    const isPaid = ["PAID", "PROCESSING", "DELIVERED"].includes(o.status);
    if (existing) {
      existing.totalOrders += 1;
      if (isPaid) existing.paidOrders += 1;
      if (isPaid) existing.lifetimeUsd += o.amountUsd;
      if (o.createdAt > existing.lastOrderAt) existing.lastOrderAt = o.createdAt;
      existing.uids.add(o.playerUid);
    } else {
      map.set(key, {
        key,
        email: o.customerEmail,
        phone: o.customerPhone,
        totalOrders: 1,
        paidOrders: isPaid ? 1 : 0,
        lifetimeUsd: isPaid ? o.amountUsd : 0,
        lastOrderAt: o.createdAt,
        uids: new Set([o.playerUid]),
      });
    }
  }

  const customers = [...map.values()]
    .map((c) => ({
      key: c.key,
      email: c.email,
      phone: c.phone,
      totalOrders: c.totalOrders,
      paidOrders: c.paidOrders,
      lifetimeUsd: Math.round(c.lifetimeUsd * 100) / 100,
      lastOrderAt: c.lastOrderAt,
      uidCount: c.uids.size,
    }))
    .sort((a, b) => b.lifetimeUsd - a.lifetimeUsd);

  return NextResponse.json({ customers, total: customers.length });
}
