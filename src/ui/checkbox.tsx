import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center gap-2.5 text-sm text-anthracite-700 dark:text-stone-300",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800"
          {...props}
        />
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
