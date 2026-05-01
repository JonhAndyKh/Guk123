/**
 * Game-specific UID → in-game nickname lookup.
 *
 * Uses the community API at api.isan.eu.org (no auth, best-effort).
 * Every function has a 5 s timeout and catches all errors → returns null.
 */

// ---------- helpers ----------

interface IsanResponse {
  success?: boolean;
  name?: string;
  message?: string;
}

async function fetchIsan(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data: IsanResponse = await res.json();
    if (data.success && data.name) return data.name;
    return null;
  } catch {
    return null;
  }
}

// ---------- per-game lookups ----------

export async function lookupMobileLegends(
  uid: string,
  zone: string,
): Promise<string | null> {
  return fetchIsan(
    `https://api.isan.eu.org/nickname/ml/${encodeURIComponent(uid)}/${encodeURIComponent(zone)}`,
  );
}

export async function lookupFreeFire(uid: string): Promise<string | null> {
  // CamRapidSecure FreeFire validator
  // GET https://v1.camrapidx.com/validate_user/FreeFire_LevelUpPass.php?UserID=<uid>
  // Returns: { status: "APPROVED", username: "PlayerName#", ... }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://v1.camrapidx.com/validate_user/FreeFire_LevelUpPass.php?UserID=${encodeURIComponent(uid)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "KIZOTOPUP/1.0",
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );
    clearTimeout(timer);

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    if (!data || data.status !== "APPROVED") return null;

    if (typeof data.username === "string" && data.username.length > 0) {
      return data.username;
    }
    return null;
  } catch {
    return null;
  }
}

export async function lookupGenshin(
  _uid: string,
  _server?: string,
): Promise<string | null> {
  // Stub — upstream doesn't reliably return names for Genshin
  return null;
}

export async function lookupHonkaiStarRail(
  _uid: string,
  _server?: string,
): Promise<string | null> {
  // Stub — upstream doesn't reliably return names for HSR
  return null;
}

// ---------- router ----------

/**
 * Looks up the in-game nickname for a given game + UID + optional server.
 * Returns the nickname string or null if lookup is unsupported / fails.
 */
export async function lookupNickname(
  gameSlug: string,
  uid: string,
  server?: string,
): Promise<string | null> {
  switch (gameSlug) {
    case "mobile-legends":
      return server ? lookupMobileLegends(uid, server) : null;
    case "free-fire":
      return lookupFreeFire(uid);
    case "genshin-impact":
      return lookupGenshin(uid, server);
    case "honkai-star-rail":
      return lookupHonkaiStarRail(uid, server);
    default:
      return null;
  }
}
