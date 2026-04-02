interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 rounded-full bg-stone-100 p-4 text-stone-400 dark:bg-anthracite-800 dark:text-stone-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-anthracite-800 dark:text-stone-200">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-stone-500 max-w-sm dark:text-stone-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
