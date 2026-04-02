import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

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
    const { action } = body;

    if (id === session.userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre compte" }, { status: 400 });
    }

    if (action === "block") {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
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
      await prisma.user.update({
        where: { id },
        data: { isActive: true },
      });
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

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
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
