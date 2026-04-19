import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative flex flex-col gap-4 border-b border-stone-200/70 pb-5 dark:border-anthracite-800 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand-600/90 dark:text-brand-400/90">
            {eyebrow}
          </p>
        )}
        <div className="mt-1 flex items-start gap-3">
          {icon && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100 dark:from-brand-900/30 dark:to-brand-900/10 dark:text-brand-400 dark:ring-brand-900/40">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {/* Title uses DM Serif Display with italic accent on last word */}
            <h1
              className="leading-tight tracking-tight text-anthracite-900 dark:text-stone-100"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(1.5rem, 2vw, 1.9rem)",
              }}
            >
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-500 dark:text-stone-400">
                {description}
              </p>
            )}
          </div>
        </div>
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
