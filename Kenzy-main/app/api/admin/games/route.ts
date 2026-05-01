import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Accept either a full http(s) URL or a local uploaded path like /uploads/xxx.png
const imagePath = z
  .string()
  .min(1)
  .refine(
    (v) => /^https?:\/\//i.test(v) || v.startsWith("/uploads/") || v.startsWith("/"),
    { message: "Must be a URL or uploaded file path" }
  );

const gameSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  publisher: z.string().min(1),
  description: z.string().optional(),
  imageUrl: imagePath,
  bannerUrl: imagePath.optional().or(z.literal("")),
  currencyName: z.string().min(1),
  uidLabel: z.string().default("Player ID"),
  uidExample: z.string().optional(),
  requiresServer: z.boolean().default(false),
  servers: z.string().default("[]"),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const games = await prisma.game.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true, orders: true } } },
  });
  return NextResponse.json(games);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = gameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const game = await prisma.game.create({ data: parsed.data });
    return NextResponse.json(game);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    throw err;
  }
}
