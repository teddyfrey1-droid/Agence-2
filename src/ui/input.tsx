import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** When true, uses the floating label pattern (label animates up on focus/fill) */
  floating?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, floating = false, ...props }, ref) => {

    if (floating && label) {
      return (
        <div className="float-field">
          <input
            ref={ref}
            id={id}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            className={cn(
              "float-input",
              error && "!border-red-400 hover:!border-red-500 focus:!border-red-500 focus:!ring-red-100",
              className
            )}
            {...props}
          />
          <label htmlFor={id} className="float-label">{label}</label>
          {error ? (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
          ) : hint ? (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-bold uppercase tracking-[0.07em] text-stone-500 dark:text-stone-400"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          className={cn(
            "block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-[13.5px] font-medium text-anthracite-900 shadow-sm placeholder:text-stone-400 transition-all duration-150 hover:border-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 dark:border-anthracite-700 dark:bg-anthracite-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:hover:border-anthracite-600 dark:focus:border-brand-400 dark:focus:ring-brand-900/30 dark:disabled:bg-anthracite-900 dark:disabled:text-stone-500",
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
