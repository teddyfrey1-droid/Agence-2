import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Premium architectural logo mark for the agency.
 * SVG: stylized building/arch with clean geometric lines.
 */
function LogoMark({
  size = "md",
  variant = "dark",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  const iconSizes = { sm: 18, md: 22, lg: 30 };
  const bg = variant === "dark" ? "bg-anthracite-900" : "bg-champagne-500/20";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl",
        sizes[size],
        bg
      )}
    >
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arch / building mark */}
        <path
          d="M16 3L4 12V29H12V20C12 17.7909 13.7909 16 16 16C18.2091 16 20 17.7909 20 20V29H28V12L16 3Z"
          className={
            variant === "dark"
              ? "stroke-champagne-300"
              : "stroke-champagne-400"
          }
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Keystone accent */}
        <circle
          cx="16"
          cy="10"
          r="1.5"
          className={
            variant === "dark"
              ? "fill-champagne-400"
              : "fill-champagne-500"
          }
        />
        {/* Base line */}
        <line
          x1="2"
          y1="29"
          x2="30"
          y2="29"
          className={
            variant === "dark"
              ? "stroke-champagne-300/50"
              : "stroke-champagne-400/50"
          }
          strokeWidth="1.2"
          strokeLinecap="round"
        />
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
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const subtitleSizes = {
    sm: "text-[9px]",
    md: "text-[11px]",
    lg: "text-xs",
  };

  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} variant={variant} />
      {showText && (
        <div>
          <p
            className={cn(
              "font-serif font-semibold leading-tight",
              textSizes[size],
              variant === "dark"
                ? "text-anthracite-900"
                : "text-white"
            )}
          >
            Agence
          </p>
          <p
            className={cn(
              "font-medium uppercase tracking-[0.2em]",
              subtitleSizes[size],
              variant === "dark"
                ? "text-brand-500"
                : "text-champagne-300"
            )}
          >
            Immobilier
          </p>
        </div>
      )}
    </Link>
  );
}

export { LogoMark };
