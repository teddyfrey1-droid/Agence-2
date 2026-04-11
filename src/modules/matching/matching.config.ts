/**
 * Matching scoring configuration.
 *
 * Weights are tunable without changing the algorithm. They should sum to
 * something close to 100 when all criteria are satisfied, so scores map to
 * "confidence percentages" that operators can read intuitively.
 */
export interface MatchingWeights {
  // Hard filters (bonus added when they match — mandatory otherwise)
  propertyType: number;
  transactionType: number;

  // Location
  city: number;
  district: number;
  quarter: number;

  // Size / money
  surface: number;
  surfacePartial: number; // surface overlap only on one side
  budget: number;
  budgetPartial: number;

  // Equipment
  extraction: number;
  terrace: number;
  parking: number;
  loadingDock: number;

  // Minimum score required to surface the match at all
  minScore: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  propertyType: 25,
  transactionType: 20,
  city: 8,
  district: 8,
  quarter: 4,
  surface: 15,
  surfacePartial: 7,
  budget: 15,
  budgetPartial: 7,
  extraction: 5,
  terrace: 3,
  parking: 3,
  loadingDock: 3,
  minScore: 30,
};

/**
 * Load matching weights from environment variables (opt-in override).
 * Each weight can be overridden with MATCH_WEIGHT_<KEY>.
 */
export function loadMatchingWeights(): MatchingWeights {
  const weights: MatchingWeights = { ...DEFAULT_MATCHING_WEIGHTS };
  for (const key of Object.keys(weights) as (keyof MatchingWeights)[]) {
    const envKey = `MATCH_WEIGHT_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
    const raw = process.env[envKey];
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        weights[key] = parsed;
      }
    }
  }
  return weights;
}
