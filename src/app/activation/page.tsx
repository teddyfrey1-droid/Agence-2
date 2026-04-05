"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

function ActivationForm() {
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
      const res = await fetch("/api/auth/activate", {
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
        <p className="mt-1">Ce lien d&apos;activation est invalide ou a expiré. Contactez votre administrateur.</p>
      </div>
    );
  }

  return success ? (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 text-center">
      <p className="font-medium">Compte activé !</p>
      <p className="mt-1">Votre compte est maintenant actif. Vous allez être redirigé vers la page de connexion...</p>
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
          label="Choisissez votre mot de passe"
          required
          minLength={6}
          placeholder="6 caractères minimum"
          autoComplete="new-password"
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirmer le mot de passe"
          required
          minLength={6}
          placeholder="Répétez le mot de passe"
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
          Activer mon compte
        </Button>
      </form>
    </>
  );
}

export default function ActivationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Logo size="lg" />
        </div>

        <h1 className="text-2xl font-semibold text-anthracite-900 text-center">
          Activer votre compte
        </h1>
        <p className="mt-1 text-sm text-stone-500 text-center mb-8">
          Bienvenue ! Choisissez un mot de passe pour activer votre compte.
        </p>

        <Suspense fallback={<div className="text-center text-stone-400">Chargement...</div>}>
          <ActivationForm />
        </Suspense>
      </div>
    </div>
  );
}
