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

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  publisher: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: imagePath.optional(),
  bannerUrl: imagePath.optional().or(z.literal("")),
  currencyName: z.string().min(1).optional(),
  uidLabel: z.string().optional(),
  uidExample: z.string().optional(),
  requiresServer: z.boolean().optional(),
  servers: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const game = await prisma.game.findUnique({
    where: { id: params.id },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(game);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const game = await prisma.game.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(game);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.game.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
