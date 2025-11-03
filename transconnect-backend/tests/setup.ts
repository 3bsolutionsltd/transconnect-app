import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Global test environment setup
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.NODE_ENV = 'test';
});

// Mock Prisma for testing
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  booking: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
  route: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  bus: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  operator: {
    findMany: jest.fn(),
    create: jest.fn(),
  }
};

// Test utilities
export const createTestUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+256700000000',
  role: 'PASSENGER',
  verified: true,
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKTEW1HV4.7.QYK' // "password123"
});

export const createTestRoute = () => ({
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

export const createTestBooking = () => ({
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

export const generateTestToken = (userId: string = 'test-user-id', role: string = 'PASSENGER') => {
  return jwt.sign(
    { userId, email: 'test@example.com', role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});