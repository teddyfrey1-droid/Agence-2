import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvitationEmail, sendPasswordResetEmail } from "@/lib/email";

const updateUserSchema = z.object({
  action: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["SUPER_ADMIN", "DIRIGEANT", "ASSOCIE", "MANAGER", "AGENT", "ASSISTANT", "CLIENT"]).optional(),
  password: z.string().min(6, "6 caractères minimum").optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "user", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Données invalides" }, { status: 400 });
    }

    const { action, email, firstName, lastName, phone, role, password } = parsed.data;

    // Prevent self-modification for critical actions
    if (id === session.userId && (action === "block" || role)) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre compte" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // ─── Block/Unblock ─────────────────────────────────────
    if (action === "block") {
      await prisma.user.update({ where: { id }, data: { isActive: false } });
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "BLOCK_USER",
          entity: "user",
          entityId: id,
          details: "Compte bloqué",
        },
      });
      return NextResponse.json({ success: true, message: "Utilisateur bloqué" });
    }

    if (action === "unblock") {
      await prisma.user.update({ where: { id }, data: { isActive: true } });
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "UNBLOCK_USER",
          entity: "user",
          entityId: id,
          details: "Compte débloqué",
        },
      });
      return NextResponse.json({ success: true, message: "Utilisateur débloqué" });
    }

    // ─── Send invitation ───────────────────────────────────
    if (action === "invite") {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

      await prisma.user.update({
        where: { id },
        data: {
          invitationToken: token,
          invitationExpiresAt: expiresAt,
          invitedAt: new Date(),
        },
      });

      const emailSent = await sendInvitationEmail(user.email, user.firstName, token);
      if (!emailSent) {
        return NextResponse.json({ error: "Erreur lors de l'envoi de l'email. Vérifiez la configuration Brevo." }, { status: 500 });
      }

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "INVITE_USER",
          entity: "user",
          entityId: id,
          details: `Invitation envoyée à ${user.email}`,
        },
      });
      return NextResponse.json({ success: true, message: "Invitation envoyée" });
    }

    // ─── Send password reset ───────────────────────────────
    if (action === "reset_password") {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await prisma.user.update({
        where: { id },
        data: {
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const emailSent = await sendPasswordResetEmail(user.email, user.firstName, token);
      if (!emailSent) {
        return NextResponse.json({ error: "Erreur lors de l'envoi de l'email. Vérifiez la configuration Brevo." }, { status: 500 });
      }

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "RESET_PASSWORD_ADMIN",
          entity: "user",
          entityId: id,
          details: `Email de réinitialisation envoyé à ${user.email}`,
        },
      });
      return NextResponse.json({ success: true, message: "Email de réinitialisation envoyé" });
    }

    // ─── General update (email, role, name, phone, password) ──
    const updateData: Record<string, unknown> = {};
    const changes: string[] = [];

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Un utilisateur existe déjà avec cet email" }, { status: 409 });
      }
      updateData.email = email;
      changes.push(`email: ${user.email} → ${email}`);
    }

    if (firstName && firstName !== user.firstName) {
      updateData.firstName = firstName;
      changes.push(`prénom: ${user.firstName} → ${firstName}`);
    }

    if (lastName && lastName !== user.lastName) {
      updateData.lastName = lastName;
      changes.push(`nom: ${user.lastName} → ${lastName}`);
    }

    if (phone !== undefined) {
      updateData.phone = phone;
      changes.push("téléphone modifié");
    }

    if (role && role !== user.role) {
      if (!hasPermission(session.role, "user", "manage_users")) {
        return NextResponse.json({ error: "Permission refusée pour changer le rôle" }, { status: 403 });
      }
      updateData.role = role;
      changes.push(`rôle: ${user.role} → ${role}`);
    }

    if (password) {
      if (!hasPermission(session.role, "user", "manage_users")) {
        return NextResponse.json({ error: "Permission refusée pour changer le mot de passe" }, { status: 403 });
      }
      updateData.passwordHash = await hash(password, 12);
      changes.push("mot de passe modifié");
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    await prisma.user.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE_USER",
        entity: "user",
        entityId: id,
        details: `Modification: ${changes.join(", ")}`,
      },
    });

    return NextResponse.json({ success: true, message: "Utilisateur mis à jour" });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "user", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;

    if (id === session.userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "DELETE_USER",
        entity: "user",
        entityId: id,
        details: `Suppression utilisateur: ${user.firstName} ${user.lastName} (${user.email})`,
      },
    });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Utilisateur supprimé" });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// ─── GET user details with permissions ──────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "user", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isActivated: true,
        invitedAt: true,
        customPermissions: true,
        lastLoginAt: true,
        team: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
