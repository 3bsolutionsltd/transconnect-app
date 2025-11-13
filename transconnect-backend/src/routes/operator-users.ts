import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

const router = Router();

// Get all operator users (Admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can view operator users' });
    }

    const operatorUsers = await prisma.operatorUser.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            verified: true,
            createdAt: true
          }
        },
        operator: {
          select: {
            id: true,
            companyName: true,
            license: true,
            approved: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      operatorUsers: operatorUsers.map(ou => ({
        id: ou.id,
        role: ou.role,
        permissions: ou.permissions,
        active: ou.active,
        user: ou.user,
        operator: ou.operator,
        createdAt: ou.createdAt,
        updatedAt: ou.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching operator users:', error);
    res.status(500).json({ error: 'Failed to fetch operator users' });
  }
});

// Get operator users by operator ID (Admin only)
router.get('/operator/:operatorId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const { operatorId } = req.params;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can view operator users' });
    }

    const operatorUsers = await prisma.operatorUser.findMany({
      where: { operatorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            verified: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      operatorUsers: operatorUsers.map(ou => ({
        id: ou.id,
        role: ou.role,
        permissions: ou.permissions,
        active: ou.active,
        user: ou.user,
        createdAt: ou.createdAt,
        updatedAt: ou.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching operator users by operator:', error);
    res.status(500).json({ error: 'Failed to fetch operator users' });
  }
});

// Create operator user (Admin only)
router.post('/', [
  authenticateToken,
  body('operatorId').notEmpty().withMessage('Operator ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['MANAGER', 'DRIVER', 'CONDUCTOR', 'TICKETER', 'MAINTENANCE']).withMessage('Valid operator role is required'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can create operator users' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { operatorId, firstName, lastName, email, phone, password, role, permissions = [] } = req.body;

    // Verify operator exists and is approved
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    if (!operator.approved) {
      return res.status(400).json({ error: 'Cannot create users for unapproved operators' });
    }

    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'A user with this email or phone number already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user first
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: 'OPERATOR',
        verified: true
      }
    });

    // Create operator user relationship
    const operatorUser = await prisma.operatorUser.create({
      data: {
        userId: user.id,
        operatorId,
        role,
        permissions,
        active: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            verified: true,
            createdAt: true
          }
        },
        operator: {
          select: {
            id: true,
            companyName: true,
            license: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Operator user created successfully',
      operatorUser: {
        id: operatorUser.id,
        role: operatorUser.role,
        permissions: operatorUser.permissions,
        active: operatorUser.active,
        user: operatorUser.user,
        operator: operatorUser.operator,
        createdAt: operatorUser.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating operator user:', error);
    res.status(500).json({ error: 'Failed to create operator user' });
  }
});

// Update operator user (Admin only)
router.put('/:id', [
  authenticateToken,
  body('role').optional().isIn(['MANAGER', 'DRIVER', 'CONDUCTOR', 'TICKETER', 'MAINTENANCE']).withMessage('Valid operator role is required'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  body('active').optional().isBoolean().withMessage('Active status must be boolean'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const { id } = req.params;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update operator users' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, permissions, active, firstName, lastName, email, phone } = req.body;

    // Get existing operator user
    const existingOperatorUser = await prisma.operatorUser.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingOperatorUser) {
      return res.status(404).json({ error: 'Operator user not found' });
    }

    // Check for email/phone conflicts if updating those fields
    if (email || phone) {
      const conflictingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: existingOperatorUser.userId } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
              ]
            }
          ]
        }
      });

      if (conflictingUser) {
        return res.status(400).json({ 
          error: 'A user with this email or phone number already exists' 
        });
      }
    }

    // Update user information if provided
    if (firstName || lastName || email || phone) {
      await prisma.user.update({
        where: { id: existingOperatorUser.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(phone && { phone })
        }
      });
    }

    // Update operator user information
    const updatedOperatorUser = await prisma.operatorUser.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(permissions !== undefined && { permissions }),
        ...(active !== undefined && { active })
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            verified: true,
            createdAt: true
          }
        },
        operator: {
          select: {
            id: true,
            companyName: true,
            license: true
          }
        }
      }
    });

    res.json({
      message: 'Operator user updated successfully',
      operatorUser: {
        id: updatedOperatorUser.id,
        role: updatedOperatorUser.role,
        permissions: updatedOperatorUser.permissions,
        active: updatedOperatorUser.active,
        user: updatedOperatorUser.user,
        operator: updatedOperatorUser.operator,
        updatedAt: updatedOperatorUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating operator user:', error);
    res.status(500).json({ error: 'Failed to update operator user' });
  }
});

// Delete operator user (Admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const { id } = req.params;
    
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can delete operator users' });
    }

    // Get the operator user with user info
    const operatorUser = await prisma.operatorUser.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!operatorUser) {
      return res.status(404).json({ error: 'Operator user not found' });
    }

    // Delete operator user relationship first
    await prisma.operatorUser.delete({
      where: { id }
    });

    // Delete the associated user account
    await prisma.user.delete({
      where: { id: operatorUser.userId }
    });

    res.json({ message: 'Operator user deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator user:', error);
    res.status(500).json({ error: 'Failed to delete operator user' });
  }
});

// Get current operator user's profile and permissions
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operator users can access this endpoint' });
    }

    const operatorUser = await prisma.operatorUser.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            verified: true
          }
        },
        operator: {
          select: {
            id: true,
            companyName: true,
            license: true,
            approved: true
          }
        }
      }
    });

    if (!operatorUser) {
      return res.status(404).json({ error: 'Operator user profile not found' });
    }

    if (!operatorUser.active) {
      return res.status(403).json({ error: 'Your operator account has been deactivated' });
    }

    res.json({
      profile: {
        id: operatorUser.id,
        role: operatorUser.role,
        permissions: operatorUser.permissions,
        active: operatorUser.active,
        user: operatorUser.user,
        operator: operatorUser.operator
      }
    });
  } catch (error) {
    console.error('Error fetching operator user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;