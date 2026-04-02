import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
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
          className={cn(
            "block w-full rounded-premium border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-anthracite-900 placeholder:text-stone-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-stone-50 disabled:text-stone-500 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-brand-400 dark:focus:ring-brand-400 dark:disabled:bg-anthracite-900 dark:disabled:text-stone-500",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
