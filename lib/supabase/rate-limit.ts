import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { serverEnv } from "@/lib/env";
import { allowMissingAbuseControls } from "@/lib/supabase/abuse-controls";

const localHits = new Map<string, number[]>();

function localLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (localHits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  localHits.set(key, recent);
  return true;
}

function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkWriteRateLimit(request: Request, userId: string) {
  const env = serverEnv();
  const ip = requestIp(request);

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (!allowMissingAbuseControls()) {
      return { allowed: false, status: 503, error: "Rate limiting is unavailable." };
    }
    const allowed = localLimit(`user:${userId}`, 10, 60_000) && localLimit(`ip:${ip}`, 30, 60_000);
    return { allowed, status: allowed ? 200 : 429, error: "Too many requests." };
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  const userLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "atl-dog-parks:writes:user",
  });
  const ipLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "atl-dog-parks:writes:ip",
  });

  try {
    const [userResult, ipResult] = await Promise.all([
      userLimiter.limit(userId),
      ipLimiter.limit(ip),
    ]);
    const allowed = userResult.success && ipResult.success;
    return { allowed, status: allowed ? 200 : 429, error: "Too many requests." };
  } catch {
    if (!allowMissingAbuseControls()) {
      return { allowed: false, status: 503, error: "Rate limiting is unavailable." };
    }
    const allowed = localLimit(`user:${userId}`, 10, 60_000) && localLimit(`ip:${ip}`, 30, 60_000);
    return { allowed, status: allowed ? 200 : 429, error: "Too many requests." };
  }
}
