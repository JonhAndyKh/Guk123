import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { z } from "zod";

export const runtime = "nodejs";

// In-game ID â†’ nickname check.
// Upstream: https://api.isan.eu.org (community-run; no auth, best-effort).
//
// Route is public (used by the checkout form) but intentionally narrow:
// we only forward a fixed set of game slugs and strip out anything else.

const schema = z.object({
  slug: z.enum(["mobile-legends", "genshin-impact", "honkai-star-rail"]),
  uid: z.string().regex(/^\d{5,12}$/, "UID must be 5â€“12 digits"),
  serverId: z.string().regex(/^\d{1,6}$/, "Server/Zone must be digits").optional(),
});

// Maps our game slugs â†’ isan endpoint path + whether a server param is needed.
const UPSTREAM: Record<
  z.infer<typeof schema>["slug"],
  { path: string; needsServer: boolean }
> = {
  "mobile-legends":    { path: "/nickname/ml",      needsServer: true  },
  "genshin-impact":    { path: "/nickname/genshin", needsServer: true  },
  "honkai-star-rail":  { path: "/nickname/starrail", needsServer: true },
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }
  const { slug, uid, serverId } = parsed.data;
  const cfg = UPSTREAM[slug];

  if (cfg.needsServer && !serverId) {
    return NextResponse.json(
      { success: false, error: "Server/Zone ID is required for this game" },
      { status: 400 }
    );
  }

  // api.isan.eu.org uses path-style params, not query string:
  //   /nickname/ml/{userId}/{zoneId}
  //   /nickname/genshin/{uid}/{server}
  const segments = [encodeURIComponent(uid)];
  if (serverId) segments.push(encodeURIComponent(serverId));
  const upstreamUrl = `https://api.isan.eu.org${cfg.path}/${segments.join("/")}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data: unknown = await res.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, error: "Upstream lookup failed" },
        { status: 502 }
      );
    }

    // isan.eu.org shape: { success: bool, name?: string, message?: string }
    const d = data as { success?: boolean; name?: string; message?: string };
    if (!d.success || !d.name) {
      // Upstream validates the id/server combo â€” treat any non-success as "not found".
      const msg = d.message && d.message.toLowerCase() !== "bad request"
        ? d.message
        : "Player not found â€” check your ID and zone.";
      return NextResponse.json(
        { success: false, error: msg },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      name: d.name,
      uid,
      serverId: serverId ?? null,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { success: false, error: aborted ? "Lookup timed out" : "Network error" },
      { status: 504 }
    );
  }
}
