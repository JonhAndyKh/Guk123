import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { z } from "zod";
import {
  verifyAdminCredentials,
  createSession,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const admin = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession(admin);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, email: admin.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[admin/auth] login failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
