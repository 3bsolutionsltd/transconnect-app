import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { validateAndNormalizeContact } from '../utils/contact-validation';

const router = Router();

const FIELD_OPERATOR_VIEW_ROLES = ['MASTER_FIELD_OPERATOR', 'ADMIN', 'MANAGER'];

// Master field operator view: all operators with company, contact, and status summary
router.get('/field-ops/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;

    if (!FIELD_OPERATOR_VIEW_ROLES.includes(userRole)) {
      return res.status(403).json({
        error: 'Only master field operators can view all operator information',
      });
    }

    const operators = await prisma.operator.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      count: operators.length,
      operators: operators.map((operator) => ({
        id: operator.id,
        companyName: operator.companyName,
        license: operator.license,
        contact: {
          name: `${operator.user.firstName} ${operator.user.lastName}`.trim(),
          email: operator.user.email,
          phone: operator.user.phone,
        },
        status: {
          approved: operator.approved,
          portalEnabled: operator.portalEnabled,
          managedByAgent: operator.managedByAgent,
        },
        createdAt: operator.createdAt,
        updatedAt: operator.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching field operator view of operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators for field operations' });
  }
});

// Get all operators (enhanced for agent integration)
router.get('/', async (req: Request, res: Response) => {
  try {
    const operators = await prisma.operator.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        managingAgent: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            referralCode: true,
            status: true
          }
        },
        buses: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true
          }
        },
        routes: {
          select: {
            id: true,
            origin: true,
            destination: true,
            price: true,
            active: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: operators.length,
      operators: operators
    });
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
});

// Create operator (Admin only)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    // Only admins can create operators
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can create operators' });
    }
    
    const { companyName, license, firstName, lastName, email, phone, password, approved } = req.body;

    console.log('Creating operator with data:', { companyName, license, firstName, lastName, email, phone, approved }); // Debug log

    if (!companyName || !license || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({ 
        error: 'Company name, license, first name, last name, email, and phone are required' 
      });
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

    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: normalizedPhone }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'A user with this email or phone number already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'defaultpass123', 10);

    // First create the user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
        role: 'OPERATOR',
        verified: true
      }
    });

    // Then create the operator linked to the user
    const operator = await prisma.operator.create({
      data: {
        companyName,
        license,
        userId: user.id,
        approved: approved || false
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
    });

    res.status(201).json(operator);
  } catch (error) {
    console.error('Error creating operator:', error);
    res.status(500).json({ error: 'Failed to create operator' });
  }
});

// Get operator by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const operator = await prisma.operator.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        buses: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true
          }
        },
        routes: {
          select: {
            id: true,
            origin: true,
            destination: true,
            price: true,
            active: true
          }
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json(operator);
  } catch (error) {
    console.error('Error fetching operator:', error);
    res.status(500).json({ error: 'Failed to fetch operator' });
  }
});

// Update operator (Admin only)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    // Only admins can update operators
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update operators' });
    }
    
    const { id } = req.params;
    const { companyName, license, firstName, lastName, email, phone, approved } = req.body;

    const emailInRequest = typeof email === 'string' ? email : undefined;
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

    // Get the existing operator with user info
    const existingOperator = await prisma.operator.findUnique({
      where: { id: id },
      include: { user: true }
    });

    if (!existingOperator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    // Check if email or phone conflicts with other users
    if (normalizedEmail || normalizedPhone) {
      const conflictingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: existingOperator.userId } },
            {
              OR: [
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
                ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
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
        where: { id: existingOperator.userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(normalizedEmail && { email: normalizedEmail }),
          ...(normalizedPhone && { phone: normalizedPhone })
        }
      });
    }

    // Update operator information
    const operator = await prisma.operator.update({
      where: { id: id },
      data: {
        ...(companyName && { companyName }),
        ...(license && { license }),
        ...(approved !== undefined && { approved })
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
    });

    res.json(operator);
  } catch (error) {
    console.error('Error updating operator:', error);
    res.status(500).json({ error: 'Failed to update operator' });
  }
});

// Delete operator (Admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    // Only admins can delete operators
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can delete operators' });
    }
    
    const { id } = req.params;

    // Get the operator with user info
    const operator = await prisma.operator.findUnique({
      where: { id: id },
      include: { user: true }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    // Delete operator first (due to foreign key constraint)
    await prisma.operator.delete({
      where: { id: id }
    });

    // Then delete the associated user
    await prisma.user.delete({
      where: { id: operator.userId }
    });

    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    res.status(500).json({ error: 'Failed to delete operator' });
  }
});

// Admin approve agent-registered operator
router.put('/:id/approve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    // Only admins can approve operators
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can approve operators' });
    }
    
    const { id } = req.params;

    const operator = await prisma.operator.update({
      where: { id: id },
      data: { approved: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        managingAgent: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      message: 'Operator approved successfully',
      operator: operator
    });
  } catch (error) {
    console.error('Error approving operator:', error);
    res.status(500).json({ error: 'Failed to approve operator' });
  }
});

// Admin reject agent-registered operator
router.put('/:id/reject', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    // Only admins can reject operators
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can reject operators' });
    }
    
    const { id } = req.params;
    const { reason } = req.body;

    const operator = await prisma.operator.update({
      where: { id: id },
      data: { 
        approved: false,
        // Could add rejection reason to schema in future
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
        },
        managingAgent: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    res.json({ 
      message: 'Operator rejected',
      operator: operator,
      reason: reason
    });
  } catch (error) {
    console.error('Error rejecting operator:', error);
    res.status(500).json({ error: 'Failed to reject operator' });
  }
});

export default router;