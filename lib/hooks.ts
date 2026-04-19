"use client";

import { useEffect, useRef } from "react";

/**
 * Warn the user before navigating away from a page with unsaved changes.
 *
 * Uses the `beforeunload` event to intercept hard navigations (closing tab,
 * reloading, typing a URL) and shows a browser-native confirmation dialog.
 *
 * @param hasUnsavedChanges - whether the form currently has unsaved data
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore custom messages but still show a generic prompt
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
}

/**
 * Returns a ref-tracked submit handler that prevents double-submission.
 * The handler is disabled until the previous call resolves.
 *
 * Usage:
 *   const safeSubmit = usePreventDoubleSubmit(myAsyncHandler);
 *   <form onSubmit={safeSubmit}>
 */
export function usePreventDoubleSubmit(
  handler: (e: React.FormEvent) => Promise<void>
) {
  const submittingRef = useRef(false);

  return async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await handler(e);
    } finally {
      submittingRef.current = false;
    }
  };
}
