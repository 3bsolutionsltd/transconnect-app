import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, requirePermission } from '../../src/middleware/auth';
import { prisma } from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

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
  roleId: null,
  verified: true,
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKTEW1HV4.7.QYK', // "password123"
  operatorUser: null,
  fieldOperatorScopes: []
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
        select: {
          id: true,
          email: true,
          role: true,
          roleId: true,
          verified: true,
          operatorUser: {
            select: {
              id: true,
              active: true,
            },
          },
          fieldOperatorScopes: {
            where: { active: true },
            select: { id: true },
          },
        }
      });
      expect((mockRequest as any).user).toEqual({
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        roles: ['PASSENGER'],
        roleId: null,
        permissions: []
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should derive OPERATOR and OPERATOR_FIELD_OPERATOR effective roles', async () => {
      const testUser = {
        ...createTestUser(),
        role: 'PASSENGER',
        operatorUser: {
          id: 'op-user-1',
          active: true,
        },
        fieldOperatorScopes: [{ id: 'scope-1' }],
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
      });
      mockPrisma.user.findUnique.mockResolvedValue(testUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect((mockRequest as any).user).toEqual({
        id: testUser.id,
        email: testUser.email,
        role: 'PASSENGER',
        roles: ['PASSENGER', 'OPERATOR', 'OPERATOR_FIELD_OPERATOR'],
        roleId: null,
        permissions: [],
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
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token', code: 'AUTH_ERROR' });
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
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token', code: 'AUTH_ERROR' });
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

    it('should allow access from effective roles array', () => {
      (mockRequest as any).user = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'PASSENGER',
        roles: ['PASSENGER', 'OPERATOR']
      };

      const middleware = requireRole(['OPERATOR']);

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

  describe('requirePermission', () => {
    beforeEach(() => {
      (mockRequest as any).user = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'MASTER_FIELD_OPERATOR',
        roles: ['MASTER_FIELD_OPERATOR'],
        roleId: 'role_master_field_operator',
        permissions: ['dashboard.view', 'bookings.read'],
      };
    });

    it('should allow access when the user holds the permission', () => {
      requirePermission('bookings.read')(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow access when the user holds any one of several permissions', () => {
      requirePermission('users.write', 'dashboard.view')(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should deny access when the permission is missing', () => {
      requirePermission('users.write')(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: ['users.write'],
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny access when the user has no permissions resolved', () => {
      (mockRequest as any).user.permissions = undefined;

      requirePermission('dashboard.view')(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when the request is unauthenticated', () => {
      (mockRequest as any).user = undefined;

      requirePermission('dashboard.view')(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});