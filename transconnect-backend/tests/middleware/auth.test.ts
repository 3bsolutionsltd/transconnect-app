import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole } from '../../src/middleware/auth';

// Mock the Prisma import first
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../src/index', () => ({
  prisma: mockPrisma
}));

// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

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

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const testUser = createTestUser();
      const mockDecoded = {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUser.id },
        select: { id: true, email: true, role: true, verified: true }
      });
      expect((mockRequest as any).user).toEqual({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      mockRequest.headers = {};

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const mockDecoded = {
        userId: 'non-existent-user',
        email: 'test@example.com',
        role: 'PASSENGER'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or unverified user' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not verified', async () => {
      const unverifiedUser = { ...createTestUser(), verified: false };
      const mockDecoded = {
        userId: unverifiedUser.id,
        email: unverifiedUser.email,
        role: unverifiedUser.role
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockPrisma.user.findUnique.mockResolvedValue(unverifiedUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or unverified user' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockDecoded = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'PASSENGER'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      (mockRequest as any).user = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'PASSENGER'
      };
    });

    it('should allow access when user has required role', () => {
      const middleware = requireRole(['PASSENGER', 'ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      const middleware = requireRole(['ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      delete (mockRequest as any).user;
      const middleware = requireRole(['PASSENGER']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow admin to access passenger routes', () => {
      (mockRequest as any).user.role = 'ADMIN';
      const middleware = requireRole(['PASSENGER', 'ADMIN']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle multiple roles correctly', () => {
      (mockRequest as any).user.role = 'OPERATOR';
      const middleware = requireRole(['PASSENGER', 'ADMIN', 'OPERATOR']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});