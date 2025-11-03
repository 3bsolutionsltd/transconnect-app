import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Create a ride share request
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { origin, destination, travelDate, passengers, maxCost, notes } = req.body;
    const userId = (req as any).user.userId;

    if (!origin || !destination || !travelDate || !passengers) {
      return res.status(400).json({ 
        error: 'Origin, destination, travel date, and number of passengers are required' 
      });
    }

    // Create ride request (using bookings table with special identifier)
    const ride = await prisma.booking.create({
      data: {
        userId,
        routeId: 'ride-share', // Special identifier for ride shares
        seatNumber: `RS-${passengers}`, // RS = Ride Share
        travelDate: new Date(travelDate),
        totalAmount: maxCost || 0,
        status: 'PENDING', // Use existing enum value
        qrCode: `ride-${Date.now()}` // Placeholder QR code
      }
    });

    res.status(201).json({
      id: ride.id,
      origin,
      destination,
      travelDate: ride.travelDate,
      passengers,
      maxCost: ride.totalAmount,
      status: 'PENDING',
      createdAt: ride.createdAt
    });
  } catch (error) {
    console.error('Error creating ride request:', error);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
});

// Get ride requests for matching
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({ 
        error: 'Origin, destination, and date are required' 
      });
    }

    // For MVP, return mock ride matches
    const mockRides = [
      {
        id: 'ride-1',
        driverName: 'Sarah K.',
        rating: 4.8,
        vehicle: 'Toyota Prado',
        departureTime: '08:00',
        availableSeats: 3,
        pricePerSeat: 25000,
        pickupPoint: 'Clock Tower',
        contact: '+256 7XX XXX XXX'
      },
      {
        id: 'ride-2',
        driverName: 'James M.',
        rating: 4.6,
        vehicle: 'Honda CRV',
        departureTime: '14:30',
        availableSeats: 2,
        pricePerSeat: 30000,
        pickupPoint: 'Garden City',
        contact: '+256 7XX XXX XXX'
      }
    ];

    res.json({
      rides: mockRides,
      origin,
      destination,
      date
    });
  } catch (error) {
    console.error('Error searching rides:', error);
    res.status(500).json({ error: 'Failed to search rides' });
  }
});

// Get user's ride requests
router.get('/my-requests', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const rideRequests = await prisma.booking.findMany({
      where: {
        userId,
        routeId: 'ride-share', // Filter by ride share requests
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedRequests = rideRequests.map(request => ({
      id: request.id,
      passengers: parseInt(request.seatNumber.replace('RS-', '')),
      travelDate: request.travelDate,
      maxCost: request.totalAmount,
      status: 'PENDING',
      createdAt: request.createdAt
    }));

    res.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    res.status(500).json({ error: 'Failed to fetch ride requests' });
  }
});

// Book a ride share
router.post('/book/:rideId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { rideId } = req.params;
    const { passengers, pickupPoint, contactInfo } = req.body;
    const userId = (req as any).user.userId;

    if (!passengers || !pickupPoint) {
      return res.status(400).json({ 
        error: 'Number of passengers and pickup point are required' 
      });
    }

    // For MVP, create a booking record for the ride share
    const rideBooking = await prisma.booking.create({
      data: {
        userId,
        routeId: `ride-${rideId}`,
        seatNumber: `RIDE-${passengers}`,
        travelDate: new Date(),
        totalAmount: passengers * 25000, // Mock price calculation
        status: 'CONFIRMED', // Use existing enum value
        qrCode: `ride-booking-${Date.now()}` // Placeholder QR code
      }
    });

    res.status(201).json({
      bookingId: rideBooking.id,
      rideId,
      passengers,
      pickupPoint,
      totalCost: rideBooking.totalAmount,
      status: 'CONFIRMED',
      message: 'Ride booked successfully! Driver will contact you shortly.'
    });
  } catch (error) {
    console.error('Error booking ride:', error);
    res.status(500).json({ error: 'Failed to book ride' });
  }
});

export default router;