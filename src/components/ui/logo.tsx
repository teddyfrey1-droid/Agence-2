import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

function LogoMark({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}) {
  // On utilise des proportions rectangulaires pour que ton logo ait la place de s'afficher en grand
  const dimensions = {
    sm: { className: "h-12 w-32", px: 128 },
    md: { className: "h-16 w-48", px: 192 }, 
    lg: { className: "h-20 w-64", px: 256 }, 
    xl: { className: "h-24 w-80", px: 320 },
  };

  const { className, px } = dimensions[size];

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <Image
        src="/retail-place-logo_transparent_crop.svg"
        alt="Retail Place"
        width={px}
        height={px}
        className="h-full w-full object-contain object-left"
        priority
      />
    </div>
  );
}

export function Logo({
  size = "md",
  variant = "dark",
  className,
}: LogoProps) {
  // On a complètement supprimé le bloc de texte "RETAIL PLACE / Immobilier Commercial" ici !
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <LogoMark size={size} variant={variant} />
    </Link>
  );
}

export { LogoMark };
