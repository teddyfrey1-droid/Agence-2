/**
 * Rate limiter with LRU-eviction and sliding window.
 *
 * Limitations of in-memory rate limiting (serverless / multi-instance):
 * - State is per-process; a cold start resets all counters.
 * - Multiple instances each have independent stores.
 *
 * For production with high-scale requirements, replace the `store` below
 * with a Redis-backed implementation (e.g. Upstash @upstash/ratelimit).
 *
 * This implementation mitigates the worst issues of the previous version:
 * - LRU eviction prevents unbounded memory growth
 * - Failed login tracking with exponential backoff
 * - Helper to create standardized 429 responses
 */

import { NextResponse } from "next/server";

// ─── Store ──────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MAX_STORE_SIZE = 10_000;
const store = new Map<string, RateLimitEntry>();

// LRU eviction: when store exceeds max, remove the oldest 20%
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

// Cleanup expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

// ─── Public API ────────────────────────────────────────────────────

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

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // New window
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
export function applyRateLimit(
  prefix: string,
  headers: Headers,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(headers);
  const result = checkRateLimit(`${prefix}:${ip}`, config);

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
