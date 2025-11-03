import request from 'supertest';
import express from 'express';
import bookingRoutes from '../../src/routes/bookings';

// Mock the Prisma import first
const mockPrisma = {
  booking: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  route: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../src/index', () => ({
  prisma: mockPrisma
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mocked-qr-code')
}));

// Mock jwt for auth middleware
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'PASSENGER'
  })
}));

// Test data
const createTestUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+256700000000',
  role: 'PASSENGER',
  verified: true
});

const createTestRoute = () => ({
  id: 'test-route-id',
  origin: 'Kampala',
  destination: 'Entebbe',
  departureTime: '08:00',
  arrivalTime: '09:00',
  price: 5000,
  active: true,
  operatorId: 'test-operator-id',
  busId: 'test-bus-id',
  bus: {
    id: 'test-bus-id',
    plateNumber: 'UBA 123A',
    model: 'Toyota Hiace',
    capacity: 14
  },
  operator: {
    id: 'test-operator-id',
    companyName: 'Test Transport'
  }
});

const createTestBooking = () => ({
  id: 'test-booking-id',
  userId: 'test-user-id',
  routeId: 'test-route-id',
  seatNumber: '5',
  travelDate: new Date('2025-11-10'),
  status: 'PENDING',
  totalAmount: 5000,
  qrCode: 'test-qr-code',
  createdAt: new Date(),
  updatedAt: new Date()
});

const generateTestToken = () => 'test-token';

// Create test app
const app = express();
app.use(express.json());
app.use('/bookings', bookingRoutes);

describe('Booking Routes', () => {
  const testToken = generateTestToken();
  const testUser = createTestUser();
  const testRoute = createTestRoute();
  const testBooking = createTestBooking();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /bookings/my-bookings', () => {
    it('should return user bookings successfully', async () => {
      const mockBookings = [
        {
          ...testBooking,
          route: testRoute,
          payment: {
            amount: 5000,
            method: 'MTN',
            status: 'COMPLETED',
            createdAt: new Date()
          }
        }
      ];

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);

      const response = await request(app)
        .get('/bookings/my-bookings')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('route');
      expect(response.body[0]).toHaveProperty('payment');
      
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        include: expect.objectContaining({
          route: expect.any(Object),
          payment: expect.any(Object)
        }),
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/bookings/my-bookings');

      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.booking.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/bookings/my-bookings')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch bookings');
    });
  });

  describe('POST /bookings', () => {
    const validBookingData = {
      routeId: 'test-route-id',
      seatNumber: '5',
      travelDate: '2025-11-10T00:00:00.000Z'
    };

    it('should create a booking successfully', async () => {
      const mockRoute = {
        ...testRoute,
        bookings: []
      };

      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({
        ...testBooking,
        route: mockRoute
      });

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${testToken}`)
        .send(validBookingData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body.seatNumber).toBe(validBookingData.seatNumber);

      expect(mockPrisma.route.findUnique).toHaveBeenCalledWith({
        where: { id: validBookingData.routeId },
        include: expect.any(Object)
      });
      expect(mockPrisma.booking.create).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { routeId: 'test-route-id' }; // missing seatNumber and travelDate

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent route', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${testToken}`)
        .send(validBookingData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found or inactive');
    });

    it('should return 404 for inactive route', async () => {
      const inactiveRoute = { ...testRoute, active: false };
      mockPrisma.route.findUnique.mockResolvedValue(inactiveRoute);

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${testToken}`)
        .send(validBookingData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found or inactive');
    });

    it('should return 400 if seat is already booked', async () => {
      const mockRoute = { ...testRoute, bookings: [] };
      const existingBooking = { ...testBooking, status: 'CONFIRMED' };

      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);
      mockPrisma.booking.findFirst.mockResolvedValue(existingBooking);

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${testToken}`)
        .send(validBookingData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Seat is already booked for this date');
    });

    it('should return 400 for invalid seat number', async () => {
      const mockRoute = { ...testRoute, bookings: [] };
      const invalidSeatData = { ...validBookingData, seatNumber: '50' }; // exceeds capacity

      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidSeatData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid seat number for this bus');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/bookings')
        .send(validBookingData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /bookings/route/:routeId/seats', () => {
    it('should return available seats for a route', async () => {
      const mockRoute = {
        ...testRoute,
        bookings: [
          { seatNumber: '1', status: 'CONFIRMED' },
          { seatNumber: '3', status: 'PENDING' }
        ]
      };

      mockPrisma.route.findUnique.mockResolvedValue(mockRoute);

      const response = await request(app)
        .get('/bookings/route/test-route-id/seats')
        .query({ travelDate: '2025-11-10T00:00:00.000Z' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSeats', 14);
      expect(response.body).toHaveProperty('availableSeats');
      expect(response.body).toHaveProperty('bookedSeats');
      expect(response.body).toHaveProperty('seatMap');
      
      expect(response.body.bookedSeats).toContain('1');
      expect(response.body.bookedSeats).toContain('3');
      expect(response.body.availableSeats).not.toContain('1');
      expect(response.body.availableSeats).not.toContain('3');
    });

    it('should return 400 without travel date', async () => {
      const response = await request(app)
        .get('/bookings/route/test-route-id/seats');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Travel date is required');
    });

    it('should return 404 for non-existent route', async () => {
      mockPrisma.route.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/bookings/route/test-route-id/seats')
        .query({ travelDate: '2025-11-10T00:00:00.000Z' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('PUT /bookings/:id/cancel', () => {
    it('should cancel booking successfully', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 24); // 24 hours from now

      const cancellableBooking = {
        ...testBooking,
        travelDate: futureDate,
        status: 'CONFIRMED'
      };

      mockPrisma.booking.findUnique.mockResolvedValue(cancellableBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...cancellableBooking,
        status: 'CANCELLED'
      });

      const response = await request(app)
        .put('/bookings/test-booking-id/cancel')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELLED');

      expect(mockPrisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'test-booking-id' },
        data: { status: 'CANCELLED' }
      });
    });

    it('should return 404 for non-existent booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/bookings/non-existent-id/cancel')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Booking not found');
    });

    it('should return 403 for unauthorized user', async () => {
      const otherUserBooking = { ...testBooking, userId: 'other-user-id' };
      mockPrisma.booking.findUnique.mockResolvedValue(otherUserBooking);

      const response = await request(app)
        .put('/bookings/test-booking-id/cancel')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to cancel this booking');
    });

    it('should return 400 for already cancelled booking', async () => {
      const cancelledBooking = { ...testBooking, status: 'CANCELLED' };
      mockPrisma.booking.findUnique.mockResolvedValue(cancelledBooking);

      const response = await request(app)
        .put('/bookings/test-booking-id/cancel')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Booking is already cancelled');
    });

    it('should return 400 for late cancellation', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() + 1); // Only 1 hour from now

      const lateBooking = {
        ...testBooking,
        travelDate: pastDate
      };

      mockPrisma.booking.findUnique.mockResolvedValue(lateBooking);

      const response = await request(app)
        .put('/bookings/test-booking-id/cancel')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot cancel booking less than 2 hours before travel');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .put('/bookings/test-booking-id/cancel');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return booking details successfully', async () => {
      const fullBooking = {
        ...testBooking,
        route: testRoute,
        payment: { amount: 5000, method: 'MTN', status: 'COMPLETED' },
        verification: null
      };

      mockPrisma.booking.findUnique.mockResolvedValue(fullBooking);

      const response = await request(app)
        .get('/bookings/test-booking-id')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('route');
      expect(response.body).toHaveProperty('payment');
      expect(response.body.id).toBe('test-booking-id');
    });

    it('should return 404 for non-existent booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/bookings/non-existent-id')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Booking not found');
    });

    it('should return 403 for unauthorized user', async () => {
      const otherUserBooking = { ...testBooking, userId: 'other-user-id' };
      mockPrisma.booking.findUnique.mockResolvedValue(otherUserBooking);

      const response = await request(app)
        .get('/bookings/test-booking-id')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Not authorized to view this booking');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/bookings/test-booking-id');

      expect(response.status).toBe(401);
    });
  });
});