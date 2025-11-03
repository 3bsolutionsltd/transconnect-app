import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app, { prisma } from './test-app';
import { PaymentGatewayFactory } from '../services/payment-gateway.factory';

// Mock the payment services to avoid real API calls in tests
jest.mock('../services/mtn.service');
jest.mock('../services/airtel.service');

describe('Payment Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Create test user and login
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'payment.test@example.com',
        password: hashedPassword,
        firstName: 'Payment',
        lastName: 'Tester',
        phone: '256701234567',
        role: 'PASSENGER'
      }
    });
    userId = user.id;

    // Mock login to get token
    authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

    // Create test operator and route
    const operatorHashedPassword = await bcrypt.hash('operator123', 10);
    const operator = await prisma.operator.create({
      data: {
        companyName: 'Test Bus Company',
        license: 'TEST-001',
        approved: true,
        user: {
          create: {
            email: 'operator@test.com',
            password: operatorHashedPassword,
            firstName: 'Test',
            lastName: 'Operator',
            phone: '256702345678',
            role: 'OPERATOR'
          }
        }
      }
    });

    const bus = await prisma.bus.create({
      data: {
        plateNumber: 'UBE 123A',
        model: 'Toyota Hiace',
        capacity: 14,
        operatorId: operator.id
      }
    });

    const route = await prisma.route.create({
      data: {
        origin: 'Kampala',
        destination: 'Jinja',
        distance: 87.5,
        duration: 90,
        price: 15000,
        departureTime: '08:00',
        operatorId: operator.id,
        busId: bus.id
      }
    });

    // Create test booking
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        routeId: route.id,
        seatNumber: 'A1',
        travelDate: new Date('2025-12-01'),
        qrCode: 'QR123456789',
        totalAmount: 15000,
        status: 'PENDING'
      }
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.payment.deleteMany({ where: { userId } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.$disconnect();
  });

  describe('GET /api/payments/methods', () => {
    it('should return supported payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .expect(200);

      expect(response.body).toHaveProperty('supportedMethods');
      expect(response.body.supportedMethods).toBeInstanceOf(Array);
      expect(response.body.supportedMethods.length).toBeGreaterThan(0);
      
      const methods = response.body.supportedMethods;
      expect(methods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: 'MTN_MOBILE_MONEY',
            label: 'MTN Mobile Money',
            isOnline: true
          }),
          expect.objectContaining({
            value: 'AIRTEL_MONEY',
            label: 'Airtel Money',
            isOnline: true
          })
        ])
      );
    });
  });

  describe('POST /api/payments/validate', () => {
    it('should validate MTN phone number', async () => {
      const response = await request(app)
        .post('/api/payments/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'MTN_MOBILE_MONEY',
          phoneNumber: '256777123456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('method', 'MTN_MOBILE_MONEY');
      expect(response.body).toHaveProperty('methodDisplayName', 'MTN Mobile Money');
    });

    it('should validate Airtel phone number', async () => {
      const response = await request(app)
        .post('/api/payments/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'AIRTEL_MONEY',
          phoneNumber: '256750123456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('method', 'AIRTEL_MONEY');
      expect(response.body).toHaveProperty('methodDisplayName', 'Airtel Money');
    });

    it('should return validation error for invalid phone', async () => {
      const response = await request(app)
        .post('/api/payments/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          method: 'MTN_MOBILE_MONEY',
          phoneNumber: 'invalid-phone'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/payments/initiate', () => {
    it('should initiate MTN Mobile Money payment', async () => {
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: bookingId,
          method: 'MTN_MOBILE_MONEY',
          phoneNumber: '256777123456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('paymentId');
      expect(response.body).toHaveProperty('paymentReference');
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(response.body).toHaveProperty('provider', 'MTN Mobile Money');
      expect(response.body).toHaveProperty('transactionId');
    });

    it('should initiate Airtel Money payment', async () => {
      // Create another booking for this test
      const route = await prisma.route.findFirst();
      const booking = await prisma.booking.create({
        data: {
          userId: userId,
          routeId: route!.id,
          seatNumber: 'A2',
          travelDate: new Date('2025-12-02'),
          qrCode: 'QR123456790',
          totalAmount: 15000,
          status: 'PENDING'
        }
      });

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: booking.id,
          method: 'AIRTEL_MONEY',
          phoneNumber: '256750123456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('paymentId');
      expect(response.body).toHaveProperty('provider', 'Airtel Money');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should initiate cash payment', async () => {
      // Create another booking for this test
      const route = await prisma.route.findFirst();
      const booking = await prisma.booking.create({
        data: {
          userId: userId,
          routeId: route!.id,
          seatNumber: 'A3',
          travelDate: new Date('2025-12-03'),
          qrCode: 'QR123456791',
          totalAmount: 15000,
          status: 'PENDING'
        }
      });

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: booking.id,
          method: 'CASH'
        })
        .expect(200);

      expect(response.body).toHaveProperty('paymentId');
      expect(response.body).toHaveProperty('provider', 'Cash Payment');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should reject payment for non-existent booking', async () => {
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: 'non-existent-id',
          method: 'MTN_MOBILE_MONEY',
          phoneNumber: '256777123456'
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Booking not found');
    });

    it('should reject duplicate payment', async () => {
      // Try to create another payment for the same booking
      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: bookingId,
          method: 'MTN_MOBILE_MONEY',
          phoneNumber: '256777123456'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment already initiated for this booking');
    });

    it('should require phone number for mobile money', async () => {
      const route = await prisma.route.findFirst();
      const booking = await prisma.booking.create({
        data: {
          userId: userId,
          routeId: route!.id,
          seatNumber: 'A4',
          travelDate: new Date('2025-12-04'),
          qrCode: 'QR123456792',
          totalAmount: 15000,
          status: 'PENDING'
        }
      });

      const response = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId: booking.id,
          method: 'MTN_MOBILE_MONEY'
          // Missing phoneNumber
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Phone number is required for mobile money payments');
    });
  });

  describe('GET /api/payments/:paymentId/status', () => {
    let testPaymentId: string;

    beforeAll(async () => {
      // Create a test payment
      const payment = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: 15000,
          method: 'MTN_MOBILE_MONEY',
          reference: 'TEST-REF-123',
          transactionId: 'TXN-123456',
          status: 'PENDING'
        }
      });
      testPaymentId = payment.id;
    });

    it('should get payment status', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPaymentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('paymentId', testPaymentId);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('amount', 15000);
      expect(response.body).toHaveProperty('method', 'MTN_MOBILE_MONEY');
      expect(response.body).toHaveProperty('methodDisplayName', 'MTN Mobile Money');
    });

    it('should reject unauthorized status check', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPaymentId}/status`)
        // No authorization header
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('POST /api/payments/webhook/:gateway', () => {
    let testPaymentId: string;

    beforeAll(async () => {
      // Create a test payment for webhook testing
      const payment = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: 15000,
          method: 'MTN_MOBILE_MONEY',
          reference: 'WEBHOOK-TEST-123',
          transactionId: 'WEBHOOK-TXN-123',
          status: 'PENDING'
        }
      });
      testPaymentId = payment.id;
    });

    it('should process MTN webhook', async () => {
      const webhookPayload = {
        referenceId: 'WEBHOOK-TXN-123',
        status: 'SUCCESSFUL',
        financialTransactionId: 'MTN-FIN-123456'
      };

      const response = await request(app)
        .post('/api/payments/webhook/mtn')
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('paymentId');
      expect(response.body).toHaveProperty('status', 'COMPLETED');

      // Verify payment was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: testPaymentId }
      });
      expect(updatedPayment?.status).toBe('COMPLETED');
    });

    it('should process Airtel webhook', async () => {
      // Create another test payment for Airtel
      const payment = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          userId: userId,
          amount: 15000,
          method: 'AIRTEL_MONEY',
          reference: 'AIRTEL-TEST-123',
          transactionId: 'AIRTEL-TXN-123',
          status: 'PENDING'
        }
      });

      const webhookPayload = {
        data: {
          transaction: {
            id: 'AIRTEL-TXN-123',
            status: 'SUCCESS',
            airtel_money_id: 'AIRTEL-FIN-123456'
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook/airtel')
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify payment was updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id }
      });
      expect(updatedPayment?.status).toBe('COMPLETED');
    });

    it('should handle webhook for unknown transaction', async () => {
      const webhookPayload = {
        referenceId: 'UNKNOWN-TXN-123',
        status: 'SUCCESSFUL'
      };

      const response = await request(app)
        .post('/api/payments/webhook/mtn')
        .send(webhookPayload)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Payment not found');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should get payment history for user', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('payments');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.payments).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should paginate payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('PaymentGatewayFactory', () => {
    it('should return supported payment methods', () => {
      const methods = PaymentGatewayFactory.getSupportedMethods();
      expect(methods).toContain('MTN_MOBILE_MONEY');
      expect(methods).toContain('AIRTEL_MONEY');
      expect(methods).toContain('FLUTTERWAVE');
      expect(methods).toContain('CASH');
    });

    it('should identify online payment methods', () => {
      expect(PaymentGatewayFactory.isOnlinePayment('MTN_MOBILE_MONEY')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('AIRTEL_MONEY')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('FLUTTERWAVE')).toBe(true);
      expect(PaymentGatewayFactory.isOnlinePayment('CASH')).toBe(false);
    });

    it('should return display names for payment methods', () => {
      expect(PaymentGatewayFactory.getMethodDisplayName('MTN_MOBILE_MONEY')).toBe('MTN Mobile Money');
      expect(PaymentGatewayFactory.getMethodDisplayName('AIRTEL_MONEY')).toBe('Airtel Money');
      expect(PaymentGatewayFactory.getMethodDisplayName('FLUTTERWAVE')).toBe('Card Payment');
      expect(PaymentGatewayFactory.getMethodDisplayName('CASH')).toBe('Cash Payment');
    });
  });
});