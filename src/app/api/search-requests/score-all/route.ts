import { NextResponse } from "next/server";
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
  if (searchRequest.budgetMin || searchRequest.budgetMax) score += 15;
  if (searchRequest.surfaceMin || searchRequest.surfaceMax) score += 10;
  if (searchRequest.districts.length > 0) score += 15;
  if (searchRequest.activity) score += 10;
  if (searchRequest.propertyTypes.length > 0) score += Math.min(searchRequest.propertyTypes.length * 3, 10);
  if (searchRequest.contact) {
    if (searchRequest.contact.company) score += 5;
    if (searchRequest.contact.phone || searchRequest.contact.mobile) score += 10;
    if (searchRequest.contact.email) score += 5;
  }
  if (searchRequest.description || searchRequest.notes) score += 5;
  if (searchRequest.matches.length > 0) score += 5;
  if (searchRequest.interactions.length > 0) score += Math.min(searchRequest.interactions.length * 2, 10);
  return Math.min(score, 100);
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const requests = await prisma.searchRequest.findMany({
      where: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } },
      include: {
        contact: { select: { company: true, phone: true, mobile: true, email: true } },
        matches: { select: { id: true } },
        interactions: { select: { id: true } },
      },
    });

    let updated = 0;
    for (const sr of requests) {
      const score = calculateQualificationScore(sr);
      await prisma.searchRequest.update({
        where: { id: sr.id },
        data: { qualificationScore: score },
      });
      updated++;
    }

    return NextResponse.json({ updated, total: requests.length });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
