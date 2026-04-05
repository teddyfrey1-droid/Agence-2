import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users — returns active users for assignment dropdowns
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

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
