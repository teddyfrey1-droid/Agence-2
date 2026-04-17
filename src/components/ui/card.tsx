import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200/80 bg-white shadow-card dark:border-anthracite-800 dark:bg-anthracite-900 dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.35),0_1px_2px_-1px_rgba(0,0,0,0.25)]",
        hover && "transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 dark:hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.5),0_4px_10px_-3px_rgba(0,0,0,0.35)] dark:hover:border-anthracite-700",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-stone-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-anthracite-800", className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-4 py-3 sm:px-6 sm:py-4", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t border-stone-100 px-4 py-3 bg-stone-50/50 sm:px-6 dark:bg-anthracite-800/30 dark:border-anthracite-800",
        className
      )}
    >
      {children}
    </div>
  );
}
