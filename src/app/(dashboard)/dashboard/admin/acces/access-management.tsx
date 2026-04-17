"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────

type UserRole = "SUPER_ADMIN" | "DIRIGEANT" | "ASSOCIE" | "MANAGER" | "AGENT" | "ASSISTANT" | "CLIENT";
type Resource = "property" | "contact" | "search_request" | "deal" | "task" | "interaction" | "field_spotting" | "match" | "user" | "agency" | "audit_log";
type Action = "create" | "read" | "update" | "delete" | "publish" | "assign" | "manage_users" | "view_admin" | "view_performance" | "export";

interface UserWithPerms {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  customPermissions: Record<string, string[]> | null;
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

const RESOURCE_LABELS: Record<Resource, string> = {
  property: "Biens",
  contact: "Contacts",
  search_request: "Demandes",
  deal: "Dossiers",
  task: "Tâches",
  interaction: "Interactions",
  field_spotting: "Repérages",
  match: "Matchs",
  user: "Utilisateurs",
  agency: "Agence",
  audit_log: "Journal",
};

const ACTION_LABELS: Record<Action, string> = {
  create: "Créer",
  read: "Voir",
  update: "Modifier",
  delete: "Supprimer",
  publish: "Publier",
  assign: "Assigner",
  manage_users: "Gérer users",
  view_admin: "Admin",
  view_performance: "Perf.",
  export: "Exporter",
};

const ALL_RESOURCES: Resource[] = ["property", "contact", "search_request", "deal", "task", "interaction", "field_spotting", "match", "user", "agency", "audit_log"];

// Relevant actions per resource (simplified)
const RESOURCE_ACTIONS: Record<Resource, Action[]> = {
  property: ["create", "read", "update", "delete", "publish", "assign", "export"],
  contact: ["create", "read", "update", "delete", "export"],
  search_request: ["create", "read", "update", "delete", "assign", "export"],
  deal: ["create", "read", "update", "delete", "assign", "export"],
  task: ["create", "read", "update", "delete", "assign"],
  interaction: ["create", "read", "update", "delete"],
  field_spotting: ["create", "read", "update", "delete"],
  match: ["create", "read", "update", "delete"],
  user: ["create", "read", "update", "delete", "manage_users"],
  agency: ["read", "update"],
  audit_log: ["read"],
};

const ALL_ROLES: UserRole[] = ["SUPER_ADMIN", "DIRIGEANT", "ASSOCIE", "MANAGER", "AGENT", "ASSISTANT", "CLIENT"];

// Default role permissions (mirrored from server)
const DEFAULT_PERMISSIONS: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: {
    property: ["create", "read", "update", "delete", "publish", "assign", "export"],
    contact: ["create", "read", "update", "delete", "export"],
    search_request: ["create", "read", "update", "delete", "assign", "export"],
    deal: ["create", "read", "update", "delete", "assign", "export"],
    task: ["create", "read", "update", "delete", "assign"],
    interaction: ["create", "read", "update", "delete"],
    field_spotting: ["create", "read", "update", "delete"],
    match: ["create", "read", "update", "delete"],
    user: ["create", "read", "update", "delete", "manage_users"],
    agency: ["read", "update"],
    audit_log: ["read"],
  },
  DIRIGEANT: {
    property: ["create", "read", "update", "delete", "publish", "assign", "export"],
    contact: ["create", "read", "update", "delete", "export"],
    search_request: ["create", "read", "update", "delete", "assign", "export"],
    deal: ["create", "read", "update", "delete", "assign", "export"],
    task: ["create", "read", "update", "delete", "assign"],
    interaction: ["create", "read", "update", "delete"],
    field_spotting: ["create", "read", "update", "delete"],
    match: ["create", "read", "update", "delete"],
    user: ["create", "read", "update", "manage_users"],
    agency: ["read", "update"],
    audit_log: ["read"],
  },
  ASSOCIE: {
    property: ["create", "read", "update", "publish", "assign"],
    contact: ["create", "read", "update"],
    search_request: ["create", "read", "update", "assign"],
    deal: ["create", "read", "update", "assign"],
    task: ["create", "read", "update", "assign"],
    interaction: ["create", "read", "update"],
    field_spotting: ["create", "read", "update"],
    match: ["create", "read", "update"],
    user: ["read"],
    agency: ["read"],
    audit_log: ["read"],
  },
  MANAGER: {
    property: ["create", "read", "update", "publish", "assign"],
    contact: ["create", "read", "update"],
    search_request: ["create", "read", "update", "assign"],
    deal: ["create", "read", "update", "assign"],
    task: ["create", "read", "update", "assign"],
    interaction: ["create", "read", "update"],
    field_spotting: ["create", "read", "update"],
    match: ["create", "read", "update"],
    user: ["read"],
    agency: ["read"],
    audit_log: [],
  },
  AGENT: {
    property: ["create", "read", "update"],
    contact: ["create", "read", "update"],
    search_request: ["create", "read", "update"],
    deal: ["create", "read", "update"],
    task: ["create", "read", "update"],
    interaction: ["create", "read", "update"],
    field_spotting: ["create", "read", "update"],
    match: ["read"],
    user: [],
    agency: [],
    audit_log: [],
  },
  ASSISTANT: {
    property: ["read", "update"],
    contact: ["create", "read", "update"],
    search_request: ["create", "read", "update"],
    deal: ["read"],
    task: ["create", "read", "update"],
    interaction: ["create", "read"],
    field_spotting: ["read"],
    match: ["read"],
    user: [],
    agency: [],
    audit_log: [],
  },
  CLIENT: {
    property: ["read"],
    contact: [],
    search_request: ["create", "read"],
    deal: ["read"],
    task: [],
    interaction: [],
    field_spotting: [],
    match: ["read"],
    user: [],
    agency: [],
    audit_log: [],
  },
};

function roleBadgeVariant(role: UserRole) {
  if (role === "SUPER_ADMIN" || role === "DIRIGEANT") return "danger" as const;
  if (role === "ASSOCIE" || role === "MANAGER") return "warning" as const;
  if (role === "AGENT" || role === "ASSISTANT") return "info" as const;
  return "neutral" as const;
}

// ─── Toast ──────────────────────────────────────────────────────────

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

// ─── Permission Grid (reusable) ─────────────────────────────────────

function PermissionGrid({
  permissions,
  onChange,
  readOnly,
}: {
  permissions: Partial<Record<Resource, Action[]>>;
  onChange?: (resource: Resource, action: Action, enabled: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-stone-200 dark:border-anthracite-800">
            <th className="px-3 py-2 text-left font-medium text-stone-500 sticky left-0 bg-white min-w-[120px] dark:bg-anthracite-900 dark:text-stone-400">Ressource</th>
            {Object.entries(ACTION_LABELS).map(([action, label]) => (
              <th key={action} className="px-2 py-2 text-center font-medium text-stone-500 min-w-[60px] dark:text-stone-400">
                <span className="text-[10px] leading-tight">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-anthracite-800">
          {ALL_RESOURCES.map((resource) => {
            const relevantActions = RESOURCE_ACTIONS[resource];
            const resourcePerms = permissions[resource] || [];
            return (
              <tr key={resource} className="hover:bg-stone-50/50 dark:hover:bg-anthracite-800/40">
                <td className="px-3 py-2 font-medium text-anthracite-700 sticky left-0 bg-white text-sm dark:bg-anthracite-900 dark:text-stone-200">
                  {RESOURCE_LABELS[resource]}
                </td>
                {(Object.keys(ACTION_LABELS) as Action[]).map((action) => {
                  const isRelevant = relevantActions.includes(action);
                  const isEnabled = resourcePerms.includes(action);
                  return (
                    <td key={action} className="px-2 py-2 text-center">
                      {isRelevant ? (
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => onChange?.(resource, action, !isEnabled)}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-all ${
                            isEnabled
                              ? "bg-emerald-500 text-white shadow-sm dark:bg-emerald-600"
                              : "bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-anthracite-800 dark:text-stone-500 dark:hover:bg-anthracite-700"
                          } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {isEnabled ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          )}
                        </button>
                      ) : (
                        <span className="inline-block h-6 w-6 rounded-md bg-stone-50 dark:bg-anthracite-800/50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── User Permission Editor Modal ───────────────────────────────────

function UserPermissionModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserWithPerms;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const roleDefaults = DEFAULT_PERMISSIONS[user.role] || {};
  const hasCustom = !!user.customPermissions;

  // Initialize with custom permissions or role defaults
  const [permissions, setPermissions] = useState<Partial<Record<Resource, Action[]>>>(() => {
    if (user.customPermissions) {
      // Merge: for resources not in customPermissions, use role defaults
      const merged: Partial<Record<Resource, Action[]>> = {};
      for (const resource of ALL_RESOURCES) {
        if (resource in user.customPermissions) {
          merged[resource] = [...(user.customPermissions[resource] || [])] as Action[];
        } else {
          merged[resource] = [...(roleDefaults[resource] || [])];
        }
      }
      return merged;
    }
    // Start from role defaults
    const copy: Partial<Record<Resource, Action[]>> = {};
    for (const resource of ALL_RESOURCES) {
      copy[resource] = [...(roleDefaults[resource] || [])];
    }
    return copy;
  });

  const [isCustom, setIsCustom] = useState(hasCustom);
  const [loading, setLoading] = useState(false);

  const handleToggle = (resource: Resource, action: Action, enabled: boolean) => {
    setPermissions((prev) => {
      const current = prev[resource] || [];
      const next = enabled
        ? [...current, action]
        : current.filter((a) => a !== action);
      return { ...prev, [resource]: next };
    });
    if (!isCustom) setIsCustom(true);
  };

  const handleResetToDefaults = () => {
    const copy: Partial<Record<Resource, Action[]>> = {};
    for (const resource of ALL_RESOURCES) {
      copy[resource] = [...(roleDefaults[resource] || [])];
    }
    setPermissions(copy);
    setIsCustom(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customPermissions: isCustom ? permissions : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur");
        return;
      }
      onSaved(isCustom ? "Permissions personnalisées sauvegardées" : "Permissions réinitialisées aux valeurs par défaut");
    } catch {
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col dark:bg-anthracite-900 dark:ring-1 dark:ring-anthracite-800">
        <div className="border-b border-stone-100 px-6 py-4 flex items-center justify-between flex-shrink-0 dark:border-anthracite-800">
          <div>
            <h2 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">
              Permissions — {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-stone-500 flex items-center gap-2 mt-0.5 dark:text-stone-400">
              Rôle de base :
              <Badge variant={roleBadgeVariant(user.role)}>{ROLE_LABELS[user.role]}</Badge>
              {isCustom && <Badge variant="warning">Personnalisé</Badge>}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors dark:text-stone-500 dark:hover:text-stone-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Cliquez sur les cases pour activer/désactiver les permissions. Les modifications sont indépendantes du rôle.
            </p>
            {isCustom && (
              <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
                Réinitialiser au rôle
              </Button>
            )}
          </div>
          <PermissionGrid permissions={permissions} onChange={handleToggle} />
        </div>

        <div className="border-t border-stone-100 px-6 py-4 flex justify-end gap-3 flex-shrink-0 dark:border-anthracite-800">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} isLoading={loading}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function AccessManagement({ users }: { users: UserWithPerms[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");
  const [selectedRole, setSelectedRole] = useState<UserRole>("AGENT");
  const [editingUser, setEditingUser] = useState<UserWithPerms | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handlePermsSaved = (msg: string) => {
    setEditingUser(null);
    showToast(msg);
    router.refresh();
  };

  const usersWithCustomPerms = users.filter((u) => u.customPermissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Gestion des accès</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Gérez les permissions par rôle et personnalisez par utilisateur.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit dark:bg-anthracite-800">
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "roles"
              ? "bg-white text-anthracite-900 shadow-sm dark:bg-anthracite-900 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          }`}
        >
          Par rôle
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "bg-white text-anthracite-900 shadow-sm dark:bg-anthracite-900 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          }`}
        >
          Par utilisateur
        </button>
      </div>

      {/* ─── Tab: Roles ───────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          {/* Role selector */}
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  selectedRole === role
                    ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-300"
                    : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-anthracite-700 dark:bg-anthracite-900 dark:text-stone-300 dark:hover:bg-anthracite-800"
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>

          {/* Role permissions grid (read-only) */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 dark:border-anthracite-800 dark:bg-anthracite-800/30">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-anthracite-800 dark:text-stone-200">
                  Permissions du rôle{" "}
                  <Badge variant={roleBadgeVariant(selectedRole)}>{ROLE_LABELS[selectedRole]}</Badge>
                </h3>
                <span className="text-xs text-stone-400 dark:text-stone-500">Lecture seule — les permissions par rôle sont définies dans le système</span>
              </div>
            </div>
            <PermissionGrid permissions={DEFAULT_PERMISSIONS[selectedRole] || {}} readOnly />
          </Card>

          {/* Summary */}
          <Card className="p-4">
            <h3 className="font-medium text-anthracite-800 mb-3 dark:text-stone-200">Résumé des rôles</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_ROLES.map((role) => {
                const perms = DEFAULT_PERMISSIONS[role] || {};
                const totalActions = Object.values(perms).reduce((sum, actions) => sum + (actions?.length || 0), 0);
                const usersCount = users.filter((u) => u.role === role).length;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedRole === role
                        ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30"
                        : "border-stone-200 hover:bg-stone-50 dark:border-anthracite-700 dark:hover:bg-anthracite-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={roleBadgeVariant(role)}>{ROLE_LABELS[role]}</Badge>
                      <span className="text-xs text-stone-400 dark:text-stone-500">{usersCount} utilisateur{usersCount !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{totalActions} permission{totalActions !== 1 ? "s" : ""}</p>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─── Tab: Users ───────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Users with custom permissions */}
          {usersWithCustomPerms.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-amber-50/50 dark:border-anthracite-800 dark:bg-amber-900/10">
                <h3 className="font-medium text-anthracite-800 flex items-center gap-2 dark:text-stone-200">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Utilisateurs avec permissions personnalisées
                </h3>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-anthracite-800">
                {usersWithCustomPerms.map((u) => (
                  <div key={u.id} className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors dark:hover:bg-anthracite-800/40">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-anthracite-800 dark:text-stone-200">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{u.email}</p>
                      </div>
                      <Badge variant={roleBadgeVariant(u.role)}>{ROLE_LABELS[u.role]}</Badge>
                      <Badge variant="warning">Personnalisé</Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingUser(u)}>
                      Modifier
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All users list */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 dark:border-anthracite-800 dark:bg-anthracite-800/30">
              <h3 className="font-medium text-anthracite-800 dark:text-stone-200">Tous les utilisateurs</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Cliquez sur un utilisateur pour personnaliser ses permissions</p>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-anthracite-800">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setEditingUser(u)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors text-left dark:hover:bg-anthracite-800/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600 flex-shrink-0 dark:bg-anthracite-800 dark:text-stone-300">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-anthracite-800 truncate dark:text-stone-200">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-stone-500 truncate dark:text-stone-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={roleBadgeVariant(u.role)}>{ROLE_LABELS[u.role]}</Badge>
                    {u.customPermissions && <Badge variant="warning">Perso.</Badge>}
                    <svg className="h-4 w-4 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Edit user permissions modal */}
      {editingUser && (
        <UserPermissionModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={handlePermsSaved}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
