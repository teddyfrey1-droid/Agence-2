import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// GET custom permissions for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "user", "manage_users")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, customPermissions: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// PUT - set custom permissions for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "user", "manage_users")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { customPermissions } = body;

    // null means reset to role defaults
    await prisma.user.update({
      where: { id },
      data: { customPermissions: customPermissions || null },
    });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { firstName: true, lastName: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE_PERMISSIONS",
        entity: "user",
        entityId: id,
        details: customPermissions
          ? `Permissions personnalisées mises à jour pour ${user?.firstName} ${user?.lastName}`
          : `Permissions réinitialisées aux valeurs par défaut pour ${user?.firstName} ${user?.lastName}`,
      },
    });

    return NextResponse.json({ success: true, message: "Permissions mises à jour" });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
