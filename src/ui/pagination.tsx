import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  params = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const qp = new URLSearchParams();
    qp.set("page", String(page));
    Object.entries(params).forEach(([key, value]) => {
      if (value) qp.set(key, value);
    });
    return `${basePath}?${qp.toString()}`;
  }

  // Show max 7 page buttons with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const arrowClass =
    "flex h-9 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600 transition-colors hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-400 dark:hover:border-brand-500/40 dark:hover:bg-brand-900/20 dark:hover:text-brand-300";

  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-stone-200/70 pt-4 dark:border-anthracite-800"
      aria-label="Pagination"
    >
      <p className="hidden text-xs text-stone-500 sm:block dark:text-stone-400">
        Page <span className="font-semibold text-anthracite-800 dark:text-stone-200">{currentPage}</span>{" "}
        sur <span className="font-semibold text-anthracite-800 dark:text-stone-200">{totalPages}</span>
      </p>
      <div className="flex flex-1 items-center justify-center gap-1.5 sm:flex-initial">
        {currentPage > 1 ? (
          <Link href={buildHref(currentPage - 1)} className={arrowClass} aria-label="Précédent">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <span className={`${arrowClass} cursor-not-allowed opacity-40`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        )}
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-9 w-9 items-center justify-center text-sm text-stone-400 dark:text-stone-500"
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-all ${
                p === currentPage
                  ? "bg-anthracite-900 text-white shadow-sm dark:bg-brand-600 dark:text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-300 dark:hover:border-brand-500/40 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
              }`}
            >
              {p}
            </Link>
          ),
        )}
        {currentPage < totalPages ? (
          <Link href={buildHref(currentPage + 1)} className={arrowClass} aria-label="Suivant">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span className={`${arrowClass} cursor-not-allowed opacity-40`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
      <span className="hidden w-16 sm:block" aria-hidden />
    </nav>
  );
}
