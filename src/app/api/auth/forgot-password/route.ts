import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { applyRateLimit, PASSWORD_RESET_RATE_LIMIT } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

// Anti-enumeration:
// - Same response body and 200 status whether the account exists or not
// - Same response time floor (constant-time-ish): we wait until at least
//   `MIN_RESPONSE_MS` has elapsed before responding so timing analysis
//   can't separate the "user exists / send email" branch from the
//   "no-op" branch.
// - Email send is fire-and-forget so a slow SMTP doesn't leak signal.
const MIN_RESPONSE_MS = 600;
const NEUTRAL_RESPONSE = {
  success: true as const,
  message: "Si un compte existe, un email vient de vous être envoyé.",
};

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  // Floor any branch to MIN_RESPONSE_MS, regardless of error or success.
  const respondNeutral = async (status = 200) => {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
    }
    return NextResponse.json(NEUTRAL_RESPONSE, { status });
  };

  try {
    // Rate limit: 3 password reset requests per 15 minutes per IP
    const rateLimited = await applyRateLimit("auth-forgot-password", request.headers, PASSWORD_RESET_RATE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      // Even malformed input gets the neutral response — no enumeration
      // and no leak of which validator failed.
      return respondNeutral();
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.isActive) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        },
      });

      // Fire-and-forget — do not await. SMTP latency is not allowed to
      // leak whether the user exists.
      sendPasswordResetEmail(user.email, user.firstName, token).catch((err) => {
        console.error("[forgot-password] mail send failed", err);
      });
    }

    return respondNeutral();
  } catch (err) {
    console.error("[forgot-password] error", err);
    // Same neutral response on internal errors — don't surface 500 timing
    return respondNeutral();
  }
}
