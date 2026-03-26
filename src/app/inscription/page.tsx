"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function InscriptionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone") || undefined,
          company: formData.get("company") || undefined,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
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
            Créez votre compte client
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-premium">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="firstName"
                name="firstName"
                label="Prénom"
                required
                placeholder="Jean"
                autoComplete="given-name"
              />
              <Input
                id="lastName"
                name="lastName"
                label="Nom"
                required
                placeholder="Dupont"
                autoComplete="family-name"
              />
            </div>

            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              required
              placeholder="jean@exemple.com"
              autoComplete="email"
            />

            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Téléphone (optionnel)"
              placeholder="06 12 34 56 78"
              autoComplete="tel"
            />

            <Input
              id="company"
              name="company"
              label="Société (optionnel)"
              placeholder="Nom de votre entreprise"
              autoComplete="organization"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Mot de passe"
              required
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              minLength={8}
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirmer le mot de passe"
              required
              placeholder="Retapez votre mot de passe"
              autoComplete="new-password"
              minLength={8}
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              Créer mon compte
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
