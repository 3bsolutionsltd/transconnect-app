import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

const router = Router();

// Create operator user (Admin only)
router.post('/create', [
  authenticateToken,
  body('operatorId').notEmpty().withMessage('Operator ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['MANAGER', 'STAFF']).withMessage('Role must be MANAGER or STAFF')
], async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    // Only admins can create operator users
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can create operator users' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { operatorId, firstName, lastName, email, phone, password, role } = req.body;

    // Verify operator exists
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
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

    // Create the user first
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

    // Then create the operator user association
    const operatorUser = await prisma.operatorUser.create({
      data: {
        userId: user.id,
        operatorId: operatorId,
        role: role === 'MANAGER' ? 'MANAGER' : 'TICKETER', // Default to TICKETER if not specified
        active: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });    res.status(201).json({
      id: operatorUser.id,
      userId: operatorUser.userId,
      firstName: operatorUser.user.firstName,
      lastName: operatorUser.user.lastName,
      email: operatorUser.user.email,
      phone: operatorUser.user.phone,
      operatorRole: operatorUser.role,
      operatorId: operatorUser.operatorId,
      active: operatorUser.active,
      operator: {
        id: operator.id,
        companyName: operator.companyName
      },
      createdAt: operatorUser.createdAt
    });
  } catch (error) {
    console.error('Error creating operator user:', error);
    res.status(500).json({ error: 'Failed to create operator user' });
  }
});

// Get all operator users for a specific operator (Admin only)
router.get('/operator/:operatorId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const { operatorId } = req.params;
    
    // Only admins can view operator users
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can view operator users' });
    }

    // Get all operator users associated with this operator
    const operatorUsers = await prisma.operatorUser.findMany({
      where: {
        operatorId: operatorId
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get operator details
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: {
        id: true,
        companyName: true,
        approved: true
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    const formattedUsers = operatorUsers.map(opUser => ({
      id: opUser.id,
      userId: opUser.userId,
      firstName: opUser.user.firstName,
      lastName: opUser.user.lastName,
      email: opUser.user.email,
      phone: opUser.user.phone,
      verified: opUser.user.verified,
      operatorRole: opUser.role,
      active: opUser.active,
      createdAt: opUser.createdAt
    }));

    res.json({
      operator: operator,
      users: formattedUsers,
      totalUsers: formattedUsers.length
    });
  } catch (error) {
    console.error('Error fetching operator users:', error);
    res.status(500).json({ error: 'Failed to fetch operator users' });
  }
});

// Get all operator users across all operators (Admin only)
router.get('/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    // Only admins can view all operator users
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can view all operator users' });
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all operators to map names
    const operators = await prisma.operator.findMany({
      select: {
        id: true,
        companyName: true,
        approved: true
      }
    });

    const operatorMap = operators.reduce((acc, op) => {
      acc[op.id] = op;
      return acc;
    }, {} as Record<string, any>);

    const formattedUsers = operatorUsers.map(opUser => {
      const operator = operatorMap[opUser.operatorId];

      return {
        id: opUser.id,
        userId: opUser.userId,
        firstName: opUser.user.firstName,
        lastName: opUser.user.lastName,
        email: opUser.user.email,
        phone: opUser.user.phone,
        verified: opUser.user.verified,
        operatorRole: opUser.role,
        active: opUser.active,
        operator: operator ? {
          id: operator.id,
          companyName: operator.companyName,
          approved: operator.approved
        } : null,
        createdAt: opUser.createdAt
      };
    });

    res.json({
      users: formattedUsers,
      totalUsers: formattedUsers.length
    });
  } catch (error) {
    console.error('Error fetching all operator users:', error);
    res.status(500).json({ error: 'Failed to fetch operator users' });
  }
});

// Update operator user (Admin only)
router.put('/:userId', [
  authenticateToken,
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('operatorRole').optional().isIn(['MANAGER', 'STAFF']).withMessage('Role must be MANAGER or STAFF'),
  body('verified').optional().isBoolean().withMessage('Verified must be a boolean')
], async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const { userId } = req.params;
    
    // Only admins can update operator users
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update operator users' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, operatorRole, verified } = req.body;

    // Get existing operator user
    const existingOperatorUser = await prisma.operatorUser.findUnique({
      where: { userId },
      include: {
        user: true
      }
    });

    if (!existingOperatorUser) {
      return res.status(404).json({ error: 'Operator user not found' });
    }

    // Check for email/phone conflicts if being changed
    if (email || phone) {
      const conflictingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
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
    if (firstName || lastName || email || phone || verified !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(verified !== undefined && { verified })
        }
      });
    }

    // Update operator user role if provided
    const updatedOperatorUser = await prisma.operatorUser.update({
      where: { userId },
      data: {
        ...(operatorRole && { role: operatorRole as any })
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
            updatedAt: true
          }
        }
      }
    });

    res.json({
      id: updatedOperatorUser.id,
      userId: updatedOperatorUser.userId,
      firstName: updatedOperatorUser.user.firstName,
      lastName: updatedOperatorUser.user.lastName,
      email: updatedOperatorUser.user.email,
      phone: updatedOperatorUser.user.phone,
      verified: updatedOperatorUser.user.verified,
      operatorRole: updatedOperatorUser.role,
      active: updatedOperatorUser.active,
      updatedAt: updatedOperatorUser.user.updatedAt
    });
  } catch (error) {
    console.error('Error updating operator user:', error);
    res.status(500).json({ error: 'Failed to update operator user' });
  }
});

// Delete operator user (Admin only)
router.delete('/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    const { userId } = req.params;
    
    // Only admins can delete operator users
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can delete operator users' });
    }

    // Get existing operator user
    const existingOperatorUser = await prisma.operatorUser.findUnique({
      where: { userId }
    });

    if (!existingOperatorUser) {
      return res.status(404).json({ error: 'Operator user not found' });
    }

    // Delete operator user association first
    await prisma.operatorUser.delete({
      where: { userId }
    });

    // Then delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Operator user deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator user:', error);
    res.status(500).json({ error: 'Failed to delete operator user' });
  }
});

export default router;