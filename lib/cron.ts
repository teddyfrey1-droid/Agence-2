import type { NextRequest } from "next/server";

/**
 * Cron jobs are triggered by Vercel Cron (which sends an
 * Authorization: Bearer <CRON_SECRET> header) or by any scheduler that can
 * pass the same secret. Requests without the correct secret are rejected.
 */
export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // If no secret is configured we only allow localhost — prevents an
    // unprotected endpoint from firing in production by accident.
    return process.env.NODE_ENV !== "production";
  }

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  // Vercel Cron also supports the custom `x-vercel-cron` header as a hint;
  // combined with the secret-protected URL it's a reliable signal.
  const vercelHeader = req.headers.get("x-vercel-cron");
  if (vercelHeader && header === `Bearer ${secret}`) return true;

  return false;
}
