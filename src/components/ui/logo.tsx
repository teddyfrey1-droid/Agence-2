import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * LA PLACE — Immobilier Commercial
 * Uses SVG logo from /public/logo-mark.svg
 */
function LogoMark({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}) {
  const dimensions = {
    sm: { className: "h-14 w-14", px: 56 },
    md: { className: "h-20 w-20", px: 80 }, 
    lg: { className: "h-24 w-24", px: 96 }, 
    xl: { className: "h-32 w-32", px: 128 },
  };

  const { className, px } = dimensions[size];

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <Image
        src="/logo-mark.svg"
        alt="RETAIL PLACE"
        width={px}
        height={px}
        className="h-full w-full object-contain"
        priority
      />
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
