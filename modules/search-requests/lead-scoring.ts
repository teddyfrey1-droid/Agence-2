import { prisma } from "@/lib/prisma";

/**
 * Qualification / lead-priority score for a SearchRequest.
 *
 * Shared between the on-demand `/api/search-requests/:id/score` endpoint and
 * the proactive auto-scoring that runs on create / update, so agents don't
 * have to click a button to know if a lead is hot.
 *
 * Score is 0–100:
 *  - 15 budget defined
 *  - 10 surface criteria
 *  - 15 location specified (districts)
 *  - 10 activity/sector
 *  - 10 property types (3 pts each, capped)
 *  - 20 contact quality (company + phone + email)
 *  -  5 description / notes
 *  -  5 at least one match
 *  - 10 interactions (2 pts each, capped)
 *
 * Leads with score ≥ 80 are flagged as "HOT" and surfaced to managers.
 */

export interface ScorableSearchRequest {
  budgetMin: number | null;
  budgetMax: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  districts: string[];
  activity: string | null;
  description: string | null;
  notes: string | null;
  propertyTypes: string[];
  urgency?: string | null;
  contact: {
    company: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
  } | null;
  matches?: { id: string }[];
  interactions?: { id: string }[];
}

export function calculateQualificationScore(sr: ScorableSearchRequest): number {
  let score = 0;

  if (sr.budgetMin || sr.budgetMax) score += 15;
  if (sr.surfaceMin || sr.surfaceMax) score += 10;
  if (sr.districts.length > 0) score += 15;
  if (sr.activity) score += 10;

  if (sr.propertyTypes.length > 0) {
    score += Math.min(sr.propertyTypes.length * 3, 10);
  }

  if (sr.contact) {
    if (sr.contact.company) score += 5;
    if (sr.contact.phone || sr.contact.mobile) score += 10;
    if (sr.contact.email) score += 5;
  }

  if (sr.description || sr.notes) score += 5;
  if ((sr.matches?.length ?? 0) > 0) score += 5;
  if ((sr.interactions?.length ?? 0) > 0) {
    score += Math.min((sr.interactions?.length ?? 0) * 2, 10);
  }

  // Explicit urgency bumps the score (but doesn't dominate it).
  const urgency = sr.urgency?.toLowerCase() ?? "";
  if (urgency.includes("urgent") || urgency.includes("immediat")) score += 10;

  return Math.min(score, 100);
}

export const HOT_LEAD_THRESHOLD = 80;

/**
 * Recompute the qualification score for a search request and persist it.
 * Returns the new score, or null if the search request doesn't exist.
 */
export async function rescoreSearchRequest(id: string): Promise<number | null> {
  const sr = await prisma.searchRequest.findUnique({
    where: { id },
    include: {
      contact: { select: { company: true, phone: true, mobile: true, email: true } },
      matches: { select: { id: true } },
      interactions: { select: { id: true } },
    },
  });
  if (!sr) return null;

  const score = calculateQualificationScore(sr);
  await prisma.searchRequest.update({
    where: { id },
    data: { qualificationScore: score },
  });
  return score;
}
