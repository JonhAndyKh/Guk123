import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const settingsSchema = z.object({
  siteName: z.string().min(1).optional(),
  exchangeRate: z.number().positive().optional(),
  supportTelegram: z.string().optional(),
  supportEmail: z.string().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().nullable().optional(),
  announcement: z.string().nullable().optional(),
  announcementTone: z.enum(["info", "warning", "promo"]).nullable().optional(),
  telegramBotToken: z.string().nullable().optional(),
  telegramChatId: z.string().nullable().optional(),
});

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });
  return NextResponse.json(settings);
}
