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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Identifiants incorrects");
      }

      const destination = data.role === "CLIENT" ? "/espace-client" : "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-anthracite-900 items-center justify-center">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-anthracite-900 via-anthracite-900/95 to-brand-900/30" />

        <div className="relative z-10 max-w-md px-12 text-center">
          <Logo size="lg" variant="dark" />
          <div className="mt-8 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
          <p className="mt-8 text-lg font-light leading-relaxed text-stone-300">
            Votre partenaire de confiance pour l&apos;immobilier commercial et professionnel à Paris.
          </p>
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-stone-500">
            <div>
              <span className="block text-2xl font-semibold text-white">15+</span>
              ans d&apos;expertise
            </div>
            <div className="h-8 w-px bg-stone-700" />
            <div>
              <span className="block text-2xl font-semibold text-white">500+</span>
              transactions
            </div>
            <div className="h-8 w-px bg-stone-700" />
            <div>
              <span className="block text-2xl font-semibold text-white">98%</span>
              satisfaction
            </div>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-brand-50 px-6 dark:bg-anthracite-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center lg:hidden mb-10">
            <Logo size="lg" />
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
              Connexion
            </h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Accédez à votre espace de gestion
            </p>
          </div>

          {/* Mobile subtitle */}
          <p className="lg:hidden text-center text-sm text-stone-500 dark:text-stone-400 -mt-6 mb-8">
            Connectez-vous à votre espace
          </p>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
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

          <p className="mt-8 text-center text-sm text-stone-500 dark:text-stone-400">
            Pas encore de compte ?{" "}
            <a href="/inscription" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Créer un compte client
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
