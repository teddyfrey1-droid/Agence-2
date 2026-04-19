import { cn } from "@/lib/utils";
import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, options, placeholder, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-anthracite-700 dark:text-stone-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            className={cn(
              "block w-full appearance-none rounded-premium border border-stone-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-anthracite-900 shadow-sm transition-colors hover:border-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100 dark:hover:border-stone-500 dark:focus:border-brand-400 dark:focus:ring-brand-900/30 dark:disabled:bg-anthracite-900 dark:disabled:text-stone-500",
              error &&
                "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-100 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-900/30",
              className,
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error ? (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
        ) : hint ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
export { Select };
