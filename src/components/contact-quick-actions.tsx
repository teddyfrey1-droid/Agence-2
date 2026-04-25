"use client";

import { haptic } from "@/lib/haptics";
import { useToast } from "@/components/ui/toast";

interface Props {
  contactId: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
}

async function logInteraction(contactId: string, type: "APPEL_SORTANT" | "EMAIL_SORTANT", subject: string) {
  try {
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, type, subject }),
    });
  } catch {
    /* non-blocking */
  }
}

/**
 * Tappable phone / mobile / email rows. On tap we open the system handler
 * (`tel:` / `mailto:`) AND silently log the action as an outgoing
 * interaction so the contact's history reflects the touch attempt.
 */
export function ContactQuickActions({ contactId, email, phone, mobile }: Props) {
  const { addToast } = useToast();

  function handleCall(num: string, kind: "phone" | "mobile") {
    haptic("tap");
    logInteraction(contactId, "APPEL_SORTANT", `Appel sortant (${kind === "mobile" ? "mobile" : "fixe"})`);
    addToast("Appel — interaction enregistrée", "info");
  }

  function handleEmail() {
    haptic("tap");
    if (!email) return;
    logInteraction(contactId, "EMAIL_SORTANT", "Email sortant");
    addToast("Email — interaction enregistrée", "info");
  }

  if (!email && !phone && !mobile) return null;

  return (
    <div className="-mx-1 mt-3 flex flex-wrap gap-2">
      {mobile && (
        <a
          href={`tel:${mobile.replace(/\s/g, "")}`}
          onClick={() => handleCall(mobile, "mobile")}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 active:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          Mobile
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          onClick={() => handleCall(phone, "phone")}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          Appeler
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={handleEmail}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100 active:bg-brand-200 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Email
        </a>
      )}
    </div>
  );
}
