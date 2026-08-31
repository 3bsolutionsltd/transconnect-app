import { prisma } from '../lib/prisma';

export const ADMIN_ROLE_SLUG = 'ADMIN';

// Mirrors the permissions seeded in 20260831000000_dynamic_roles_permissions.
export const PERMISSION_SLUGS = [
  'dashboard.view',
  'routes.read',
  'routes.write',
  'operators.read',
  'operators.write',
  'operators_directory.view',
  'bookings.read',
  'bookings.write',
  'agents.read',
  'agents.write',
  'qr_scanner.use',
  'analytics.view',
  'users.read',
  'users.write',
  'roles.read',
  'roles.write',
  'settings.manage',
] as const;

export type PermissionSlug = (typeof PERMISSION_SLUGS)[number];

const CACHE_TTL_MS = 60_000;

type CacheEntry = { permissions: string[]; expiresAt: number };

const rolePermissionCache = new Map<string, CacheEntry>();

export const invalidatePermissionCache = (roleId?: string) => {
  if (roleId) {
    rolePermissionCache.delete(roleId);
    return;
  }
  rolePermissionCache.clear();
};

const loadRolePermissions = async (roleId: string): Promise<string[]> => {
  const cached = rolePermissionCache.get(roleId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const rows = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permission: { select: { slug: true } } },
  });

  const permissions = rows.map(row => row.permission.slug);
  rolePermissionCache.set(roleId, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });

  return permissions;
};

/**
 * Administrators always hold every permission so a misconfigured role cannot lock the platform out.
 * Falls back to the legacy UserRole enum when the user has not been assigned a dynamic role yet.
 */
export const resolvePermissions = async (params: {
  roleId?: string | null;
  legacyRole?: string | null;
}): Promise<string[]> => {
  const { roleId, legacyRole } = params;

  if (legacyRole === ADMIN_ROLE_SLUG) {
    return [...PERMISSION_SLUGS];
  }

  if (roleId) {
    return loadRolePermissions(roleId);
  }

  if (!legacyRole) {
    return [];
  }

  const role = await prisma.role.findUnique({
    where: { slug: legacyRole },
    select: { id: true },
  });

  return role ? loadRolePermissions(role.id) : [];
};

export const hasPermission = (granted: string[], required: string) => granted.includes(required);
