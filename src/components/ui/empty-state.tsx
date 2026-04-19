interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const DefaultIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    />
  </svg>
);

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/40 px-6 py-16 text-center dark:border-anthracite-800 dark:bg-anthracite-900/30">
      <div className="relative mb-4">
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-brand-100/50 via-stone-100/40 to-champagne-100/40 blur-md dark:from-brand-900/20 dark:via-anthracite-800/40 dark:to-champagne-900/20" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-stone-400 ring-1 ring-stone-200 dark:bg-anthracite-800 dark:text-stone-500 dark:ring-anthracite-700">
          {icon || DefaultIcon}
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold text-anthracite-900 dark:text-stone-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
