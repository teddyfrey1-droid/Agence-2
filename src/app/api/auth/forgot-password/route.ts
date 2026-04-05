import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true, message: "Si un compte existe, un email a été envoyé." });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, user.firstName, token);

    return NextResponse.json({ success: true, message: "Si un compte existe, un email a été envoyé." });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
