import type { UserRole } from "@prisma/client";

type Action =
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

type Resource =
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

type PermissionMap = Record<UserRole, Partial<Record<Resource, Action[]>>>;

const PERMISSIONS: PermissionMap = {
  SUPER_ADMIN: {
    property: ["create", "read", "update", "delete", "publish", "assign"],
    contact: ["create", "read", "update", "delete"],
    search_request: ["create", "read", "update", "delete", "assign"],
    deal: ["create", "read", "update", "delete", "assign"],
    task: ["create", "read", "update", "delete", "assign"],
    interaction: ["create", "read", "update", "delete"],
    field_spotting: ["create", "read", "update", "delete"],
    match: ["create", "read", "update", "delete"],
    user: ["create", "read", "update", "delete", "manage_users"],
    agency: ["read", "update"],
    audit_log: ["read"],
  },
  DIRIGEANT: {
    property: ["create", "read", "update", "delete", "publish", "assign"],
    contact: ["create", "read", "update", "delete"],
    search_request: ["create", "read", "update", "delete", "assign"],
    deal: ["create", "read", "update", "delete", "assign"],
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

export function hasPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  const resourceActions = rolePermissions[resource];
  if (!resourceActions) return false;
  return resourceActions.includes(action);
}

export function canAccessDashboard(role: UserRole): boolean {
  return true; // All roles can access dashboard
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
