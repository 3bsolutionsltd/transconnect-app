import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth';
import bookingRoutes from '../../src/routes/bookings';
import routeRoutes from '../../src/routes/routes';
import { mockPrisma, createTestUser, createTestRoute } from '../setup';

// Mock the Prisma import
jest.mock('../../src/index', () => ({
  prisma: mockPrisma
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'PASSENGER'
  })
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mocked-qr-code')
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/routes', routeRoutes);

describe('Complete Booking Flow Integration', () => {
  const testUser = createTestUser();
  const testRoute = createTestRoute();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Booking Process', () => {
    it('should complete full user journey: register -> login -> search routes -> book -> view booking', async () => {
      // Step 1: User Registration
      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // No existing user
      mockPrisma.user.create.mockResolvedValueOnce(testUser);

      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+256700000000',
          role: 'PASSENGER'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body).toHaveProperty('user');

      const token = registerResponse.body.token;

      // Step 2: Search for routes
      mockPrisma.route.findMany.mockResolvedValueOnce([testRoute]);

      const routesResponse = await request(app)
        .get('/routes')
        .query({
          origin: 'Kampala',
          destination: 'Entebbe',
          date: '2025-11-10'
        });

      expect(routesResponse.status).toBe(200);
      expect(routesResponse.body).toHaveLength(1);
      expect(routesResponse.body[0].origin).toBe('Kampala');

      // Step 3: Check seat availability
      const routeWithBookings = {
        ...testRoute,
        bookings: [
          { seatNumber: '1', status: 'CONFIRMED' }
        ]
      };
      mockPrisma.route.findUnique.mockResolvedValueOnce(routeWithBookings);

      const seatsResponse = await request(app)
        .get(`/bookings/route/${testRoute.id}/seats`)
        .query({ travelDate: '2025-11-10T00:00:00.000Z' });

      expect(seatsResponse.status).toBe(200);
      expect(seatsResponse.body.totalSeats).toBe(14);
      expect(seatsResponse.body.bookedSeats).toContain('1');
      expect(seatsResponse.body.availableSeats).not.toContain('1');

      // Step 4: Make a booking
      mockPrisma.user.findUnique.mockResolvedValue(testUser); // For auth middleware
      mockPrisma.route.findUnique.mockResolvedValueOnce({
        ...testRoute,
        bookings: []
      });
      mockPrisma.booking.findFirst.mockResolvedValueOnce(null); // Seat available
      
      const newBooking = {
        id: 'new-booking-id',
        userId: testUser.id,
        routeId: testRoute.id,
        seatNumber: '5',
        travelDate: new Date('2025-11-10'),
        status: 'PENDING',
        totalAmount: 5000,
        qrCode: 'data:image/png;base64,mocked-qr-code',
        createdAt: new Date(),
        updatedAt: new Date(),
        route: testRoute
      };
      
      mockPrisma.booking.create.mockResolvedValueOnce(newBooking);

      const bookingResponse = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          routeId: testRoute.id,
          seatNumber: '5',
          travelDate: '2025-11-10T00:00:00.000Z'
        });

      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body).toHaveProperty('id');
      expect(bookingResponse.body).toHaveProperty('qrCode');
      expect(bookingResponse.body.seatNumber).toBe('5');
      expect(bookingResponse.body.status).toBe('PENDING');

      // Step 5: View user's bookings
      mockPrisma.booking.findMany.mockResolvedValueOnce([{
        ...newBooking,
        route: testRoute,
        payment: {
          amount: 5000,
          method: 'MTN',
          status: 'PENDING',
          createdAt: new Date()
        }
      }]);

      const myBookingsResponse = await request(app)
        .get('/bookings/my-bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(myBookingsResponse.status).toBe(200);
      expect(myBookingsResponse.body).toHaveLength(1);
      expect(myBookingsResponse.body[0].seatNumber).toBe('5');
      expect(myBookingsResponse.body[0]).toHaveProperty('route');
      expect(myBookingsResponse.body[0]).toHaveProperty('payment');

      // Step 6: Get specific booking details
      mockPrisma.booking.findUnique.mockResolvedValueOnce({
        ...newBooking,
        route: testRoute,
        payment: {
          amount: 5000,
          method: 'MTN',
          status: 'PENDING',
          createdAt: new Date()
        },
        verification: null
      });

      const bookingDetailResponse = await request(app)
        .get(`/bookings/${newBooking.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(bookingDetailResponse.status).toBe(200);
      expect(bookingDetailResponse.body.id).toBe(newBooking.id);
      expect(bookingDetailResponse.body).toHaveProperty('route');
      expect(bookingDetailResponse.body).toHaveProperty('payment');
    });

    it('should handle booking conflicts correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser); // For auth middleware

      // Two users trying to book the same seat simultaneously
      const routeWithNoBookings = {
        ...testRoute,
        bookings: []
      };

      // First booking attempt
      mockPrisma.route.findUnique.mockResolvedValueOnce(routeWithNoBookings);
      mockPrisma.booking.findFirst.mockResolvedValueOnce(null); // Seat appears available
      
      const firstBooking = {
        id: 'first-booking-id',
        userId: testUser.id,
        routeId: testRoute.id,
        seatNumber: '5',
        travelDate: new Date('2025-11-10'),
        status: 'PENDING',
        totalAmount: 5000,
        qrCode: 'data:image/png;base64,mocked-qr-code',
        route: testRoute
      };
      
      mockPrisma.booking.create.mockResolvedValueOnce(firstBooking);

      const firstResponse = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer test-token`)
        .send({
          routeId: testRoute.id,
          seatNumber: '5',
          travelDate: '2025-11-10T00:00:00.000Z'
        });

      expect(firstResponse.status).toBe(201);

      // Second booking attempt for the same seat
      mockPrisma.route.findUnique.mockResolvedValueOnce(routeWithNoBookings);
      mockPrisma.booking.findFirst.mockResolvedValueOnce(firstBooking); // Seat now taken

      const secondResponse = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer test-token`)
        .send({
          routeId: testRoute.id,
          seatNumber: '5',
          travelDate: '2025-11-10T00:00:00.000Z'
        });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.error).toBe('Seat is already booked for this date');
    });

    it('should handle cancellation workflow correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser); // For auth middleware

      // Create a booking that can be cancelled (future date)
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 25); // 25 hours from now

      const cancellableBooking = {
        id: 'cancellable-booking-id',
        userId: testUser.id,
        routeId: testRoute.id,
        seatNumber: '7',
        travelDate: futureDate,
        status: 'CONFIRMED',
        totalAmount: 5000,
        route: testRoute
      };

      // Step 1: Get booking details
      mockPrisma.booking.findUnique.mockResolvedValueOnce({
        ...cancellableBooking,
        route: testRoute,
        payment: { amount: 5000, method: 'MTN', status: 'COMPLETED' },
        verification: null
      });

      const bookingDetailResponse = await request(app)
        .get(`/bookings/${cancellableBooking.id}`)
        .set('Authorization', `Bearer test-token`);

      expect(bookingDetailResponse.status).toBe(200);
      expect(bookingDetailResponse.body.status).toBe('CONFIRMED');

      // Step 2: Cancel the booking
      mockPrisma.booking.findUnique.mockResolvedValueOnce(cancellableBooking);
      mockPrisma.booking.update.mockResolvedValueOnce({
        ...cancellableBooking,
        status: 'CANCELLED'
      });

      const cancelResponse = await request(app)
        .put(`/bookings/${cancellableBooking.id}/cancel`)
        .set('Authorization', `Bearer test-token`);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe('CANCELLED');

      // Step 3: Verify seat is now available again
      const routeWithCancelledBooking = {
        ...testRoute,
        bookings: [
          { seatNumber: '7', status: 'CANCELLED' } // Cancelled bookings don't block seats
        ]
      };
      mockPrisma.route.findUnique.mockResolvedValueOnce(routeWithCancelledBooking);

      const updatedSeatsResponse = await request(app)
        .get(`/bookings/route/${testRoute.id}/seats`)
        .query({ travelDate: futureDate.toISOString() });

      expect(updatedSeatsResponse.status).toBe(200);
      expect(updatedSeatsResponse.body.availableSeats).toContain('7');
      expect(updatedSeatsResponse.body.bookedSeats).not.toContain('7');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle authentication failures throughout the flow', async () => {
      // Try to access protected route without token
      const response1 = await request(app)
        .get('/bookings/my-bookings');

      expect(response1.status).toBe(401);

      // Try with invalid token
      const response2 = await request(app)
        .get('/bookings/my-bookings')
        .set('Authorization', 'Bearer invalid-token');

      expect(response2.status).toBe(403);

      // Try with malformed authorization header
      const response3 = await request(app)
        .get('/bookings/my-bookings')
        .set('Authorization', 'InvalidFormat');

      expect(response3.status).toBe(401);
    });

    it('should handle database failures gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testUser); // For auth middleware
      
      // Database error during booking creation
      mockPrisma.route.findUnique.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer test-token`)
        .send({
          routeId: testRoute.id,
          seatNumber: '5',
          travelDate: '2025-11-10T00:00:00.000Z'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create booking');
    });
  });
});