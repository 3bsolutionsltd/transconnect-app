import request from 'supertest';
import express from 'express';

jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).user = {
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'ADMIN',
    };
    next();
  },
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    operator: {
      findUnique: jest.fn(),
    },
    operatorUser: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import operatorUsersRoutes from '../../src/routes/operator-users';
import { prisma } from '../../src/lib/prisma';

const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/operator-users', operatorUsersRoutes);

describe('Operator Users Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents duplicate assignment for same user and operator', async () => {
    mockPrisma.operator.findUnique.mockResolvedValue({
      id: 'op-1',
      approved: true,
    });

    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'existing@example.com',
      phone: '+256700000100',
      role: 'PASSENGER',
      verified: true,
    });

    mockPrisma.operatorUser.findFirst.mockResolvedValue({
      id: 'existing-link-1',
      userId: 'user-1',
      operatorId: 'op-1',
      role: 'TICKETER',
      active: true,
    });

    const response = await request(app)
      .post('/operator-users')
      .send({
        operatorId: 'op-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        phone: '+256700000100',
        role: 'TICKETER',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('This user is already assigned to the selected operator');
    expect(mockPrisma.operatorUser.create).not.toHaveBeenCalled();
  });
});
