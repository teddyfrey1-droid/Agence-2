"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors";

export default function ParametresPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setSuccess("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Paramètres</h1>
        <p className="text-sm text-stone-500">Gérez votre compte et vos préférences.</p>
      </div>

      {/* Change Password */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <h2 className="font-semibold text-anthracite-900">Changer le mot de passe</h2>
          <p className="text-sm text-stone-500">Mettez à jour votre mot de passe de connexion.</p>
        </div>

        <form onSubmit={handleChangePassword} className="px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="6 caractères minimum"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Répétez le mot de passe"
              autoComplete="new-password"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={loading}>
              Modifier le mot de passe
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
