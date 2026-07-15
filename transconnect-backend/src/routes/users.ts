import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { validateAndNormalizeContact } from '../utils/contact-validation';

const router = Router();

const PLATFORM_MANAGED_ROLES = ['ADMIN', 'OPERATOR', 'PASSENGER', 'MASTER_FIELD_OPERATOR', 'OPERATOR_FIELD_OPERATOR'];

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

    if (!email || !password || !firstName || !lastName || !phone || !role) {
      return res.status(400).json({ error: 'email, password, firstName, lastName, phone, and role are required' });
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

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email or phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
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