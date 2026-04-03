import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800",
  neutral: "bg-stone-100 text-stone-600 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Helper to get badge variant from status
export function getStatusBadgeVariant(status: string): BadgeVariant {
  const successStatuses = ["ACTIF", "TERMINEE", "GAGNE", "SATISFAITE", "QUALIFIE", "CONVERTI", "VALIDE", "RETENU"];
  const warningStatuses = ["EN_NEGOCIATION", "EN_COURS", "SOUS_COMPROMIS", "EN_PAUSE", "A_QUALIFIER", "EN_VISITE", "EN_ATTENTE_RETOUR"];
  const dangerStatuses = ["PERDU", "ANNULE", "ANNULEE", "REJETE", "ABANDONNEE", "URGENTE"];
  const infoStatuses = ["NOUVELLE", "BROUILLON", "REPERE", "SUGGERE", "A_FAIRE", "APPELE"];

  if (successStatuses.includes(status)) return "success";
  if (warningStatuses.includes(status)) return "warning";
  if (dangerStatuses.includes(status)) return "danger";
  if (infoStatuses.includes(status)) return "info";
  return "neutral";
}
