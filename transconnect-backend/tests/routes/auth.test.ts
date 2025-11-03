import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the dependencies first before importing the routes
jest.mock('../../src/index', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  }
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Now import the route after mocking
import authRoutes from '../../src/routes/auth';
import { prisma } from '../../src/index';

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Test data
const createTestUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+256700000000',
  role: 'PASSENGER',
  verified: true,
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKTEW1HV4.7.QYK' // "password123"
});

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+256700000000',
      role: 'PASSENGER'
    };

    it('should register a new user successfully', async () => {
      const testUser = createTestUser();
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue(testUser);
      (mockJwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(validUserData.email);
      expect(response.body.token).toBe('test-token');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validUserData.email }
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validUserData.password, 12);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should return 400 if user already exists', async () => {
      const existingUser = createTestUser();
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const invalidData = { ...validUserData, password: '123' };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for invalid phone number', async () => {
      const invalidData = { ...validUserData, phone: 'invalid-phone' };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should default to PASSENGER role when invalid role provided', async () => {
      const testUser = { ...createTestUser(), role: 'PASSENGER' };
      const dataWithInvalidRole = { ...validUserData, role: 'INVALID_ROLE' };
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue(testUser);
      (mockJwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/auth/register')
        .send(dataWithInvalidRole);

      expect(response.status).toBe(201);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'PASSENGER'
          })
        })
      );
    });

    it('should handle server errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Registration failed');
    });
  });

  describe('POST /auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login user successfully with correct credentials', async () => {
      const testUser = createTestUser();
      
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.token).toBe('test-token');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email }
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginData.password, testUser.password);
    });

    it('should return 401 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      const testUser = createTestUser();
      
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...loginData, email: 'invalid-email' };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const invalidData = { email: loginData.email };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle server errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Login failed');
    });

    it('should not include password in response', async () => {
      const testUser = createTestUser();
      
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockJwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty('password');
    });
  });
});