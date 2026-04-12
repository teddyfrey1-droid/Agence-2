import { NextResponse } from "next/server";
import { getActiveSession, hasMinimumRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users — returns active users for assignment dropdowns
// Restricted to MANAGER+ roles to prevent information disclosure
export async function GET() {
  try {
    const session = await getActiveSession();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    if (!hasMinimumRole(session.role, "MANAGER")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
