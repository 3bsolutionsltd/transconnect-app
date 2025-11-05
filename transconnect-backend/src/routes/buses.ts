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

    console.log('Creating bus with data:', { operatorId, plateNumber, model, capacity, amenities }); // Debug log
    console.log('Amenities type:', typeof amenities, 'value:', amenities); // Debug amenities specifically

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

    // Check if plate number already exists
    const existingBus = await prisma.bus.findUnique({
      where: { plateNumber }
    });

    if (existingBus) {
      return res.status(400).json({ error: 'Bus with this plate number already exists' });
    }

    // Ensure amenities is a string or null, not array
    const amenitiesString = amenities ? 
      (typeof amenities === 'string' ? amenities : JSON.stringify(amenities)) : 
      null;

    console.log('Final amenities for DB:', amenitiesString); // Debug final value

    const bus = await prisma.bus.create({
      data: {
        operatorId,
        plateNumber,
        model,
        capacity: parseInt(capacity.toString()), // Ensure integer
        amenities: amenitiesString // Explicitly ensure string or null
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
    res.status(500).json({ error: 'Failed to create bus', details: error.message });
  }
});

export default router;