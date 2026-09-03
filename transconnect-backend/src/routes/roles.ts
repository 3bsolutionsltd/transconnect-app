import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requirePermission } from '../middleware/auth';
import { invalidatePermissionCache } from '../services/permissions';

const router = Router();

router.use(authenticateToken);

const slugify = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const roleSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    select: { permission: { select: { id: true, slug: true, resource: true, action: true, description: true } } },
  },
  _count: { select: { users: true } },
} as const;

const serializeRole = (role: any) => ({
  id: role.id,
  slug: role.slug,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
  userCount: role._count?.users ?? 0,
  permissions: (role.permissions ?? []).map((entry: any) => entry.permission.slug),
});

router.get('/', requirePermission('roles.read'), async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      select: roleSelect,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    res.json({ roles: roles.map(serializeRole) });
  } catch (error) {
    console.error('Error listing roles:', error);
    res.status(500).json({ error: 'Failed to load roles' });
  }
});

router.get('/permissions', requirePermission('roles.read'), async (_req: Request, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      select: { id: true, slug: true, resource: true, action: true, description: true },
    });

    res.json({ permissions });
  } catch (error) {
    console.error('Error listing permissions:', error);
    res.status(500).json({ error: 'Failed to load permissions' });
  }
});

router.post('/', requirePermission('roles.write'), async (req: Request, res: Response) => {
  try {
    const { name, description, permissions = [] } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Role name must be at least 3 characters' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array of permission slugs' });
    }

    const slug = slugify(name);
    if (!slug) {
      return res.status(400).json({ error: 'Role name must contain letters or numbers' });
    }

    const existing = await prisma.role.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: `A role with slug ${slug} already exists` });
    }

    const resolved = await prisma.permission.findMany({
      where: { slug: { in: permissions } },
      select: { id: true, slug: true },
    });

    if (resolved.length !== permissions.length) {
      const found = new Set(resolved.map(p => p.slug));
      return res.status(400).json({
        error: 'Unknown permission slugs',
        unknown: permissions.filter((slugValue: string) => !found.has(slugValue)),
      });
    }

    const role = await prisma.role.create({
      data: {
        slug,
        name: name.trim(),
        description: description?.trim() || null,
        isSystem: false,
        permissions: { create: resolved.map(permission => ({ permissionId: permission.id })) },
      },
      select: roleSelect,
    });

    res.status(201).json(serializeRole(role));
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

router.patch('/:id', requirePermission('roles.write'), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // System role slugs are referenced by the UserRole enum, so only the label may change.
    const updated = await prisma.role.update({
      where: { id: role.id },
      data: {
        name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
        description: description === undefined ? undefined : description?.trim() || null,
      },
      select: roleSelect,
    });

    res.json(serializeRole(updated));
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.put('/:id/permissions', requirePermission('roles.write'), async (req: Request, res: Response) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array of permission slugs' });
    }

    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.slug === 'ADMIN') {
      return res.status(400).json({ error: 'Administrator permissions cannot be reduced' });
    }

    const resolved = await prisma.permission.findMany({
      where: { slug: { in: permissions } },
      select: { id: true, slug: true },
    });

    if (resolved.length !== permissions.length) {
      const found = new Set(resolved.map(p => p.slug));
      return res.status(400).json({
        error: 'Unknown permission slugs',
        unknown: permissions.filter((slugValue: string) => !found.has(slugValue)),
      });
    }

    const updated = await prisma.$transaction(async tx => {
      await tx.rolePermission.deleteMany({ where: { roleId: role.id } });

      if (resolved.length > 0) {
        await tx.rolePermission.createMany({
          data: resolved.map(permission => ({ roleId: role.id, permissionId: permission.id })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUnique({ where: { id: role.id }, select: roleSelect });
    });

    invalidatePermissionCache(role.id);

    res.json(serializeRole(updated));
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

router.delete('/:id', requirePermission('roles.write'), async (req: Request, res: Response) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      select: { id: true, isSystem: true, _count: { select: { users: true } } },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(400).json({ error: 'System roles cannot be deleted' });
    }

    if (role._count.users > 0) {
      return res.status(409).json({
        error: 'Reassign the users on this role before deleting it',
        userCount: role._count.users,
      });
    }

    await prisma.role.delete({ where: { id: role.id } });
    invalidatePermissionCache(role.id);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

router.put('/assignments/:userId', requirePermission('users.write'), async (req: Request, res: Response) => {
  try {
    const { roleId } = req.body;

    if (!roleId || typeof roleId !== 'string') {
      return res.status(400).json({ error: 'roleId is required' });
    }

    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true, role: true } }),
      prisma.role.findUnique({ where: { id: roleId }, select: { id: true, slug: true } }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const requester = (req as any).user;
    if (requester.id === user.id && user.role === 'ADMIN' && role.slug !== 'ADMIN') {
      return res.status(400).json({ error: 'You cannot remove your own administrator role' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { roleId: role.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        roleId: true,
        roleDefinition: { select: { id: true, slug: true, name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

export default router;
