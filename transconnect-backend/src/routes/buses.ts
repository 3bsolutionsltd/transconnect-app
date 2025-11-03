import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all buses
router.get('/', async (req: Request, res: Response) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        operator: {
          select: {
            id: true,
            companyName: true
          }
        },
        routes: {
          select: {
            id: true,
            origin: true,
            destination: true,
            active: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(buses);
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({ error: 'Failed to fetch buses' });
  }
});

// Create bus
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { operatorId, plateNumber, model, capacity, amenities } = req.body;

    if (!operatorId || !plateNumber || !model || !capacity) {
      return res.status(400).json({ 
        error: 'Operator ID, plate number, model, and capacity are required' 
      });
    }

    // Verify operator exists
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    const bus = await prisma.bus.create({
      data: {
        operatorId,
        plateNumber,
        model,
        capacity: parseInt(capacity),
        amenities: amenities || []
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    res.status(201).json(bus);
  } catch (error) {
    console.error('Error creating bus:', error);
    res.status(500).json({ error: 'Failed to create bus' });
  }
});

export default router;