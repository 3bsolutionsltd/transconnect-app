import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { validateAndNormalizeContact } from '../utils/contact-validation';

const router = Router();

const PLATFORM_MANAGED_ROLES = ['ADMIN', 'OPERATOR', 'PASSENGER', 'MASTER_FIELD_OPERATOR', 'OPERATOR_FIELD_OPERATOR'];

const getEffectiveRoles = (user: {
  role: string;
  operatorUser: { active: boolean } | null;
  fieldOperatorScopes: Array<{ id: string }>;
}) => {
  const roles = new Set<string>([user.role]);

  if (user.operatorUser?.active) {
    roles.add('OPERATOR');
  }

  if (user.fieldOperatorScopes.length > 0) {
    roles.add('OPERATOR_FIELD_OPERATOR');
  }

  return Array.from(roles);
};

const ensureAdmin = (req: Request, res: Response) => {
  const requestUser = (req as any).user;
  if (requestUser.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    return false;
  }

  return true;
};

// Create user (Admin only)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    if (requestUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      verified = true,
      operatorScopeIds = [],
    } = req.body;

    if (!email || !firstName || !lastName || !phone || !role) {
      return res.status(400).json({ error: 'email, firstName, lastName, phone, and role are required' });
    }

    const contactValidation = validateAndNormalizeContact({ email, phone, defaultCountry: 'UG' });
    if (!contactValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid contact information',
        details: contactValidation.errors,
      });
    }

    const normalizedEmail = contactValidation.normalizedEmail!;
    const normalizedPhone = contactValidation.normalizedPhone!;

    if (!PLATFORM_MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    if (role === 'MASTER_FIELD_OPERATOR' && operatorScopeIds.length > 0) {
      return res.status(400).json({ error: 'Master field operators should not have operator scopes' });
    }

    if (role === 'OPERATOR_FIELD_OPERATOR' && (!Array.isArray(operatorScopeIds) || operatorScopeIds.length === 0)) {
      return res.status(400).json({ error: 'Operator field operators require at least one operator scope' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      },
    });

    if (!existingUser && !password) {
      return res.status(400).json({ error: 'Password is required when creating a brand new user' });
    }

    const createdUser = await prisma.$transaction(async tx => {
      let user;

      if (existingUser) {
        const nextPrimaryRole = role === 'ADMIN'
          ? 'ADMIN'
          : role === 'MASTER_FIELD_OPERATOR'
            ? 'MASTER_FIELD_OPERATOR'
            : existingUser.role;

        user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            email: normalizedEmail,
            firstName,
            lastName,
            phone: normalizedPhone,
            role: nextPrimaryRole,
            verified,
          },
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            firstName,
            lastName,
            phone: normalizedPhone,
            role,
            verified,
          },
        });
      }

      if (role === 'OPERATOR_FIELD_OPERATOR') {
        const operators = await tx.operator.findMany({
          where: { id: { in: operatorScopeIds } },
          select: { id: true },
        });

        if (operators.length !== operatorScopeIds.length) {
          throw new Error('One or more operator scopes are invalid');
        }

        await tx.fieldOperatorScope.createMany({
          data: operatorScopeIds.map((operatorId: string) => ({
            userId: user.id,
            operatorId,
            active: true,
          })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          verified: true,
          createdAt: true,
          fieldOperatorScopes: {
            where: { active: true },
            select: {
              operatorId: true,
              operator: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
        },
      });
    });

    res.status(201).json(createdUser);
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// Get all users (Admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        fieldOperatorScopes: {
          where: { active: true },
          select: {
            operatorId: true,
            operator: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to include bookings count
    const transformedUsers = users.map(user => ({
      ...user,
      bookingsCount: user._count.bookings
    }));

    res.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get roles for a user (Admin only)
router.get('/:id/roles', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        operatorUser: {
          select: {
            id: true,
            active: true,
            operatorId: true,
            role: true,
          },
        },
        fieldOperatorScopes: {
          where: { active: true },
          select: {
            id: true,
            operatorId: true,
            operator: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      userId: user.id,
      email: user.email,
      primaryRole: user.role,
      effectiveRoles: getEffectiveRoles(user),
      operatorAssignment: user.operatorUser,
      fieldOperatorScopes: user.fieldOperatorScopes,
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

// Assign/add role for a user (Admin only)
router.post('/:id/roles/assign', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { id } = req.params;
    const { role, operatorId, operatorRole = 'TICKETER', operatorScopeIds = [] } = req.body;

    if (!role || !PLATFORM_MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    const updatedUser = await prisma.$transaction(async tx => {
      const existingUser = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true },
      });

      if (!existingUser) {
        throw new Error('USER_NOT_FOUND');
      }

      let nextPrimaryRole = existingUser.role;
      if (role === 'ADMIN' || role === 'MASTER_FIELD_OPERATOR') {
        nextPrimaryRole = role;
      }

      if (nextPrimaryRole !== existingUser.role) {
        await tx.user.update({
          where: { id },
          data: { role: nextPrimaryRole as any },
        });
      }

      if (role === 'OPERATOR') {
        if (!operatorId) {
          throw new Error('OPERATOR_ID_REQUIRED');
        }

        const operator = await tx.operator.findUnique({
          where: { id: operatorId },
          select: { id: true, approved: true },
        });

        if (!operator || !operator.approved) {
          throw new Error('INVALID_OPERATOR');
        }

        await tx.operatorUser.upsert({
          where: { userId: id },
          update: {
            operatorId,
            role: operatorRole,
            active: true,
          },
          create: {
            userId: id,
            operatorId,
            role: operatorRole,
            active: true,
          },
        });
      }

      if (role === 'OPERATOR_FIELD_OPERATOR') {
        if (!Array.isArray(operatorScopeIds) || operatorScopeIds.length === 0) {
          throw new Error('SCOPES_REQUIRED');
        }

        const operators = await tx.operator.findMany({
          where: { id: { in: operatorScopeIds } },
          select: { id: true },
        });

        if (operators.length !== operatorScopeIds.length) {
          throw new Error('INVALID_SCOPES');
        }

        await tx.fieldOperatorScope.createMany({
          data: operatorScopeIds.map((scopeOperatorId: string) => ({
            userId: id,
            operatorId: scopeOperatorId,
            active: true,
          })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          operatorUser: {
            select: {
              id: true,
              active: true,
              operatorId: true,
              role: true,
            },
          },
          fieldOperatorScopes: {
            where: { active: true },
            select: {
              id: true,
              operatorId: true,
            },
          },
        },
      });
    });

    return res.json({
      message: 'Role assigned successfully',
      userId: updatedUser?.id,
      primaryRole: updatedUser?.role,
      effectiveRoles: updatedUser ? getEffectiveRoles(updatedUser) : [],
    });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (error.message === 'OPERATOR_ID_REQUIRED') {
      return res.status(400).json({ error: 'operatorId is required when assigning OPERATOR role' });
    }

    if (error.message === 'INVALID_OPERATOR') {
      return res.status(400).json({ error: 'Operator must exist and be approved' });
    }

    if (error.message === 'SCOPES_REQUIRED') {
      return res.status(400).json({ error: 'operatorScopeIds is required when assigning OPERATOR_FIELD_OPERATOR role' });
    }

    if (error.message === 'INVALID_SCOPES') {
      return res.status(400).json({ error: 'One or more operator scopes are invalid' });
    }

    console.error('Error assigning user role:', error);
    return res.status(500).json({ error: 'Failed to assign role' });
  }
});

// Remove role from a user (Admin only)
router.post('/:id/roles/remove', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !PLATFORM_MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    const updatedUser = await prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (role === 'OPERATOR') {
        await tx.operatorUser.deleteMany({ where: { userId: id } });
        if (user.role === 'OPERATOR') {
          await tx.user.update({ where: { id }, data: { role: 'PASSENGER' } });
        }
      }

      if (role === 'OPERATOR_FIELD_OPERATOR') {
        await tx.fieldOperatorScope.deleteMany({ where: { userId: id } });
        if (user.role === 'OPERATOR_FIELD_OPERATOR') {
          await tx.user.update({ where: { id }, data: { role: 'PASSENGER' } });
        }
      }

      if (role === 'MASTER_FIELD_OPERATOR' && user.role === 'MASTER_FIELD_OPERATOR') {
        await tx.user.update({ where: { id }, data: { role: 'PASSENGER' } });
      }

      if (role === 'ADMIN' && user.role === 'ADMIN') {
        const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          throw new Error('LAST_ADMIN');
        }
        await tx.user.update({ where: { id }, data: { role: 'PASSENGER' } });
      }

      return tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          operatorUser: {
            select: {
              id: true,
              active: true,
            },
          },
          fieldOperatorScopes: {
            where: { active: true },
            select: { id: true },
          },
        },
      });
    });

    return res.json({
      message: 'Role removed successfully',
      userId: updatedUser?.id,
      primaryRole: updatedUser?.role,
      effectiveRoles: updatedUser ? getEffectiveRoles(updatedUser) : [],
    });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (error.message === 'LAST_ADMIN') {
      return res.status(400).json({ error: 'Cannot remove ADMIN role from the last admin user' });
    }

    console.error('Error removing user role:', error);
    return res.status(500).json({ error: 'Failed to remove role' });
  }
});

// Switch primary role for a user (Admin only)
router.put('/:id/roles/primary', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !PLATFORM_MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        operatorUser: {
          select: {
            id: true,
            active: true,
          },
        },
        fieldOperatorScopes: {
          where: { active: true },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role === 'OPERATOR' && !user.operatorUser?.active) {
      return res.status(400).json({ error: 'User does not have an active OPERATOR assignment' });
    }

    if (role === 'OPERATOR_FIELD_OPERATOR' && user.fieldOperatorScopes.length === 0) {
      return res.status(400).json({ error: 'User does not have any OPERATOR_FIELD_OPERATOR scopes' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
      },
      select: {
        id: true,
        role: true,
        operatorUser: {
          select: {
            id: true,
            active: true,
          },
        },
        fieldOperatorScopes: {
          where: { active: true },
          select: { id: true },
        },
      },
    });

    return res.json({
      message: 'Primary role updated successfully',
      userId: updatedUser.id,
      primaryRole: updatedUser.role,
      effectiveRoles: getEffectiveRoles(updatedUser),
    });
  } catch (error) {
    console.error('Error switching primary role:', error);
    return res.status(500).json({ error: 'Failed to switch primary role' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;

    const userData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        fieldOperatorScopes: {
          where: { active: true },
          select: {
            operatorId: true,
            operator: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            route: {
              select: {
                origin: true,
                destination: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;
    const { firstName, lastName, phone, role, verified, operatorScopeIds } = req.body;

    if (role && !PLATFORM_MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const emailInRequest = typeof req.body.email === 'string' ? req.body.email : undefined;
    const phoneInRequest = typeof phone === 'string' ? phone : undefined;

    let normalizedEmail = emailInRequest;
    let normalizedPhone = phoneInRequest;
    if (emailInRequest !== undefined || phoneInRequest !== undefined) {
      const contactValidation = validateAndNormalizeContact({
        email: emailInRequest,
        phone: phoneInRequest,
        defaultCountry: 'UG',
      });

      if (!contactValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid contact information',
          details: contactValidation.errors,
        });
      }

      normalizedEmail = contactValidation.normalizedEmail ?? emailInRequest;
      normalizedPhone = contactValidation.normalizedPhone ?? phoneInRequest;
    }

    if (normalizedEmail || normalizedPhone) {
      const conflictingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
              ],
            },
          ],
        },
      });

      if (conflictingUser) {
        return res.status(400).json({ error: 'A user with this email or phone number already exists' });
      }
    }

    const updatedUser = await prisma.$transaction(async tx => {
      const user = await tx.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          ...(normalizedEmail && { email: normalizedEmail }),
          ...(normalizedPhone && { phone: normalizedPhone }),
          role,
          verified
        },
      });

      if (role === 'MASTER_FIELD_OPERATOR') {
        await tx.fieldOperatorScope.deleteMany({ where: { userId: id } });
      }

      if (role === 'OPERATOR_FIELD_OPERATOR' && Array.isArray(operatorScopeIds)) {
        await tx.fieldOperatorScope.deleteMany({ where: { userId: id } });
        if (operatorScopeIds.length > 0) {
          await tx.fieldOperatorScope.createMany({
            data: operatorScopeIds.map((operatorId: string) => ({
              userId: id,
              operatorId,
              active: true,
            })),
          });
        }
      }

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
          fieldOperatorScopes: {
            where: { active: true },
            select: {
              operatorId: true,
              operator: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
            },
          },
        },
      });
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Replace field operator scopes (Admin only)
router.put('/:id/field-operator-scopes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    if (requestUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;
    const { operatorScopeIds = [] } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'OPERATOR_FIELD_OPERATOR') {
      return res.status(400).json({ error: 'Only OPERATOR_FIELD_OPERATOR users can have scoped operators' });
    }

    if (!Array.isArray(operatorScopeIds) || operatorScopeIds.length === 0) {
      return res.status(400).json({ error: 'At least one operator scope is required' });
    }

    const operators = await prisma.operator.findMany({
      where: { id: { in: operatorScopeIds } },
      select: { id: true },
    });

    if (operators.length !== operatorScopeIds.length) {
      return res.status(400).json({ error: 'One or more operator scopes are invalid' });
    }

    await prisma.$transaction(async tx => {
      await tx.fieldOperatorScope.deleteMany({ where: { userId: id } });
      await tx.fieldOperatorScope.createMany({
        data: operatorScopeIds.map((operatorId: string) => ({
          userId: id,
          operatorId,
          active: true,
        })),
      });
    });

    const scopes = await prisma.fieldOperatorScope.findMany({
      where: { userId: id, active: true },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    res.json({ scopes });
  } catch (error: any) {
    console.error('Error updating field operator scopes:', error);
    res.status(500).json({ error: error.message || 'Failed to update field operator scopes' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting other admins
    if (existingUser.role === 'ADMIN' && existingUser.id !== user.id) {
      return res.status(403).json({ error: 'Cannot delete other admin users' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;