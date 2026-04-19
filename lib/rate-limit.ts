/**
 * Rate limiter with pluggable backend.
 *
 * **In production**, set the following environment variables to use Redis
 * (Upstash) for cross-instance, serverless-safe rate limiting:
 *
 *   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxx
 *
 * Then install the package:  npm install @upstash/redis
 *
 * When the env vars are missing (dev / preview), an in-memory fallback is
 * used.  The in-memory store is per-process and resets on cold starts, so it
 * does NOT provide real protection in serverless environments.
 *
 * ---
 * Features:
 * - LRU eviction prevents unbounded memory growth (in-memory mode)
 * - Preset configs for login, registration, password reset, public forms
 * - Standardized 429 response builder with Retry-After headers
 */

import { NextResponse } from "next/server";

// ─── Store interface ──────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── Redis Store (Upstash) ────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = !!(UPSTASH_URL && UPSTASH_TOKEN);

/**
 * Lightweight Upstash Redis REST client — avoids importing @upstash/redis
 * so the package is truly optional.  Uses a sliding-window counter stored
 * as a single key with a TTL equal to the rate-limit window.
 */
async function redisCheckRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rl:${identifier}`;
  const now = Date.now();

  // INCR + conditional EXPIRE in a pipeline
  const pipeline = [
    ["INCR", key],
    ["PTTL", key],
  ];

  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
  });

  if (!res.ok) {
    // Redis unreachable — fail open (allow the request)
    console.error("[RATE-LIMIT] Upstash error:", res.status);
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowSeconds * 1000 };
  }

  const results = (await res.json()) as { result: number }[];
  const count = results[0].result;
  const pttl = results[1].result;

  // If key is new (count === 1) or has no TTL, set the expiry
  if (count === 1 || pttl < 0) {
    await fetch(`${UPSTASH_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["PEXPIRE", key, String(config.windowSeconds * 1000)]),
    });
  }

  const resetAt = now + (pttl > 0 ? pttl : config.windowSeconds * 1000);
  const allowed = count <= config.maxRequests;

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - count),
    resetAt,
  };
}

// ─── In-memory Store (fallback) ───────────────────────────────────

const MAX_STORE_SIZE = 10_000;
const store = new Map<string, RateLimitEntry>();

function evictIfNeeded() {
  if (store.size <= MAX_STORE_SIZE) return;
  const toRemove = Math.floor(MAX_STORE_SIZE * 0.2);
  const iterator = store.keys();
  for (let i = 0; i < toRemove; i++) {
    const { value, done } = iterator.next();
    if (done) break;
    store.delete(value);
  }
}

// Cleanup expired entries periodically (only in long-lived processes)
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 60_000;
  const globalStore = globalThis as unknown as { __rateLimitCleanup?: ReturnType<typeof setInterval> };
  if (!globalStore.__rateLimitCleanup) {
    globalStore.__rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }, CLEANUP_INTERVAL);
  }
}

function memoryCheckRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    evictIfNeeded();
    const resetAt = now + config.windowSeconds * 1000;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// ─── Unified check ────────────────────────────────────────────────

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (useRedis) {
    return redisCheckRateLimit(identifier, config);
  }
  return memoryCheckRateLimit(identifier, config);
}

// ─── Preset configurations ────────────────────────────────────────

/** Login: 5 attempts per 15 minutes per IP */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 15 * 60,
};

/** Registration: 3 accounts per hour per IP */
export const REGISTER_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60,
};

/** Password reset: 3 requests per 15 minutes per IP */
export const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 15 * 60,
};

/** Public forms: 5 submissions per minute per IP */
export const PUBLIC_FORM_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 60,
};

// ─── IP extraction ─────────────────────────────────────────────────

/**
 * Extract client IP from request headers.
 * In production behind a trusted proxy (Vercel, Cloudflare), x-forwarded-for
 * is reliable. For direct exposure, this can be spoofed.
 */
export function getClientIp(headers: Headers): string {
  // Vercel-specific header (most reliable on Vercel)
  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return headers.get("x-real-ip") || "unknown";
}

// ─── Response helper ───────────────────────────────────────────────

/**
 * Apply rate limiting and return a 429 response if exceeded.
 * Returns null if the request is allowed.
 */
export async function applyRateLimit(
  prefix: string,
  headers: Headers,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const ip = getClientIp(headers);
  const result = await checkRateLimit(`${prefix}:${ip}`, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
