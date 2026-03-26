"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Identifiants incorrects");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-brand-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-stone-500">
            Connectez-vous à votre espace
          </p>
        </div>

        <div className="mt-6 rounded-premium border border-stone-200 bg-white p-6 shadow-premium sm:mt-8 sm:p-8">
          {error && (
            <div className="mb-6 rounded-premium border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              required
              placeholder="votre@email.com"
              autoComplete="email"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Mot de passe"
              required
              placeholder="Votre mot de passe"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              Se connecter
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          Accès réservé aux collaborateurs de l&apos;agence.
        </p>
      </div>
    </div>
  );
}
