import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * LA PLACE — Immobilier Commercial
 * Gold LP monogram in a circle with serif text
 */
function LogoMark({
  size = "md",
  variant = "dark",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}) {
  const sizes = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-14 w-14" };

  const gold = variant === "dark" ? "#b08d57" : "#d4b87a";
  const goldLight = variant === "dark" ? "#d4b87a" : "#e8d5a8";

  return (
    <div className={cn("flex items-center justify-center rounded-full", sizes[size])}>
      <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
        {/* Outer circle */}
        <circle cx="24" cy="24" r="22" stroke={gold} strokeWidth="1.5" fill="none" />
        {/* Inner circle */}
        <circle cx="24" cy="24" r="18" stroke={goldLight} strokeWidth="0.8" fill="none" opacity="0.5" />
        {/* L letter */}
        <text
          x="16"
          y="30"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="18"
          fill={gold}
          letterSpacing="-1"
        >
          L
        </text>
        {/* P letter - overlapping */}
        <text
          x="24"
          y="30"
          fontFamily="Georgia, serif"
          fontWeight="700"
          fontSize="18"
          fill={gold}
          letterSpacing="-1"
        >
          P
        </text>
      </svg>
    </div>
  );
}

export function Logo({
  size = "md",
  showText = true,
  variant = "dark",
  className,
}: LogoProps) {
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const subtitleSizes = {
    sm: "text-[7px]",
    md: "text-[8px]",
    lg: "text-[10px]",
  };

  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} variant={variant} />
      {showText && (
        <div className="leading-tight">
          <p
            className={cn(
              "font-serif font-bold tracking-wide",
              textSizes[size],
              variant === "dark"
                ? "text-anthracite-900 dark:text-stone-100"
                : "text-white"
            )}
          >
            LA PLACE
          </p>
          <p
            className={cn(
              "font-medium uppercase",
              subtitleSizes[size],
              variant === "dark"
                ? "tracking-[0.15em] text-brand-500 dark:text-brand-400"
                : "tracking-[0.15em] text-champagne-300"
            )}
          >
            Immobilier Commercial
          </p>
        </div>
      )}
    </Link>
  );
}

export { LogoMark };
