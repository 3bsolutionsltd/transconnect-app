import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';

let mockUserRole = 'ADMIN';

jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = { role: mockUserRole };
    next();
  },
}));

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    operator: {
      findMany: jest.fn(),
    },
  },
}));

import operatorRoutes from '../../src/routes/operators';
import { prisma } from '../../src/lib/prisma';

const mockFindMany = prisma.operator.findMany as jest.Mock;
const app = express();
app.use('/operators', operatorRoutes);

describe('Admin operators route', () => {
  beforeEach(() => {
    mockUserRole = 'ADMIN';
    jest.clearAllMocks();
  });

  it('returns approved and unapproved operators with inactive fleet records', async () => {
    const operators = [
      { id: 'pending-operator', approved: false, buses: [], routes: [] },
    ];
    mockFindMany.mockResolvedValue(operators);

    const response = await request(app).get('/operators/admin/all');

    expect(response.status).toBe(200);
    expect(response.body.operators).toEqual(operators);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({
        buses: expect.not.objectContaining({ where: expect.anything() }),
        routes: expect.not.objectContaining({ where: expect.anything() }),
      }),
    }));
  });

  it('rejects non-admin callers', async () => {
    mockUserRole = 'MANAGER';

    const response = await request(app).get('/operators/admin/all');

    expect(response.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
