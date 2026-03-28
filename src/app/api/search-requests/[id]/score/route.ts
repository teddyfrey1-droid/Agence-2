import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function calculateQualificationScore(searchRequest: {
  budgetMin: number | null;
  budgetMax: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  districts: string[];
  activity: string | null;
  description: string | null;
  notes: string | null;
  propertyTypes: string[];
  contact: {
    company: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
  } | null;
  matches: { id: string }[];
  interactions: { id: string }[];
}): number {
  let score = 0;

  // Budget defined (up to 15 pts)
  if (searchRequest.budgetMin || searchRequest.budgetMax) score += 15;

  // Surface criteria (up to 10 pts)
  if (searchRequest.surfaceMin || searchRequest.surfaceMax) score += 10;

  // Location specified (up to 15 pts)
  if (searchRequest.districts.length > 0) score += 15;

  // Activity/sector specified (10 pts)
  if (searchRequest.activity) score += 10;

  // Multiple property types = more flexible = higher score (up to 10 pts)
  if (searchRequest.propertyTypes.length > 0) {
    score += Math.min(searchRequest.propertyTypes.length * 3, 10);
  }

  // Contact quality (up to 20 pts)
  if (searchRequest.contact) {
    if (searchRequest.contact.company) score += 5;
    if (searchRequest.contact.phone || searchRequest.contact.mobile) score += 10;
    if (searchRequest.contact.email) score += 5;
  }

  // Description/notes (5 pts)
  if (searchRequest.description || searchRequest.notes) score += 5;

  // Engagement: has matches (5 pts)
  if (searchRequest.matches.length > 0) score += 5;

  // Engagement: has interactions (10 pts)
  if (searchRequest.interactions.length > 0) {
    score += Math.min(searchRequest.interactions.length * 2, 10);
  }

  return Math.min(score, 100);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const sr = await prisma.searchRequest.findUnique({
      where: { id },
      include: {
        contact: { select: { company: true, phone: true, mobile: true, email: true } },
        matches: { select: { id: true } },
        interactions: { select: { id: true } },
      },
    });

    if (!sr) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const score = calculateQualificationScore(sr);

    const updated = await prisma.searchRequest.update({
      where: { id },
      data: { qualificationScore: score },
    });

    return NextResponse.json({ score: updated.qualificationScore });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
