import express from 'express';
import request from 'supertest';
import routeRoutes from '../../src/routes/routes';
import { prisma } from '../../src/lib/prisma';
import { searchRoutesWithSegments } from '../../src/services/routeSegmentService';

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    route: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/routeSegmentService', () => ({
  searchRoutesWithSegments: jest.fn(),
  materializeLegacyViaRoutes: jest.fn(),
  syncStopsFromSegments: jest.fn(),
}));

const app = express();
app.use('/routes', routeRoutes);

describe('Route search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (searchRoutesWithSegments as jest.Mock).mockResolvedValue([]);
  });

  it('excludes direct routes whose names only contain the requested locations', async () => {
    const matchingRoute = {
      id: 'route-masindi',
      origin: ' Kampala ',
      destination: 'Masindi',
    };
    (prisma.route.findMany as jest.Mock).mockResolvedValue([
      matchingRoute,
      {
        id: 'route-misleading',
        origin: 'Kampala',
        destination: 'Gulu Hwy/Kampala-Masindi',
      },
    ]);

    const response = await request(app)
      .get('/routes')
      .query({ origin: 'Kampala', destination: 'Masindi' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([matchingRoute]);
  });
});
