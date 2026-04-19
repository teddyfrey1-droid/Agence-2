import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Tiny uppercase label above the title (e.g. "Gestion") */
  eyebrow?: string;
  /** Main title (h1) */
  title: string;
  /** Short description shown under the title */
  description?: string;
  /** Optional icon shown next to the title */
  icon?: React.ReactNode;
  /** Right-aligned actions (buttons, links) */
  actions?: React.ReactNode;
  /** Stats / metrics shown under description */
  meta?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — standard header for every dashboard page.
 *
 * Layout: eyebrow + h1 (with optional icon) + description on the left,
 * actions floated right; everything wraps on small screens.
 *
 * Use it as the very first element of the page so all admin views share
 * the same vertical rhythm and typographic hierarchy.
 */
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
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-600/90 dark:text-brand-400/90">
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
            <h1 className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-anthracite-900 sm:text-[1.85rem] dark:text-stone-100">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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
