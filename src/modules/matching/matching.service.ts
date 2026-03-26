import { prisma } from "@/lib/prisma";

interface MatchResult {
  propertyId: string;
  searchRequestId: string;
  score: number;
  reasons: string[];
}

/**
 * Calculate match score between a property and a search request.
 * Score is 0-100. Higher is better.
 */
export function calculateMatchScore(
  property: {
    type: string;
    transactionType: string;
    city: string;
    district: string | null;
    surfaceTotal: number | null;
    price: number | null;
    rentMonthly: number | null;
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
    surfaceMin: number | null;
    surfaceMax: number | null;
    budgetMin: number | null;
    budgetMax: number | null;
    needsExtraction: boolean | null;
    needsTerrace: boolean | null;
    needsParking: boolean | null;
    needsLoadingDock: boolean | null;
  }
): MatchResult | null {
  let score = 0;
  const reasons: string[] = [];

  // Type match (mandatory)
  if (request.propertyTypes.length > 0) {
    if (!request.propertyTypes.includes(property.type)) {
      return null; // Hard filter
    }
    score += 25;
    reasons.push("Type de bien correspondant");
  }

  // Transaction type (mandatory)
  if (request.transactionType) {
    if (property.transactionType !== request.transactionType) {
      return null; // Hard filter
    }
    score += 20;
    reasons.push("Type de transaction correspondant");
  }

  // Location
  if (request.cities.length > 0 && request.cities.includes(property.city)) {
    score += 10;
    reasons.push("Ville correspondante");
  }

  if (
    request.districts.length > 0 &&
    property.district &&
    request.districts.includes(property.district)
  ) {
    score += 10;
    reasons.push("Arrondissement correspondant");
  }

  // Surface
  if (property.surfaceTotal) {
    const surfaceOk =
      (!request.surfaceMin || property.surfaceTotal >= request.surfaceMin) &&
      (!request.surfaceMax || property.surfaceTotal <= request.surfaceMax);
    if (surfaceOk) {
      score += 15;
      reasons.push("Surface dans la fourchette");
    }
  }

  // Budget
  const propertyPrice =
    property.transactionType === "LOCATION" || property.transactionType === "FOND_DE_COMMERCE"
      ? property.rentMonthly
      : property.price;
  if (propertyPrice) {
    const budgetOk =
      (!request.budgetMin || propertyPrice >= request.budgetMin) &&
      (!request.budgetMax || propertyPrice <= request.budgetMax);
    if (budgetOk) {
      score += 15;
      reasons.push("Budget correspondant");
    }
  }

  // Equipment bonuses
  if (request.needsExtraction && property.hasExtraction) {
    score += 5;
    reasons.push("Extraction disponible");
  }
  if (request.needsTerrace && property.hasTerrace) {
    score += 3;
    reasons.push("Terrasse disponible");
  }
  if (request.needsParking && property.hasParking) {
    score += 3;
    reasons.push("Parking disponible");
  }
  if (request.needsLoadingDock && property.hasLoadingDock) {
    score += 3;
    reasons.push("Quai de chargement disponible");
  }

  // Only return if minimum score
  if (score < 30) return null;

  return {
    propertyId: "",
    searchRequestId: "",
    score: Math.min(score, 100),
    reasons,
  };
}

/**
 * Run matching for a specific property against all active search requests.
 */
export async function runMatchingForProperty(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property || property.status === "ARCHIVE") return [];

  const requests = await prisma.searchRequest.findMany({
    where: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } },
  });

  const results: MatchResult[] = [];

  for (const request of requests) {
    const result = calculateMatchScore(property, request);
    if (result) {
      result.propertyId = property.id;
      result.searchRequestId = request.id;
      results.push(result);
    }
  }

  // Upsert matches
  for (const result of results) {
    await prisma.match.upsert({
      where: {
        propertyId_searchRequestId: {
          propertyId: result.propertyId,
          searchRequestId: result.searchRequestId,
        },
      },
      create: {
        propertyId: result.propertyId,
        searchRequestId: result.searchRequestId,
        score: result.score,
        reasons: result.reasons,
        status: "SUGGERE",
      },
      update: {
        score: result.score,
        reasons: result.reasons,
      },
    });
  }

  return results;
}

/**
 * Run matching for a search request against all active properties.
 */
export async function runMatchingForSearchRequest(searchRequestId: string) {
  const request = await prisma.searchRequest.findUnique({
    where: { id: searchRequestId },
  });
  if (!request) return [];

  const properties = await prisma.property.findMany({
    where: { status: { in: ["ACTIF", "EN_NEGOCIATION"] } },
  });

  const results: MatchResult[] = [];

  for (const property of properties) {
    const result = calculateMatchScore(property, request);
    if (result) {
      result.propertyId = property.id;
      result.searchRequestId = request.id;
      results.push(result);
    }
  }

  for (const result of results) {
    await prisma.match.upsert({
      where: {
        propertyId_searchRequestId: {
          propertyId: result.propertyId,
          searchRequestId: result.searchRequestId,
        },
      },
      create: {
        propertyId: result.propertyId,
        searchRequestId: result.searchRequestId,
        score: result.score,
        reasons: result.reasons,
        status: "SUGGERE",
      },
      update: {
        score: result.score,
        reasons: result.reasons,
      },
    });
  }

  return results;
}
