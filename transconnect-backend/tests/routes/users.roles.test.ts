import request from 'supertest';
import express from 'express';

jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).user = {
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'ADMIN',
      roles: ['ADMIN'],
    };
    next();
  },
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    operator: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    operatorUser: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    fieldOperatorScope: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import usersRoutes from '../../src/routes/users';
import { prisma } from '../../src/lib/prisma';

const mockPrisma = prisma as any;

const app = express();
app.use(express.json());
app.use('/users', usersRoutes);

describe('Users Role Management Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(mockPrisma));
  });

  it('reuses existing user account and adds field operator scope without requiring password', async () => {
    const existingUser = {
      id: 'user-1',
      email: 'passenger@example.com',
      phone: '+256700000001',
      role: 'PASSENGER',
      verified: true,
    };

    mockPrisma.user.findFirst.mockResolvedValue(existingUser);
    mockPrisma.operator.findMany.mockResolvedValue([{ id: 'op-1' }]);
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });
    mockPrisma.fieldOperatorScope.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'passenger@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+256700000001',
      role: 'PASSENGER',
      verified: true,
      createdAt: new Date(),
      fieldOperatorScopes: [
        {
          operatorId: 'op-1',
          operator: {
            id: 'op-1',
            companyName: 'Demo Operator',
          },
        },
      ],
    });

    const response = await request(app)
      .post('/users')
      .send({
        email: 'passenger@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+256700000001',
        role: 'OPERATOR_FIELD_OPERATOR',
        operatorScopeIds: ['op-1'],
      });

    expect(response.status).toBe(201);
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.fieldOperatorScope.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 'user-1',
          operatorId: 'op-1',
          active: true,
        },
      ],
      skipDuplicates: true,
    });
  });

  it('returns effective roles in GET /users/:id/roles', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'multi@example.com',
      role: 'PASSENGER',
      operatorUser: {
        id: 'op-user-2',
        active: true,
        operatorId: 'op-2',
        role: 'TICKETER',
      },
      fieldOperatorScopes: [{ id: 'scope-1', operatorId: 'op-2', operator: { companyName: 'Operator 2' } }],
    });

    const response = await request(app).get('/users/user-2/roles');

    expect(response.status).toBe(200);
    expect(response.body.primaryRole).toBe('PASSENGER');
    expect(response.body.effectiveRoles).toEqual(
      expect.arrayContaining(['PASSENGER', 'OPERATOR', 'OPERATOR_FIELD_OPERATOR'])
    );
  });

  it('rejects OPERATOR assignment without operatorId', async () => {
    const response = await request(app)
      .post('/users/user-3/roles/assign')
      .send({ role: 'OPERATOR' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('operatorId is required when assigning OPERATOR role');
  });
});
