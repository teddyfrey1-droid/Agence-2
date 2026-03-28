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
 * Gold LP monogram inside double gold circles, matching the real branding
 */
function LogoMark({
  size = "md",
  variant = "dark",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}) {
  const sizes = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-16 w-16", xl: "h-24 w-24" };

  // Gold gradient IDs unique per variant to avoid conflicts
  const id = variant === "dark" ? "lp" : "lp-lt";

  return (
    <div className={cn("flex items-center justify-center", sizes[size])}>
      <svg viewBox="0 0 100 100" fill="none" className="h-full w-full">
        <defs>
          {/* Gold gradient for the monogram */}
          <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a54e" />
            <stop offset="30%" stopColor="#dfc06a" />
            <stop offset="50%" stopColor="#b08d3e" />
            <stop offset="70%" stopColor="#d4b45c" />
            <stop offset="100%" stopColor="#a07830" />
          </linearGradient>
          <linearGradient id={`${id}-gold2`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4b87a" />
            <stop offset="50%" stopColor="#b89642" />
            <stop offset="100%" stopColor="#c9a54e" />
          </linearGradient>
        </defs>

        {/* Outer circle */}
        <circle cx="50" cy="50" r="47" stroke={`url(#${id}-gold)`} strokeWidth="2.5" fill="none" />
        {/* Inner circle */}
        <circle cx="50" cy="50" r="41" stroke={`url(#${id}-gold2)`} strokeWidth="1.5" fill="none" />

        {/* L letter — vertical stroke */}
        <rect x="30" y="24" width="5.5" height="42" rx="1" fill={`url(#${id}-gold)`} />
        {/* L letter — horizontal base with slight serif curve */}
        <rect x="30" y="61" width="22" height="5" rx="1" fill={`url(#${id}-gold)`} />
        {/* L serif top */}
        <rect x="28" y="24" width="10" height="3" rx="1" fill={`url(#${id}-gold)`} />

        {/* P letter — vertical stroke */}
        <rect x="46" y="24" width="5.5" height="52" rx="1" fill={`url(#${id}-gold2)`} />
        {/* P serif top */}
        <rect x="44" y="24" width="10" height="3" rx="1" fill={`url(#${id}-gold2)`} />
        {/* P serif bottom */}
        <rect x="44" y="73" width="10" height="3" rx="1" fill={`url(#${id}-gold2)`} />
        {/* P bowl (curved part) */}
        <path
          d="M51.5 27 C66 27, 72 33, 72 42 C72 51, 66 57, 51.5 57"
          stroke={`url(#${id}-gold2)`}
          strokeWidth="5"
          fill="none"
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
