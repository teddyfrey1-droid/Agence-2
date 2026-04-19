import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            "block w-full rounded-premium border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-anthracite-900 shadow-sm placeholder:text-stone-400 transition-colors hover:border-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:hover:border-stone-500 dark:focus:border-brand-400 dark:focus:ring-brand-900/30 dark:disabled:bg-anthracite-900 dark:disabled:text-stone-500",
            error &&
              "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-100 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-900/30",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
        ) : hint ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
