import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all buses (filtered by role)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;

    let whereClause = {};
    
    // If operator, only show their own buses
    if (userRole === 'OPERATOR') {
      // Use the operator permissions middleware inline for this check
      const userId = (req as any).user.id;
      const operatorUser = await prisma.operatorUser.findUnique({
        where: { userId }
      });

      if (!operatorUser) {
        return res.status(404).json({ error: 'Operator user profile not found' });
      }

      whereClause = { operatorId: operatorUser.operatorId };
    }
    // Admins and passengers can see all buses
    
    const buses = await prisma.bus.findMany({
      where: whereClause,
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

// Create bus (Operator only - auto-assigns to logged-in operator)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { plateNumber, model, capacity, amenities } = req.body;

    console.log('Creating bus with data:', { plateNumber, model, capacity, amenities }); // Debug log
    console.log('Amenities type:', typeof amenities, 'value:', amenities); // Debug amenities specifically

    // Only operators can create buses
    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can create buses' });
    }

    if (!plateNumber || !model || !capacity) {
      return res.status(400).json({ 
        error: 'Plate number, model, and capacity are required' 
      });
    }

    // Find operator ID for this user (either direct operator or operator user)
    let operatorId: string | null = null;

    // First check if user is a direct operator
    const directOperator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (directOperator) {
      operatorId = directOperator.id;
    } else {
      // Check if user is an operator user
      const operatorUser = await prisma.operatorUser.findUnique({
        where: { userId }
      });
      
      if (operatorUser) {
        operatorId = operatorUser.operatorId;
      }
    }

    if (!operatorId) {
      return res.status(404).json({ error: 'No operator association found for this user' });
    }

    // Verify operator exists and is approved
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    if (!operator.approved) {
      return res.status(403).json({ error: 'Operator account not approved yet' });
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
        operatorId, // Use the operator ID from operatorUser
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
  } catch (error: any) {
    console.error('Error creating bus:', error);
    res.status(500).json({ error: 'Failed to create bus', details: error.message });
  }
});

// Get bus by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bus = await prisma.bus.findUnique({
      where: { id },
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
      }
    });

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json(bus);
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({ error: 'Failed to fetch bus' });
  }
});

// Update bus (Operator only - can only update own buses)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { id } = req.params;
    const { plateNumber, model, capacity, amenities } = req.body;

    // Only operators and admins can update buses
    if (userRole !== 'OPERATOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only operators and administrators can update buses' });
    }

    // Get the existing bus
    const existingBus = await prisma.bus.findUnique({
      where: { id },
      include: {
        operator: true
      }
    });

    if (!existingBus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // If user is an operator, verify they own this bus
    if (userRole === 'OPERATOR') {
      const operator = await prisma.operator.findUnique({
        where: { userId }
      });

      if (!operator || existingBus.operatorId !== operator.id) {
        return res.status(403).json({ error: 'Not authorized to update this bus' });
      }
    }

    // Check if new plate number conflicts (if being changed)
    if (plateNumber && plateNumber !== existingBus.plateNumber) {
      const conflictingBus = await prisma.bus.findUnique({
        where: { plateNumber }
      });

      if (conflictingBus) {
        return res.status(400).json({ error: 'Bus with this plate number already exists' });
      }
    }

    // Ensure amenities is a string or null, not array
    const amenitiesString = amenities ? 
      (typeof amenities === 'string' ? amenities : JSON.stringify(amenities)) : 
      null;

    const bus = await prisma.bus.update({
      where: { id },
      data: {
        ...(plateNumber && { plateNumber }),
        ...(model && { model }),
        ...(capacity && { capacity: parseInt(capacity.toString()) }),
        ...(amenities !== undefined && { amenities: amenitiesString })
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

    res.json(bus);
  } catch (error: any) {
    console.error('Error updating bus:', error);
    res.status(500).json({ error: 'Failed to update bus', details: error.message });
  }
});

// Delete bus (Operator only - can only delete own buses)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { id } = req.params;

    // Only operators and admins can delete buses
    if (userRole !== 'OPERATOR' && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only operators and administrators can delete buses' });
    }

    // Get the existing bus
    const existingBus = await prisma.bus.findUnique({
      where: { id },
      include: {
        operator: true,
        routes: {
          select: {
            id: true,
            active: true
          }
        }
      }
    });

    if (!existingBus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // If user is an operator, verify they own this bus
    if (userRole === 'OPERATOR') {
      const operator = await prisma.operator.findUnique({
        where: { userId }
      });

      if (!operator || existingBus.operatorId !== operator.id) {
        return res.status(403).json({ error: 'Not authorized to delete this bus' });
      }
    }

    // Check if bus has active routes
    const activeRoutes = existingBus.routes.filter(route => route.active);
    if (activeRoutes.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete bus. It has ${activeRoutes.length} active route(s). Please deactivate all routes first.` 
      });
    }

    await prisma.bus.delete({
      where: { id }
    });

    res.json({ message: 'Bus deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bus:', error);
    res.status(500).json({ error: 'Failed to delete bus', details: error.message });
  }
});

export default router;