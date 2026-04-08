"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  contactEmail: string;
  contactFirstName: string;
  accountStatus: "no_account" | "pending_activation" | "active" | "blocked";
}

export function ContactAccountActions({ userId, contactEmail, contactFirstName, accountStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = async (action: string, label: string) => {
    if (!userId) return;
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erreur", "error");
        return;
      }
      showToast(data.message || label);
      router.refresh();
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateAccount = async () => {
    setLoading("create");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: contactFirstName,
          lastName: "",
          email: contactEmail,
          role: "CLIENT",
          sendInvitation: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erreur lors de la création", "error");
        return;
      }
      showToast("Compte créé et invitation envoyée");
      router.refresh();
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {accountStatus === "no_account" && contactEmail && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          isLoading={loading === "create"}
          onClick={handleCreateAccount}
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Créer un compte client
        </Button>
      )}

      {accountStatus === "pending_activation" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          isLoading={loading === "invite"}
          onClick={() => handleAction("invite", "Invitation renvoyée")}
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Renvoyer l&apos;invitation
        </Button>
      )}

      {accountStatus === "active" && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          isLoading={loading === "reset_password"}
          onClick={() => handleAction("reset_password", "Email de réinitialisation envoyé")}
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Email réinitialisation MDP
        </Button>
      )}

      {(accountStatus === "active" || accountStatus === "pending_activation") && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          isLoading={loading === "block"}
          onClick={() => handleAction("block", "Compte bloqué")}
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Bloquer le compte
        </Button>
      )}

      {accountStatus === "blocked" && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-start"
          isLoading={loading === "unblock"}
          onClick={() => handleAction("unblock", "Compte débloqué")}
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Débloquer le compte
        </Button>
      )}

      {toast && (
        <div className={`rounded-lg px-3 py-2 text-xs font-medium ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
