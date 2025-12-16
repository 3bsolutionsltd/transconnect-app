/**
 * Admin Seed Routes Endpoint
 * POST /api/admin/seed-routes
 * Requires admin authentication
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, isAdmin } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

router.post('/seed-routes', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🌱 Admin route seeding initiated...');

    // 1. Setup operator
    const operatorPassword = await bcrypt.hash('operator123', 12);
    const operatorUser = await prisma.user.upsert({
      where: { email: 'operator@transconnect.ug' },
      update: {},
      create: {
        email: 'operator@transconnect.ug',
        password: operatorPassword,
        firstName: 'TransConnect',
        lastName: 'Operator',
        phone: '+256700111222',
        role: 'OPERATOR',
        verified: true
      }
    });

    const operator = await prisma.operator.upsert({
      where: { userId: operatorUser.id },
      update: { approved: true },
      create: {
        companyName: 'TransConnect Pilot Bus Company',
        license: 'TC-2025-001',
        approved: true,
        userId: operatorUser.id
      }
    });

    // 2. Create buses
    const buses = await Promise.all([
      prisma.bus.upsert({
        where: { plateNumber: 'UAZ-001T' },
        update: { active: true, operatorId: operator.id },
        create: {
          plateNumber: 'UAZ-001T',
          model: 'Toyota Coaster',
          capacity: 45,
          amenities: JSON.stringify(['AC', 'WiFi', 'USB Charging', 'Reclining Seats']),
          operatorId: operator.id,
          active: true
        }
      }),
      prisma.bus.upsert({
        where: { plateNumber: 'UAZ-002T' },
        update: { active: true, operatorId: operator.id },
        create: {
          plateNumber: 'UAZ-002T',
          model: 'Isuzu NPR',
          capacity: 50,
          amenities: JSON.stringify(['AC', 'Entertainment System', 'USB Charging']),
          operatorId: operator.id,
          active: true
        }
      }),
      prisma.bus.upsert({
        where: { plateNumber: 'UAZ-003T' },
        update: { active: true, operatorId: operator.id },
        create: {
          plateNumber: 'UAZ-003T',
          model: 'Mercedes Benz Sprinter',
          capacity: 30,
          amenities: JSON.stringify(['AC', 'WiFi', 'Premium Seats', 'USB Charging']),
          operatorId: operator.id,
          active: true
        }
      })
    ]);

    // 3. Create routes
    const routesData = [
      { id: 'kampala-jinja-0800', origin: 'Kampala', destination: 'Jinja', via: 'Mukono, Lugazi', distance: 85.0, duration: 150, price: 15000, departureTime: '08:00', busId: buses[0].id, operatorId: operator.id },
      { id: 'kampala-jinja-1400', origin: 'Kampala', destination: 'Jinja', via: 'Mukono, Lugazi', distance: 85.0, duration: 150, price: 15000, departureTime: '14:00', busId: buses[1].id, operatorId: operator.id },
      { id: 'jinja-kampala-0700', origin: 'Jinja', destination: 'Kampala', via: 'Lugazi, Mukono', distance: 85.0, duration: 165, price: 15000, departureTime: '07:00', busId: buses[0].id, operatorId: operator.id },
      { id: 'jinja-kampala-1700', origin: 'Jinja', destination: 'Kampala', via: 'Lugazi, Mukono', distance: 85.0, duration: 165, price: 15000, departureTime: '17:00', busId: buses[1].id, operatorId: operator.id },
      { id: 'kampala-mbarara-0900', origin: 'Kampala', destination: 'Mbarara', via: 'Masaka, Lyantonde', distance: 266.0, duration: 255, price: 25000, departureTime: '09:00', busId: buses[1].id, operatorId: operator.id },
      { id: 'kampala-mbarara-1500', origin: 'Kampala', destination: 'Mbarara', via: 'Masaka, Lyantonde', distance: 266.0, duration: 255, price: 25000, departureTime: '15:00', busId: buses[0].id, operatorId: operator.id },
      { id: 'mbarara-kampala-0700', origin: 'Mbarara', destination: 'Kampala', via: 'Lyantonde, Masaka', distance: 266.0, duration: 270, price: 25000, departureTime: '07:00', busId: buses[1].id, operatorId: operator.id },
      { id: 'entebbe-kampala-0730', origin: 'Entebbe', destination: 'Kampala', via: 'Expressway', distance: 41.0, duration: 60, price: 10000, departureTime: '07:30', busId: buses[2].id, operatorId: operator.id },
      { id: 'entebbe-kampala-1200', origin: 'Entebbe', destination: 'Kampala', via: 'Expressway', distance: 41.0, duration: 60, price: 10000, departureTime: '12:00', busId: buses[2].id, operatorId: operator.id },
      { id: 'entebbe-kampala-1800', origin: 'Entebbe', destination: 'Kampala', via: 'Expressway', distance: 41.0, duration: 60, price: 10000, departureTime: '18:00', busId: buses[2].id, operatorId: operator.id },
      { id: 'kampala-entebbe-0630', origin: 'Kampala', destination: 'Entebbe', via: 'Expressway', distance: 41.0, duration: 60, price: 10000, departureTime: '06:30', busId: buses[2].id, operatorId: operator.id },
      { id: 'kampala-entebbe-1100', origin: 'Kampala', destination: 'Entebbe', via: 'Expressway', distance: 41.0, duration: 60, price: 10000, departureTime: '11:00', busId: buses[2].id, operatorId: operator.id },
      { id: 'kampala-entebbe-1700', origin: 'Kampala', destination: 'Entebbe', via: 'Expressway', distance: 41.0, duration: 60, price: 10000, departureTime: '17:00', busId: buses[2].id, operatorId: operator.id },
      { id: 'kampala-gulu-0800', origin: 'Kampala', destination: 'Gulu', via: 'Luweero, Karuma', distance: 333.0, duration: 330, price: 35000, departureTime: '08:00', busId: buses[1].id, operatorId: operator.id },
      { id: 'gulu-kampala-0700', origin: 'Gulu', destination: 'Kampala', via: 'Karuma, Luweero', distance: 333.0, duration: 330, price: 35000, departureTime: '07:00', busId: buses[1].id, operatorId: operator.id },
      { id: 'kampala-fortportal-0900', origin: 'Kampala', destination: 'Fort Portal', via: 'Mityana, Mubende', distance: 300.0, duration: 300, price: 30000, departureTime: '09:00', busId: buses[0].id, operatorId: operator.id },
      { id: 'fortportal-kampala-0730', origin: 'Fort Portal', destination: 'Kampala', via: 'Mubende, Mityana', distance: 300.0, duration: 300, price: 30000, departureTime: '07:30', busId: buses[0].id, operatorId: operator.id }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const routeData of routesData) {
      const existing = await prisma.route.findUnique({ where: { id: routeData.id } });
      
      if (existing) {
        await prisma.route.update({
          where: { id: routeData.id },
          data: { ...routeData, active: true }
        });
        updatedCount++;
      } else {
        await prisma.route.create({
          data: { ...routeData, active: true }
        });
        createdCount++;
      }
    }

    const totalRoutes = await prisma.route.count();

    res.json({
      success: true,
      message: 'Routes seeded successfully',
      data: {
        operator: {
          email: operatorUser.email,
          company: operator.companyName
        },
        buses: buses.length,
        routes: {
          created: createdCount,
          updated: updatedCount,
          total: totalRoutes
        }
      }
    });

  } catch (error) {
    console.error('❌ Error seeding routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed routes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get seeding status
router.get('/seed-status', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const [totalRoutes, activeRoutes, totalBuses, operators] = await Promise.all([
      prisma.route.count(),
      prisma.route.count({ where: { active: true } }),
      prisma.bus.count(),
      prisma.operator.count({ where: { approved: true } })
    ]);

    res.json({
      success: true,
      data: {
        routes: { total: totalRoutes, active: activeRoutes },
        buses: totalBuses,
        operators: operators,
        seeded: totalRoutes > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get seed status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
