import { haptic } from "@/lib/haptics";

export type AchievementId =
  | "first_spot"
  | "ten_spots_week"
  | "first_conversion"
  | "first_won_deal"
  | "first_ai_listing";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
}

const CATALOG: Record<AchievementId, Achievement> = {
  first_spot: {
    id: "first_spot",
    title: "Premier repérage",
    description: "Vous venez d'ajouter votre premier repérage terrain.",
    icon: "📍",
  },
  ten_spots_week: {
    id: "ten_spots_week",
    title: "Rythme de chasseur",
    description: "10 repérages cette semaine — bel effort terrain.",
    icon: "🎯",
  },
  first_conversion: {
    id: "first_conversion",
    title: "Premier bien converti",
    description: "Un repérage est devenu un bien commercialisable.",
    icon: "✨",
  },
  first_won_deal: {
    id: "first_won_deal",
    title: "Premier dossier gagné",
    description: "Félicitations — une signature au compteur.",
    icon: "🏆",
  },
  first_ai_listing: {
    id: "first_ai_listing",
    title: "Annonce générée",
    description: "Vous avez utilisé l'IA pour rédiger votre première annonce.",
    icon: "✍️",
  },
};

const STORAGE_KEY = "retail-achievements-v1";

function load(): Set<AchievementId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as AchievementId[]);
  } catch {
    return new Set();
  }
}

function save(set: Set<AchievementId>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

/**
 * Unlocks an achievement the first time it's triggered. Subsequent calls
 * are silent no-ops. Emits a window event so a mounted listener can render
 * a one-time celebratory toast.
 */
export function unlockAchievement(id: AchievementId) {
  if (typeof window === "undefined") return;
  const set = load();
  if (set.has(id)) return;
  set.add(id);
  save(set);
  const ach = CATALOG[id];
  window.dispatchEvent(new CustomEvent("retail:achievement", { detail: ach }));
  haptic("success");
}

export function hasAchievement(id: AchievementId): boolean {
  return load().has(id);
}

export { CATALOG as ACHIEVEMENTS };
