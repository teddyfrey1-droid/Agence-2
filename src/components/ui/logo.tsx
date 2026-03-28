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
 * Gold LP monogram inside double gold circles
 * Faithful reproduction of the real branding with intertwined L & P
 */
function LogoMark({
  size = "md",
  variant = "dark",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}) {
  const sizes = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-16 w-16", xl: "h-24 w-24" };
  const id = variant === "dark" ? "lp" : "lp-lt";

  return (
    <div className={cn("flex items-center justify-center", sizes[size])}>
      <svg viewBox="0 0 200 200" fill="none" className="h-full w-full">
        <defs>
          <linearGradient id={`${id}-g1`} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#d4b45c" />
            <stop offset="25%" stopColor="#e0c76e" />
            <stop offset="50%" stopColor="#b89236" />
            <stop offset="75%" stopColor="#d4b45c" />
            <stop offset="100%" stopColor="#9a7a28" />
          </linearGradient>
          <linearGradient id={`${id}-g2`} x1="200" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c9a54e" />
            <stop offset="50%" stopColor="#dfc06a" />
            <stop offset="100%" stopColor="#b08d3e" />
          </linearGradient>
          <linearGradient id={`${id}-g3`} x1="0" y1="50" x2="200" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c9a54e" />
            <stop offset="30%" stopColor="#e0c76e" />
            <stop offset="60%" stopColor="#b89236" />
            <stop offset="100%" stopColor="#d4b45c" />
          </linearGradient>
        </defs>

        {/* Outer circle — thick */}
        <circle cx="100" cy="100" r="95" stroke={`url(#${id}-g1)`} strokeWidth="4" fill="none" />
        {/* Inner circle — thinner, slightly inside */}
        <circle cx="100" cy="100" r="84" stroke={`url(#${id}-g2)`} strokeWidth="2.5" fill="none" />

        {/*
          L letter — elegant serif style with decorative bottom swoosh
          The L vertical stroke, then horizontal base that curves up into a swoosh
        */}
        {/* L vertical stroke */}
        <path
          d="M62 42 L62 138"
          stroke={`url(#${id}-g3)`}
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* L top serif — small horizontal bar */}
        <path
          d="M55 42 L72 42"
          stroke={`url(#${id}-g3)`}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* L bottom horizontal + decorative swoosh curling up */}
        <path
          d="M58 138 L95 138 Q115 138, 118 125 Q120 116, 110 112"
          stroke={`url(#${id}-g3)`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/*
          P letter — overlapping the L
          Vertical stroke placed slightly to the right of L, with a classic rounded bowl
        */}
        {/* P vertical stroke */}
        <path
          d="M92 38 L92 158"
          stroke={`url(#${id}-g1)`}
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* P top serif */}
        <path
          d="M85 38 L102 38"
          stroke={`url(#${id}-g1)`}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* P bottom serif */}
        <path
          d="M85 158 L102 158"
          stroke={`url(#${id}-g1)`}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* P bowl — the curved part */}
        <path
          d="M96 42 C128 42, 148 54, 148 74 C148 94, 128 106, 96 106"
          stroke={`url(#${id}-g1)`}
          strokeWidth="8"
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
