import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

import { writeAudit } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/admin/orders/bulk â€” wipes orders matching the given filter.
 *
 * Body (all optional):
 *   { status?: "PENDING" | ... | "ALL", confirm: "DELETE" }
 *
 * Without `confirm: "DELETE"` the request is refused â€” this is a destructive
 * operation and we don't want it triggered by accident or by a bug in a client.
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: "Missing confirmation. Resend with { confirm: 'DELETE' }." },
      { status: 400 }
    );
  }

  const status = typeof body.status === "string" ? body.status : "ALL";
  const where = status === "ALL" ? undefined : { status };

  const result = await prisma.order.deleteMany({ where });

  await writeAudit({
    action: "orders.bulk_delete",
    targetType: "order",
    details: `Deleted ${result.count} orders (filter: ${status})`,
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
