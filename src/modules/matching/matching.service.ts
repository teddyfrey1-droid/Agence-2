import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { loadMatchingWeights, type MatchingWeights } from "./matching.config";

interface MatchResult {
  propertyId: string;
  searchRequestId: string;
  score: number;
  reasons: string[];
}

/**
 * Compute the comparable price of a property for a given request.
 * - VENTE / CESSION_BAIL / FOND_DE_COMMERCE → `price` (capital)
 * - LOCATION → `rentMonthly` (falls back to `rentYearly / 12`)
 *
 * Returns null when the property has no usable figure for its transaction type.
 */
function getComparablePrice(property: {
  transactionType: string;
  price: number | null;
  rentMonthly: number | null;
  rentYearly: number | null;
}): number | null {
  if (property.transactionType === "LOCATION") {
    if (property.rentMonthly != null) return property.rentMonthly;
    if (property.rentYearly != null) return property.rentYearly / 12;
    return null;
  }
  // VENTE, CESSION_BAIL, FOND_DE_COMMERCE: the capital/fee value lives in `price`
  return property.price;
}

/**
 * Calculate match score between a property and a search request.
 * Score is 0-100. Returns null if hard filters fail or the minimum score isn't reached.
 */
export function calculateMatchScore(
  property: {
    type: string;
    transactionType: string;
    city: string;
    district: string | null;
    quarter: string | null;
    surfaceTotal: number | null;
    surfaceMin: number | null;
    surfaceMax: number | null;
    price: number | null;
    rentMonthly: number | null;
    rentYearly: number | null;
    hasExtraction: boolean;
    hasTerrace: boolean;
    hasParking: boolean;
    hasLoadingDock: boolean;
  },
  request: {
    propertyTypes: string[];
    transactionType: string | null;
    cities: string[];
    districts: string[];
    quarters: string[];
    surfaceMin: number | null;
    surfaceMax: number | null;
    budgetMin: number | null;
    budgetMax: number | null;
    needsExtraction: boolean | null;
    needsTerrace: boolean | null;
    needsParking: boolean | null;
    needsLoadingDock: boolean | null;
  },
  weights: MatchingWeights = loadMatchingWeights()
): MatchResult | null {
  let score = 0;
  const reasons: string[] = [];

  // --- Hard filter: type ---
  if (request.propertyTypes.length > 0) {
    if (!request.propertyTypes.includes(property.type)) return null;
    score += weights.propertyType;
    reasons.push("Type de bien correspondant");
  }

  // --- Hard filter: transaction type ---
  if (request.transactionType) {
    if (property.transactionType !== request.transactionType) return null;
    score += weights.transactionType;
    reasons.push("Type de transaction correspondant");
  }

  // --- Location ---
  if (request.cities.length > 0 && request.cities.includes(property.city)) {
    score += weights.city;
    reasons.push("Ville correspondante");
  }

  if (
    request.districts.length > 0 &&
    property.district &&
    request.districts.includes(property.district)
  ) {
    score += weights.district;
    reasons.push("Arrondissement correspondant");
  }

  if (
    request.quarters.length > 0 &&
    property.quarter &&
    request.quarters.includes(property.quarter)
  ) {
    score += weights.quarter;
    reasons.push("Quartier correspondant");
  }

  // --- Surface ---
  // Use surfaceTotal primarily; fall back to surfaceMin/surfaceMax range.
  const propSurfaceLow = property.surfaceTotal ?? property.surfaceMin ?? null;
  const propSurfaceHigh = property.surfaceTotal ?? property.surfaceMax ?? null;

  if (propSurfaceLow != null && propSurfaceHigh != null) {
    const minOk = !request.surfaceMin || propSurfaceHigh >= request.surfaceMin;
    const maxOk = !request.surfaceMax || propSurfaceLow <= request.surfaceMax;
    if (minOk && maxOk) {
      // Strict fit: the midpoint falls inside the requested range
      const mid = (propSurfaceLow + propSurfaceHigh) / 2;
      const strict =
        (!request.surfaceMin || mid >= request.surfaceMin) &&
        (!request.surfaceMax || mid <= request.surfaceMax);
      if (strict) {
        score += weights.surface;
        reasons.push("Surface dans la fourchette");
      } else {
        score += weights.surfacePartial;
        reasons.push("Surface partiellement compatible");
      }
    }
  }

  // --- Budget ---
  const propertyPrice = getComparablePrice(property);
  if (propertyPrice != null) {
    const minOk = !request.budgetMin || propertyPrice >= request.budgetMin;
    const maxOk = !request.budgetMax || propertyPrice <= request.budgetMax;
    if (minOk && maxOk) {
      score += weights.budget;
      reasons.push("Budget correspondant");
    } else if (request.budgetMax && propertyPrice <= request.budgetMax * 1.1) {
      // Within 10% of the max → show as partial match
      score += weights.budgetPartial;
      reasons.push("Budget proche (±10%)");
    }
  }

  // --- Equipment bonuses ---
  if (request.needsExtraction && property.hasExtraction) {
    score += weights.extraction;
    reasons.push("Extraction disponible");
  }
  if (request.needsTerrace && property.hasTerrace) {
    score += weights.terrace;
    reasons.push("Terrasse disponible");
  }
  if (request.needsParking && property.hasParking) {
    score += weights.parking;
    reasons.push("Parking disponible");
  }
  if (request.needsLoadingDock && property.hasLoadingDock) {
    score += weights.loadingDock;
    reasons.push("Quai de chargement disponible");
  }

  if (score < weights.minScore) return null;

  return {
    propertyId: "",
    searchRequestId: "",
    score: Math.min(Math.round(score), 100),
    reasons,
  };
}

/** Fields we need from a property record to run the matcher. */
const PROPERTY_SELECT = {
  id: true,
  title: true,
  reference: true,
  type: true,
  transactionType: true,
  status: true,
  city: true,
  district: true,
  quarter: true,
  surfaceTotal: true,
  surfaceMin: true,
  surfaceMax: true,
  price: true,
  rentMonthly: true,
  rentYearly: true,
  hasExtraction: true,
  hasTerrace: true,
  hasParking: true,
  hasLoadingDock: true,
  assignedToId: true,
} satisfies Prisma.PropertySelect;

const SEARCH_REQUEST_SELECT = {
  id: true,
  propertyTypes: true,
  transactionType: true,
  cities: true,
  districts: true,
  quarters: true,
  surfaceMin: true,
  surfaceMax: true,
  budgetMin: true,
  budgetMax: true,
  needsExtraction: true,
  needsTerrace: true,
  needsParking: true,
  needsLoadingDock: true,
  assignedToId: true,
} satisfies Prisma.SearchRequestSelect;

/**
 * Persist a batch of matches for a property in a single transaction.
 * Also deletes obsolete matches (those that no longer qualify) for that property.
 */
async function persistMatchesForProperty(
  propertyId: string,
  results: MatchResult[]
) {
  const validIds = new Set(results.map((r) => r.searchRequestId));

  await prisma.$transaction([
    // Drop obsolete matches for this property — never touch VALIDE / RETENU ones,
    // they're part of the sales pipeline and shouldn't disappear automatically.
    prisma.match.deleteMany({
      where: {
        propertyId,
        status: { in: ["SUGGERE", "REJETE"] },
        ...(validIds.size > 0
          ? { searchRequestId: { notIn: Array.from(validIds) } }
          : {}),
      },
    }),
    ...results.map((r) =>
      prisma.match.upsert({
        where: {
          propertyId_searchRequestId: {
            propertyId: r.propertyId,
            searchRequestId: r.searchRequestId,
          },
        },
        create: {
          propertyId: r.propertyId,
          searchRequestId: r.searchRequestId,
          score: r.score,
          reasons: r.reasons,
          status: "SUGGERE",
        },
        update: {
          score: r.score,
          reasons: r.reasons,
        },
      })
    ),
  ]);
}

async function persistMatchesForSearchRequest(
  searchRequestId: string,
  results: MatchResult[]
) {
  const validIds = new Set(results.map((r) => r.propertyId));

  await prisma.$transaction([
    prisma.match.deleteMany({
      where: {
        searchRequestId,
        status: { in: ["SUGGERE", "REJETE"] },
        ...(validIds.size > 0
          ? { propertyId: { notIn: Array.from(validIds) } }
          : {}),
      },
    }),
    ...results.map((r) =>
      prisma.match.upsert({
        where: {
          propertyId_searchRequestId: {
            propertyId: r.propertyId,
            searchRequestId: r.searchRequestId,
          },
        },
        create: {
          propertyId: r.propertyId,
          searchRequestId: r.searchRequestId,
          score: r.score,
          reasons: r.reasons,
          status: "SUGGERE",
        },
        update: {
          score: r.score,
          reasons: r.reasons,
        },
      })
    ),
  ]);
}

/**
 * Run matching for a specific property against all active search requests.
 */
export async function runMatchingForProperty(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: PROPERTY_SELECT,
  });
  if (!property) return [];

  // Archived / sold / rented / retired properties should not produce new matches;
  // obsolete matches are cleaned up below.
  const eligibleStatuses = ["ACTIF", "EN_NEGOCIATION", "BROUILLON"];
  const isEligible = eligibleStatuses.includes(property.status);

  const requests = isEligible
    ? await prisma.searchRequest.findMany({
        where: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } },
        select: SEARCH_REQUEST_SELECT,
      })
    : [];

  const weights = loadMatchingWeights();
  const results: MatchResult[] = [];

  for (const request of requests) {
    const result = calculateMatchScore(property, request, weights);
    if (result) {
      result.propertyId = property.id;
      result.searchRequestId = request.id;
      results.push(result);
    }
  }

  // Identify matches that are NEW (not already in DB) to avoid duplicate notifications
  const existing = await prisma.match.findMany({
    where: {
      propertyId: property.id,
      searchRequestId: { in: results.map((r) => r.searchRequestId) },
    },
    select: { searchRequestId: true },
  });
  const existingIds = new Set(existing.map((m) => m.searchRequestId));
  const newResults = results.filter((r) => !existingIds.has(r.searchRequestId));

  await persistMatchesForProperty(property.id, results);

  // Notify the agents on NEW matches only
  if (newResults.length > 0) {
    const { notifyMatchFound } = await import("@/modules/notifications");
    const notifiedUsers = new Set<string>();

    for (const result of newResults) {
      // The property's assigned agent
      if (property.assignedToId && !notifiedUsers.has(`${property.assignedToId}:${result.searchRequestId}`)) {
        try {
          await notifyMatchFound({
            userId: property.assignedToId,
            propertyTitle: property.title || property.reference || "Bien",
            score: result.score,
            propertyId: property.id,
          });
        } catch (err) {
          console.error("[matching] notifyMatchFound failed (owner)", err);
        }
        notifiedUsers.add(`${property.assignedToId}:${result.searchRequestId}`);
      }

      // The search request's assigned agent (if different)
      const requestAgent = requests.find((r) => r.id === result.searchRequestId)?.assignedToId;
      if (
        requestAgent &&
        requestAgent !== property.assignedToId &&
        !notifiedUsers.has(`${requestAgent}:${result.searchRequestId}`)
      ) {
        try {
          await notifyMatchFound({
            userId: requestAgent,
            propertyTitle: property.title || property.reference || "Bien",
            score: result.score,
            propertyId: property.id,
          });
        } catch (err) {
          console.error("[matching] notifyMatchFound failed (request)", err);
        }
        notifiedUsers.add(`${requestAgent}:${result.searchRequestId}`);
      }
    }
  }

  return results;
}

/**
 * Run matching for a search request against all active properties.
 */
export async function runMatchingForSearchRequest(searchRequestId: string) {
  const request = await prisma.searchRequest.findUnique({
    where: { id: searchRequestId },
    select: SEARCH_REQUEST_SELECT,
  });
  if (!request) return [];

  const properties = await prisma.property.findMany({
    where: { status: { in: ["ACTIF", "EN_NEGOCIATION"] } },
    select: PROPERTY_SELECT,
  });

  const weights = loadMatchingWeights();
  const results: MatchResult[] = [];

  for (const property of properties) {
    const result = calculateMatchScore(property, request, weights);
    if (result) {
      result.propertyId = property.id;
      result.searchRequestId = request.id;
      results.push(result);
    }
  }

  // New-matches detection
  const existing = await prisma.match.findMany({
    where: {
      searchRequestId: request.id,
      propertyId: { in: results.map((r) => r.propertyId) },
    },
    select: { propertyId: true },
  });
  const existingIds = new Set(existing.map((m) => m.propertyId));
  const newResults = results.filter((r) => !existingIds.has(r.propertyId));

  await persistMatchesForSearchRequest(request.id, results);

  // Notify the request's agent about new matches
  if (newResults.length > 0 && request.assignedToId) {
    const { notifyMatchFound } = await import("@/modules/notifications");
    for (const result of newResults) {
      const property = properties.find((p) => p.id === result.propertyId);
      try {
        await notifyMatchFound({
          userId: request.assignedToId,
          propertyTitle: property?.title || property?.reference || "Bien",
          score: result.score,
          propertyId: result.propertyId,
        });
      } catch (err) {
        console.error("[matching] notifyMatchFound failed (request)", err);
      }
    }
  }

  return results;
}

/**
 * Remove any SUGGERE/REJETE matches tied to a property that no longer qualifies
 * (e.g. when its status moves to ARCHIVE / RETIRE / VENDU / LOUE).
 */
export async function cleanupMatchesForInactiveProperty(propertyId: string) {
  await prisma.match.deleteMany({
    where: {
      propertyId,
      status: { in: ["SUGGERE", "REJETE"] },
    },
  });
}

/**
 * Remove any SUGGERE/REJETE matches tied to a search request that no longer qualifies.
 */
export async function cleanupMatchesForInactiveSearchRequest(searchRequestId: string) {
  await prisma.match.deleteMany({
    where: {
      searchRequestId,
      status: { in: ["SUGGERE", "REJETE"] },
    },
  });
}
