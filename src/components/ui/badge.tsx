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
  default: "bg-brand-100 text-brand-800",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  neutral: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
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
  const warningStatuses = ["EN_NEGOCIATION", "EN_COURS", "SOUS_COMPROMIS", "EN_PAUSE", "A_QUALIFIER", "EN_VISITE"];
  const dangerStatuses = ["PERDU", "ANNULE", "ANNULEE", "REJETE", "ABANDONNEE", "URGENTE"];
  const infoStatuses = ["NOUVELLE", "BROUILLON", "REPERE", "SUGGERE", "A_FAIRE"];

  if (successStatuses.includes(status)) return "success";
  if (warningStatuses.includes(status)) return "warning";
  if (dangerStatuses.includes(status)) return "danger";
  if (infoStatuses.includes(status)) return "info";
  return "neutral";
}
