import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all operators
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

    res.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
});

// Create operator
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { companyName, license, contactPerson, email, phone, password } = req.body;

    if (!companyName || !license || !contactPerson || !email || !phone) {
      return res.status(400).json({ 
        error: 'Company name, license, contact person, email, and phone are required' 
      });
    }

    // First create the user
    const user = await prisma.user.create({
      data: {
        firstName: contactPerson.split(' ')[0] || contactPerson,
        lastName: contactPerson.split(' ').slice(1).join(' ') || '',
        email,
        phone,
        password: password || 'defaultpass123', // Should be hashed in production
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
        approved: true // Auto-approve for MVP
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

export default router;