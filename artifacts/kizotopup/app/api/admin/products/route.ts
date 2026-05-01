import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.object({
  gameId: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().int().min(0),
  bonus: z.number().int().min(0).default(0),
  priceUsd: z.number().positive(),
  badge: z.string().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get("gameId");
  const products = await prisma.product.findMany({
    where: gameId ? { gameId } : undefined,
    include: { game: { select: { name: true, slug: true } } },
    orderBy: [{ game: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product);
}
