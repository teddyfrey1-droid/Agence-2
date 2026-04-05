import type { UserRole } from "@prisma/client";

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "assign"
  | "manage_users"
  | "view_admin"
  | "view_performance"
  | "export";

export type Resource =
  | "property"
  | "contact"
  | "search_request"
  | "deal"
  | "task"
  | "interaction"
  | "field_spotting"
  | "match"
  | "user"
  | "agency"
  | "audit_log";

export const ALL_RESOURCES: Resource[] = [
  "property",
  "contact",
  "search_request",
  "deal",
  "task",
  "interaction",
  "field_spotting",
  "match",
  "user",
  "agency",
  "audit_log",
];

export const ALL_ACTIONS: Action[] = [
  "create",
  "read",
  "update",
  "delete",
  "publish",
  "assign",
  "manage_users",
  "view_admin",
  "view_performance",
  "export",
];

export const RESOURCE_LABELS: Record<Resource, string> = {
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

export const ACTION_LABELS: Record<Action, string> = {
  create: "Créer",
  read: "Voir",
  update: "Modifier",
  delete: "Supprimer",
  publish: "Publier",
  assign: "Assigner",
  manage_users: "Gérer utilisateurs",
  view_admin: "Voir admin",
  view_performance: "Voir performances",
  export: "Exporter",
};

export type PermissionMap = Record<UserRole, Partial<Record<Resource, Action[]>>>;

// Custom permissions stored per user as JSON
export type CustomPermissions = Partial<Record<Resource, Action[]>>;

export const PERMISSIONS: PermissionMap = {
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

/**
 * Check if a role (optionally with custom per-user overrides) has a specific permission.
 * Custom permissions fully replace the role's permissions for a given resource.
 */
export function hasPermission(
  role: UserRole,
  resource: Resource,
  action: Action,
  customPermissions?: CustomPermissions | null
): boolean {
  // If custom permissions exist for this resource, use them instead of role defaults
  if (customPermissions && resource in customPermissions) {
    const customActions = customPermissions[resource];
    return customActions ? customActions.includes(action) : false;
  }

  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  const resourceActions = rolePermissions[resource];
  if (!resourceActions) return false;
  return resourceActions.includes(action);
}

/**
 * Get the effective permissions for a user (role defaults merged with custom overrides).
 */
export function getEffectivePermissions(
  role: UserRole,
  customPermissions?: CustomPermissions | null
): Partial<Record<Resource, Action[]>> {
  const rolePerms = PERMISSIONS[role] || {};
  if (!customPermissions) return rolePerms;

  const effective: Partial<Record<Resource, Action[]>> = {};
  for (const resource of ALL_RESOURCES) {
    if (resource in customPermissions) {
      effective[resource] = customPermissions[resource] || [];
    } else {
      effective[resource] = rolePerms[resource] || [];
    }
  }
  return effective;
}

export function canAccessDashboard(role: UserRole): boolean {
  return true;
}

export function canAccessAdmin(role: UserRole): boolean {
  const adminRoles: UserRole[] = ["SUPER_ADMIN", "DIRIGEANT"];
  return adminRoles.includes(role);
}

export function canViewPerformance(role: UserRole): boolean {
  const performanceRoles: UserRole[] = [
    "SUPER_ADMIN",
    "DIRIGEANT",
    "ASSOCIE",
    "MANAGER",
  ];
  return performanceRoles.includes(role);
}
