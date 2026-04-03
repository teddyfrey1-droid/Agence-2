import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark"; // On le garde ici pour ne pas casser les autres pages
  className?: string;
}

function LogoMark({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "xl";
}) {
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
        src="/logo-mark.svg"
        alt=""
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
  className,
}: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <LogoMark size={size} />
    </Link>
  );
}

export { LogoMark };
