"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Logo size="lg" />
        </div>

        <h1 className="text-2xl font-semibold text-anthracite-900 text-center">
          Mot de passe oublié
        </h1>
        <p className="mt-1 text-sm text-stone-500 text-center mb-8">
          Entrez votre email, nous vous enverrons un lien de réinitialisation.
        </p>

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 text-center">
            <p className="font-medium">Email envoyé !</p>
            <p className="mt-1">Si un compte existe avec cette adresse, vous recevrez un email avec un lien de réinitialisation.</p>
            <Link href="/login" className="mt-4 inline-block font-medium text-brand-600 hover:text-brand-700">
              Retour à la connexion
            </Link>
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
                id="email"
                name="email"
                type="email"
                label="Email"
                required
                placeholder="votre@email.com"
                autoComplete="email"
              />
              <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
                Envoyer le lien
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-stone-500">
              <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
