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
  isActivated?: boolean;
  invitedAt?: string | null;
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

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors";

// ─── Toast notification ─────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg animate-fade-in ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Create User Modal ──────────────────────────────────────────────

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "AGENT" as UserRole,
    sendInvitation: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sendInvitation && form.password.length < 8) {
      setError("Mot de passe de 8 caractères minimum requis si pas d'invitation");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.sendInvitation ? undefined : form.password,
          phone: form.phone || undefined,
          role: form.role,
          sendInvitation: form.sendInvitation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }
      onCreated(
        form.sendInvitation
          ? `Utilisateur créé et invitation envoyée à ${form.email}`
          : `Utilisateur ${form.firstName} ${form.lastName} créé`
      );
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-anthracite-900">
            Nouvel utilisateur
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
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
              <label className="block text-sm font-medium text-anthracite-700 mb-1">Prénom</label>
              <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} placeholder="Jean" />
            </div>
            <div>
              <label className="block text-sm font-medium text-anthracite-700 mb-1">Nom</label>
              <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} placeholder="Dupont" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="jean.dupont@exemple.fr" />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">Téléphone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="06 12 34 56 78" />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className={inputClass}>
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </div>

          {/* Invitation toggle */}
          <div className="rounded-lg border border-stone-200 p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendInvitation}
                onChange={(e) => setForm({ ...form, sendInvitation: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-sm font-medium text-anthracite-700">Envoyer une invitation par email</span>
                <p className="text-xs text-stone-500">L&apos;utilisateur recevra un email pour activer son compte et choisir son mot de passe</p>
              </div>
            </label>

            {!form.sendInvitation && (
              <div>
                <label className="block text-sm font-medium text-anthracite-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required={!form.sendInvitation}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                  placeholder="8 caractères minimum"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={loading}>
              {form.sendInvitation ? "Créer et inviter" : "Créer l'utilisateur"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit User Modal ────────────────────────────────────────────────

function EditUserModal({
  user,
  onClose,
  onUpdated,
}: {
  user: User;
  onClose: () => void;
  onUpdated: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {};
      if (form.email !== user.email) payload.email = form.email;
      if (form.firstName !== user.firstName) payload.firstName = form.firstName;
      if (form.lastName !== user.lastName) payload.lastName = form.lastName;
      if (form.phone !== (user.phone || "")) payload.phone = form.phone || null;
      if (form.role !== user.role) payload.role = form.role;
      if (form.password) payload.password = form.password;

      if (Object.keys(payload).length === 0) {
        setError("Aucune modification");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la mise à jour");
        return;
      }
      onUpdated("Utilisateur mis à jour");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, label: string) => {
    setActionLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      onUpdated(data.message || label);
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-stone-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-anthracite-900">
            Modifier — {user.firstName} {user.lastName}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-anthracite-700 mb-1">Prénom</label>
              <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-anthracite-700 mb-1">Nom</label>
              <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">Téléphone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className={inputClass}>
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite-700 mb-1">
              Nouveau mot de passe <span className="text-stone-400 font-normal">(laisser vide pour ne pas changer)</span>
            </label>
            <input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="8 caractères minimum" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={loading}>Enregistrer</Button>
          </div>
        </form>

        {/* Quick actions */}
        <div className="border-t border-stone-100 px-6 py-4 space-y-3">
          <h3 className="text-sm font-medium text-anthracite-700">Actions rapides</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              isLoading={actionLoading === "invite"}
              onClick={() => handleAction("invite", "Invitation envoyée")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Renvoyer invitation
            </Button>
            <Button
              variant="outline"
              size="sm"
              isLoading={actionLoading === "reset_password"}
              onClick={() => handleAction("reset_password", "Email de réinitialisation envoyé")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Email réinitialisation MDP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function UsersManagement({ users: initialUsers }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole !== "ALL" && u.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleBlock = async (user: User) => {
    const action = user.isActive ? "block" : "unblock";
    const label = user.isActive ? "bloquer" : "débloquer";
    if (!window.confirm(`Voulez-vous ${label} ${user.firstName} ${user.lastName} ?`)) return;

    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    setLoadingAction(user.id);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u)));
        const data = await res.json();
        showToast(data.error || "Erreur", "error");
      } else {
        showToast(user.isActive ? "Utilisateur bloqué" : "Utilisateur débloqué");
      }
    } catch {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u)));
      showToast("Erreur réseau", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Supprimer ${user.firstName} ${user.lastName} (${user.email}) ?\n\nCette action est irréversible.`)) return;

    setLoadingAction(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Erreur", "error");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast("Utilisateur supprimé");
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreated = (msg: string) => {
    setShowCreateModal(false);
    showToast(msg);
    router.refresh();
  };

  const handleUpdated = (msg: string) => {
    setEditingUser(null);
    showToast(msg);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900">Utilisateurs</h1>
          <p className="text-sm text-stone-500">{users.length} utilisateur{users.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvel utilisateur
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} sm:max-w-xs`}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | "ALL")}
          className={`${inputClass} sm:max-w-[200px]`}
        >
          <option value="ALL">Tous les rôles</option>
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
          ))}
        </select>
        <span className="text-sm text-stone-400">
          {filteredUsers.length} résultat{filteredUsers.length !== 1 ? "s" : ""}
        </span>
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
                <th className="px-4 py-3 text-left font-medium text-stone-500">Dernière connexion</th>
                <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/admin/utilisateurs/${user.id}`} className="font-medium text-anthracite-800 hover:text-brand-600 transition-colors">
                      {user.firstName} {user.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant(user.role)}>{ROLE_LABELS[user.role] || user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={user.isActive ? "success" : "neutral"}>
                        {user.isActive ? "Actif" : "Bloqué"}
                      </Badge>
                      {user.invitedAt && !user.isActivated && (
                        <Badge variant="warning">En attente</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-400">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier
                      </Button>
                      <Button
                        variant={user.isActive ? "outline" : "secondary"}
                        size="sm"
                        disabled={loadingAction === user.id}
                        onClick={() => handleToggleBlock(user)}
                      >
                        {user.isActive ? "Bloquer" : "Débloquer"}
                      </Button>
                      <Button variant="danger" size="sm" disabled={loadingAction === user.id} onClick={() => handleDelete(user)}>
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400">Aucun utilisateur</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/dashboard/admin/utilisateurs/${user.id}`} className="font-medium text-anthracite-800 hover:text-brand-600 transition-colors">
                  {user.firstName} {user.lastName}
                </Link>
                <p className="text-sm text-stone-500 truncate">{user.email}</p>
              </div>
              <Badge variant={user.isActive ? "success" : "neutral"}>
                {user.isActive ? "Actif" : "Bloqué"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={roleBadgeVariant(user.role)}>{ROLE_LABELS[user.role] || user.role}</Badge>
              {user.invitedAt && !user.isActivated && <Badge variant="warning">En attente</Badge>}
              <span className="text-stone-400">{formatDate(user.lastLoginAt)}</span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingUser(user)}>Modifier</Button>
              <Button variant={user.isActive ? "outline" : "secondary"} size="sm" className="flex-1" disabled={loadingAction === user.id} onClick={() => handleToggleBlock(user)}>
                {user.isActive ? "Bloquer" : "Débloquer"}
              </Button>
              <Button variant="danger" size="sm" className="flex-1" disabled={loadingAction === user.id} onClick={() => handleDelete(user)}>
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
        {filteredUsers.length === 0 && (
          <Card className="p-8 text-center text-stone-400">Aucun utilisateur</Card>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onUpdated={handleUpdated} />}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
