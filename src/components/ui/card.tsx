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
        "rounded-xl border border-stone-200/80 bg-white shadow-card dark:border-stone-700/50 dark:bg-anthracite-900 dark:shadow-none",
        hover && "transition-all hover:shadow-card-hover hover:-translate-y-0.5",
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
    <div className={cn("border-b border-stone-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-stone-700/50", className)}>
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
        "border-t border-stone-100 px-4 py-3 bg-stone-50/50 sm:px-6 dark:bg-anthracite-800/50 dark:border-stone-700/50",
        className
      )}
    >
      {children}
    </div>
  );
}
