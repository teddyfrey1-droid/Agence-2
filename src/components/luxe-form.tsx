"use client";

import Link from "next/link";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
   Luxe form primitives — public site forms (light + dark)
   Same editorial language as the homepage : hairline borders,
   champagne accents, letter-spaced overline labels.
   ────────────────────────────────────────────────────────────── */

export const luxInputClass =
  "block w-full border border-stone-300 bg-white px-4 py-3 font-sans text-sm text-anthracite-900 placeholder-stone-400 outline-none transition-colors duration-300 hover:border-stone-400 focus:border-champagne-500 dark:border-stone-700 dark:bg-anthracite-950 dark:text-stone-100 dark:placeholder-stone-600 dark:hover:border-stone-600 dark:focus:border-champagne-400";

export const luxLabelClass =
  "mb-2 flex items-baseline gap-1.5 font-sans text-[10px] font-semibold tracking-[0.28em] uppercase text-stone-500 dark:text-stone-400";

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={luxLabelClass}>
      {label}
      {required && <span className="text-champagne-600 dark:text-champagne-400">*</span>}
    </label>
  );
}

interface LuxInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function LuxInput({ label, hint, id, required, className, ...props }: LuxInputProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input id={id} className={cn(luxInputClass, className)} {...props} />
      {hint && (
        <p className="mt-1.5 font-sans text-xs text-stone-400 dark:text-stone-500">{hint}</p>
      )}
    </div>
  );
}

interface LuxTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function LuxTextarea({ label, id, required, className, ...props }: LuxTextareaProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <textarea id={id} className={cn(luxInputClass, "resize-none", className)} {...props} />
    </div>
  );
}

interface LuxSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function LuxSelect({
  label,
  options,
  placeholder,
  id,
  required,
  className,
  ...props
}: LuxSelectProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <div className="relative">
        <select
          id={id}
          className={cn(luxInputClass, "appearance-none pr-10", className)}
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
          className="pointer-events-none absolute right-4 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3.22 6.22a.75.75 0 011.06 0L8 9.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 010-1.06z" />
        </svg>
      </div>
    </div>
  );
}

/* ── Selectable chip — multi-choice (types, arrondissements…) ── */

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 border px-4 py-2 font-sans text-xs font-medium transition-all duration-300 active:scale-95",
        active
          ? "border-champagne-500 bg-champagne-50 text-anthracite-900 shadow-[0_10px_24px_-14px_rgba(196,141,71,0.55)] dark:border-champagne-400 dark:bg-champagne-500/10 dark:text-champagne-200"
          : "border-stone-300 bg-white text-stone-600 hover:border-champagne-400/70 hover:text-anthracite-900 dark:border-stone-700 dark:bg-anthracite-950 dark:text-stone-400 dark:hover:border-champagne-400/50 dark:hover:text-stone-200",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "block h-1.5 w-1.5 rotate-45 transition-colors duration-300",
          active ? "bg-champagne-500 dark:bg-champagne-400" : "bg-stone-300 dark:bg-stone-700",
        )}
      />
      {children}
    </button>
  );
}

/* ── Option card — single-choice with icon (type de transaction…) ── */

export function OptionCard({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex flex-col items-start gap-3 overflow-hidden border p-5 text-left transition-all duration-300 active:scale-[0.98] sm:p-6",
        active
          ? "border-champagne-500 bg-champagne-50/60 shadow-[0_20px_44px_-28px_rgba(196,141,71,0.6)] dark:border-champagne-400 dark:bg-champagne-500/10"
          : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-champagne-400/60 dark:border-stone-800 dark:bg-anthracite-950 dark:hover:border-champagne-400/40",
      )}
    >
      {/* Active diamond, top-right */}
      <span
        aria-hidden
        className={cn(
          "absolute right-4 top-4 block h-2 w-2 rotate-45 transition-all duration-300",
          active
            ? "scale-100 bg-champagne-500 dark:bg-champagne-400"
            : "scale-75 bg-stone-200 group-hover:bg-champagne-300 dark:bg-stone-800",
        )}
      />
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 [&>svg]:h-5 [&>svg]:w-5",
          active
            ? "border-champagne-400 text-champagne-600 dark:text-champagne-300"
            : "border-stone-200 text-stone-400 group-hover:border-champagne-300 group-hover:text-brand-600 dark:border-stone-800 dark:text-stone-500 dark:group-hover:text-champagne-400",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "font-serif text-base font-semibold leading-snug transition-colors duration-300",
          active
            ? "text-anthracite-900 dark:text-champagne-200"
            : "text-anthracite-800 dark:text-stone-200",
        )}
      >
        {title}
      </span>
      {description && (
        <span className="font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {description}
        </span>
      )}
    </button>
  );
}

/* ── Wizard progress — numbered medallions joined by hairlines ── */

export function WizardProgress({
  steps,
  current,
  onStepClick,
}: {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className="flex items-start" aria-label="Étapes du formulaire">
      {steps.map((label, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const clickable = done && onStepClick;
        return (
          <li
            key={label}
            className={cn("flex items-start", i < steps.length - 1 && "flex-1")}
            aria-current={isCurrent ? "step" : undefined}
          >
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(i)}
              className={cn(
                "group flex flex-col items-center gap-2.5",
                clickable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border font-serif text-sm font-semibold transition-all duration-500",
                  isCurrent &&
                    "border-champagne-500 bg-champagne-500 text-anthracite-950 shadow-[0_0_0_6px_rgba(212,184,122,0.18)] dark:border-champagne-400 dark:bg-champagne-400",
                  done &&
                    "border-champagne-400/70 bg-white text-champagne-600 group-hover:border-champagne-500 dark:bg-anthracite-950 dark:text-champagne-300",
                  !isCurrent &&
                    !done &&
                    "border-stone-300 bg-white text-stone-400 dark:border-stone-700 dark:bg-anthracite-950 dark:text-stone-500",
                )}
              >
                {done ? (
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-6.5 6.5a.75.75 0 01-1.06 0l-3-3a.75.75 0 011.06-1.06L6.75 10.19l5.97-5.97a.75.75 0 011.06 0z" />
                  </svg>
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <span
                className={cn(
                  "font-sans text-[9px] tracking-[0.28em] uppercase transition-colors duration-500",
                  isCurrent
                    ? "font-semibold text-anthracite-900 dark:text-champagne-200"
                    : done
                      ? "text-champagne-600 dark:text-champagne-400"
                      : "text-stone-400 dark:text-stone-500",
                )}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-2 mt-5 h-px flex-1 transition-colors duration-700 sm:mx-4",
                  done ? "bg-champagne-400" : "bg-stone-200 dark:bg-stone-800",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Misc form furniture ── */

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="animate-fade-in border border-red-300 bg-red-50 px-4 py-3 font-sans text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
    >
      {message}
    </div>
  );
}

export function ConsentCheckbox({
  checked,
  onChange,
  intent,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  intent: string;
}) {
  return (
    <label className="flex items-start gap-3 font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-champagne-500"
        required
      />
      <span>
        J&apos;accepte que mes informations soient utilisées pour traiter {intent}, conformément à
        la{" "}
        <Link
          href="/politique-confidentialite"
          className="text-brand-700 underline-offset-2 hover:underline dark:text-champagne-300"
        >
          politique de confidentialité
        </Link>
        . Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos
        données.
      </span>
    </label>
  );
}

export function GleamButton({
  type = "button",
  onClick,
  disabled,
  children,
  className,
}: {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative inline-flex items-center justify-center gap-3 overflow-hidden bg-anthracite-900 px-10 py-4 font-sans text-[11px] tracking-[0.3em] uppercase text-white transition-colors duration-500 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-champagne-500 dark:text-anthracite-950 dark:hover:bg-champagne-400",
        className,
      )}
    >
      <span
        aria-hidden
        className="animate-gleam pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />
      <span className="relative inline-flex items-center gap-3">{children}</span>
    </button>
  );
}

export function ArrowIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
    </svg>
  );
}

export function BackButton({ onClick, label = "Retour" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.25em] uppercase text-stone-500 transition-colors hover:text-anthracite-900 dark:text-stone-400 dark:hover:text-stone-100"
    >
      <ArrowIcon className="h-3 w-3 rotate-180" />
      {label}
    </button>
  );
}

/* ── Success panel — celebratory, with “what happens next” rail ── */

export function SuccessPanel({
  overline,
  title,
  description,
  nextSteps,
  action,
}: {
  overline: string;
  title: string;
  description: string;
  nextSteps?: { label: string; description: string }[];
  action?: ReactNode;
}) {
  return (
    <div className="animate-scale-in border border-champagne-400/40 bg-white p-10 text-center sm:p-14 dark:border-champagne-400/30 dark:bg-anthracite-900">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-champagne-400 text-champagne-600 dark:text-champagne-300">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <p className="mt-6 font-sans text-[10px] tracking-[0.4em] uppercase text-champagne-600 dark:text-champagne-400">
        {overline}
      </p>
      <h3 className="mt-4 font-serif text-2xl italic text-anthracite-900 sm:text-3xl dark:text-stone-100">
        {title}
      </h3>
      <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-loose text-stone-600 dark:text-stone-300">
        {description}
      </p>

      {nextSteps && nextSteps.length > 0 && (
        <div className="mx-auto mt-10 grid max-w-2xl gap-px border border-stone-200 bg-stone-200 sm:grid-cols-3 dark:border-stone-800 dark:bg-stone-800">
          {nextSteps.map((step, i) => (
            <div key={step.label} className="bg-white p-6 text-center dark:bg-anthracite-900">
              <p className="font-serif text-sm italic text-champagne-600 dark:text-champagne-400">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 font-sans text-[10px] font-semibold tracking-[0.25em] uppercase text-anthracite-800 dark:text-stone-200">
                {step.label}
              </p>
              <p className="mt-2 font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {action && <div className="mt-10">{action}</div>}
    </div>
  );
}

/* ── Honeypot — invisible spam trap shared by every public form ── */

export function Honeypot() {
  return (
    <div className="hidden" aria-hidden="true">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
