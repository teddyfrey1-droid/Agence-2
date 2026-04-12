"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  size = "md",
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in dark:bg-black/60" />

      {/* Content */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white shadow-2xl animate-scale-in dark:bg-anthracite-900 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] dark:ring-1 dark:ring-white/5",
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-stone-800">
            <h2 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-stone-600 dark:text-stone-400">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-anthracite-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50",
            confirmVariant === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-brand-600 hover:bg-brand-700"
          )}
        >
          {isLoading ? "..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
