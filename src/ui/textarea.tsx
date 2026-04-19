import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-anthracite-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "block w-full rounded-premium border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-anthracite-900 placeholder:text-stone-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-stone-50 disabled:text-stone-500 min-h-[100px] resize-y",
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

Textarea.displayName = "Textarea";
export { Textarea };
