import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgencyInfo } from "@/lib/agency";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const [property, agency] = await Promise.all([
      prisma.property.findUnique({
        where: { id },
        include: {
          owner: { select: { firstName: true, lastName: true, company: true, phone: true, email: true, address: true, city: true, zipCode: true } },
          assignedTo: { select: { firstName: true, lastName: true, email: true, phone: true } },
          media: { where: { isPrimary: true }, take: 1, select: { url: true, isPrimary: true } },
        },
      }),
      getAgencyInfo(),
    ]);

    if (!property) {
      return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      property,
      agency,
      currentUser: {
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
