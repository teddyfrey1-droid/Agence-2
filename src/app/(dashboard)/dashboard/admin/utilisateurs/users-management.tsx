"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────

type UserRole =
  | "SUPER_ADMIN"
  | "DIRIGEANT"
  | "ASSOCIE"
  | "MANAGER"
  | "AGENT"
  | "ASSISTANT"
  | "CLIENT";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  team?: { id: string; name: string } | null;
}

// ─── Constants ───────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRIGEANT: "Dirigeant",
  ASSOCIE: "Associé",
  MANAGER: "Manager",
  AGENT: "Agent",
  ASSISTANT: "Assistant",
  CLIENT: "Client",
};

const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "DIRIGEANT",
  "ASSOCIE",
  "MANAGER",
  "AGENT",
  "ASSISTANT",
  "CLIENT",
];

function roleBadgeVariant(role: UserRole) {
  if (role === "SUPER_ADMIN" || role === "DIRIGEANT") return "danger" as const;
  if (role === "ASSOCIE" || role === "MANAGER") return "warning" as const;
  if (role === "AGENT" || role === "ASSISTANT") return "info" as const;
  return "neutral" as const;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Jamais";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// ─── Create User Modal ──────────────────────────────────────────────

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "AGENT" as UserRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }
      onCreated();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-anthracite-900">
            Nouvel utilisateur
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-anthracite-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className={inputClass}
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-anthracite-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className={inputClass}
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="jean.dupont@exemple.fr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="6 caractères minimum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Rôle
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className={inputClass}
            >
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" isLoading={loading}>
              Créer l&apos;utilisateur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function UsersManagement({ users: initialUsers }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleToggleBlock = async (user: User) => {
    const action = user.isActive ? "block" : "unblock";
    const label = user.isActive ? "bloquer" : "débloquer";
    if (!window.confirm(`Voulez-vous ${label} ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    );
    setLoadingAction(user.id);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        // Revert on error
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u))
        );
        const data = await res.json();
        alert(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      // Revert
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u))
      );
      alert("Erreur réseau");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (
      !window.confirm(
        `Supprimer ${user.firstName} ${user.lastName} (${user.email}) ?\n\nCette action est irréversible.`
      )
    ) {
      return;
    }

    setLoadingAction(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      alert("Erreur réseau");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreated = () => {
    setShowCreateModal(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900">
            Utilisateurs
          </h1>
          <p className="text-sm text-stone-500">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvel utilisateur
        </Button>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-4 py-3 text-left font-medium text-stone-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Rôle</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">
                  Dernière connexion
                </th>
                <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admin/utilisateurs/${user.id}`}
                      className="font-medium text-anthracite-800 hover:text-brand-600 transition-colors"
                    >
                      {user.firstName} {user.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant(user.role)}>
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? "success" : "neutral"}>
                      {user.isActive ? "Actif" : "Bloqué"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-400">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant={user.isActive ? "outline" : "secondary"}
                        size="sm"
                        disabled={loadingAction === user.id}
                        onClick={() => handleToggleBlock(user)}
                      >
                        {user.isActive ? "Bloquer" : "Débloquer"}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={loadingAction === user.id}
                        onClick={() => handleDelete(user)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                    Aucun utilisateur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <Card key={user.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/admin/utilisateurs/${user.id}`}
                  className="font-medium text-anthracite-800 hover:text-brand-600 transition-colors"
                >
                  {user.firstName} {user.lastName}
                </Link>
                <p className="text-sm text-stone-500 truncate">{user.email}</p>
              </div>
              <Badge variant={user.isActive ? "success" : "neutral"}>
                {user.isActive ? "Actif" : "Bloqué"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={roleBadgeVariant(user.role)}>
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
              <span className="text-stone-400">
                {formatDate(user.lastLoginAt)}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
              <Button
                variant={user.isActive ? "outline" : "secondary"}
                size="sm"
                className="flex-1"
                disabled={loadingAction === user.id}
                onClick={() => handleToggleBlock(user)}
              >
                {user.isActive ? "Bloquer" : "Débloquer"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                disabled={loadingAction === user.id}
                onClick={() => handleDelete(user)}
              >
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
        {users.length === 0 && (
          <Card className="p-8 text-center text-stone-400">Aucun utilisateur</Card>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
