type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const key = `${scope}:${getIp(request)}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true };
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  limit = 20,
  windowMs = 15 * 60 * 1000,
) {
  const result = rateLimit(request, scope, limit, windowMs);
  if (!result.ok) {
    return Response.json(
      {
        error: "Too many requests. Please wait a moment and try again.",
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfter) },
      },
    );
  }
  return null;
}
