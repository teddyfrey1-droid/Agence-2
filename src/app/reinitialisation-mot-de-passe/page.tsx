"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur");
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center">
        <p className="font-medium">Lien invalide</p>
        <p className="mt-1">Ce lien de réinitialisation est invalide ou a expiré.</p>
      </div>
    );
  }

  return success ? (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 text-center">
      <p className="font-medium">Mot de passe modifié !</p>
      <p className="mt-1">Vous allez être redirigé vers la page de connexion...</p>
    </div>
  ) : (
    <>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="password"
          name="password"
          type="password"
          label="Nouveau mot de passe"
          required
          minLength={8}
          placeholder="8 caractères minimum"
          autoComplete="new-password"
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirmer le mot de passe"
          required
          minLength={8}
          placeholder="Répétez le mot de passe"
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
          Modifier le mot de passe
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Logo size="lg" />
        </div>

        <h1 className="text-2xl font-semibold text-anthracite-900 text-center">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-stone-500 text-center mb-8">
          Choisissez votre nouveau mot de passe.
        </p>

        <Suspense fallback={<div className="text-center text-stone-400">Chargement...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
