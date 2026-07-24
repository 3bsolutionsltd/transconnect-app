import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/tools/agents/otp.tool', () => ({
  sendOtpForIdentifier: jest.fn().mockResolvedValue({
    otp: '123456',
    expiry: new Date(Date.now() + 10 * 60 * 1000),
  }),
  verifyOtpCodeForIdentifier: jest.fn().mockResolvedValue(true),
  sendOtp: jest.fn().mockResolvedValue({
    otp: '123456',
    expiry: new Date(Date.now() + 10 * 60 * 1000),
  }),
  verifyOtpCode: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/services/email-otp.service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      sendOTP: jest.fn().mockResolvedValue({ success: true }),
    }),
  },
}));

jest.mock('../../src/services/multi-provider-sms.service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      sendOTP: jest.fn().mockResolvedValue({
        success: true,
        provider: 'mock-sms',
      }),
    }),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

import authRoutes from '../../src/routes/auth';
import { prisma } from '../../src/lib/prisma';

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

const passengerRegistration = {
  email: 'passenger@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Passenger',
  phone: '+256700000000',
  role: 'PASSENGER',
};

describe('Passenger Verification UAT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findFirst.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.create.mockReset();
    mockPrisma.user.update.mockReset();
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('registers passenger and requires email verification', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: passengerRegistration.email,
      firstName: passengerRegistration.firstName,
      lastName: passengerRegistration.lastName,
      phone: passengerRegistration.phone,
      role: 'PASSENGER',
      verified: false,
    });

    const response = await request(app).post('/auth/register').send(passengerRegistration);

    expect(response.status).toBe(201);
    expect(response.body.verificationRequired).toBe(true);
    expect(response.body.verificationChannel).toBe('email');
    expect(response.body.verificationDelivery.emailSent).toBe(true);
  });

  it('blocks login until email verification is completed', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: passengerRegistration.email,
      firstName: passengerRegistration.firstName,
      lastName: passengerRegistration.lastName,
      phone: passengerRegistration.phone,
      role: 'PASSENGER',
      verified: false,
      password: 'hashedPassword',
    });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: passengerRegistration.email, password: passengerRegistration.password });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    expect(response.body.verificationRequired).toBe(true);
  });

  it('verifies email OTP and returns passenger token', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: passengerRegistration.email,
      firstName: passengerRegistration.firstName,
      lastName: passengerRegistration.lastName,
      phone: passengerRegistration.phone,
      role: 'PASSENGER',
      verified: false,
    });
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: passengerRegistration.email,
      firstName: passengerRegistration.firstName,
      lastName: passengerRegistration.lastName,
      phone: passengerRegistration.phone,
      role: 'PASSENGER',
      verified: true,
    });
    (mockJwt.sign as jest.Mock).mockReturnValue('email-token');

    const response = await request(app)
      .post('/auth/verify-email-otp')
      .send({ email: passengerRegistration.email, otp: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Email verified successfully');
    expect(response.body.user.verified).toBe(true);
    expect(response.body.token).toBe('email-token');
  });

  it('requests phone OTP and verifies a new passenger account', async () => {
    const phoneNumber = '+256700000111';

    const requestResponse = await request(app)
      .post('/auth/request-otp')
      .send({ phoneNumber });

    expect(requestResponse.status).toBe(200);
    expect(requestResponse.body.next_step).toBe('verify_otp');
    expect(requestResponse.body.phoneNumber).toContain('256700000111');

    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'phone-user-1',
      email: '256700000111@transconnect.app',
      firstName: 'Passenger',
      lastName: '0111',
      phone: phoneNumber,
      role: 'PASSENGER',
      verified: true,
      password: 'hashedPassword',
    });
    (mockJwt.sign as jest.Mock).mockReturnValue('phone-token');

    const verifyResponse = await request(app)
      .post('/auth/verify-otp')
      .send({ phoneNumber, otp: '123456' });

    expect(verifyResponse.status).toBe(201);
    expect(verifyResponse.body.isNewUser).toBe(true);
    expect(verifyResponse.body.user.phone).toBe(phoneNumber);
    expect(verifyResponse.body.token).toBe('phone-token');
  });
});