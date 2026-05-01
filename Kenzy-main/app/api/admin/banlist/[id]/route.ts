import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { writeAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.blockedIdentity.delete({ where: { id: params.id } });
  await writeAudit({ action: "banlist.remove", targetType: "banlist", targetId: params.id });
  return NextResponse.json({ ok: true });
}
