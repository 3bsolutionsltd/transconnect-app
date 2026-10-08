const mockPrisma = {
  $queryRaw: jest.fn(),
  route: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  routeSegment: {
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Prisma: { sql: jest.fn() },
}));

import { searchRoutesWithSegments } from '../../src/services/routeSegmentService';

const configuredRoute = {
  id: 'route-1',
  origin: 'Kampala',
  destination: 'Gulu',
  via: 'Masindi',
  price: 50000,
  distance: 300,
  duration: 300,
  departureTime: '08:00',
  bus: { plateNumber: 'UBA 123A', model: 'Coach', capacity: 50 },
  operator: { companyName: 'Test Coaches' },
};

describe('Route search display pricing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.route.findMany.mockResolvedValue([]);
  });

  it('returns the configured route fare instead of summing matched segment fares', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{
      route_id: 'route-1',
      pickup: 'Kampala',
      dropoff: 'Masindi',
      start_order: 1,
      end_order: 1,
    }]);
    mockPrisma.route.findUnique.mockResolvedValue(configuredRoute);
    mockPrisma.routeSegment.findMany.mockResolvedValue([
      { id: 'segment-1', distanceKm: 100, durationMinutes: 100, basePrice: 60000, priceVariations: [] },
    ]);

    const results = await searchRoutesWithSegments({
      origin: 'Kampala',
      destination: 'Masindi',
    });

    expect(results).toHaveLength(1);
    expect(results[0].basePrice).toBe(60000);
    expect(results[0].finalPrice).toBe(configuredRoute.price);
  });

  it('returns the configured route fare for legacy via-route results', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockPrisma.route.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([configuredRoute]);

    const results = await searchRoutesWithSegments({
      origin: 'Masindi',
      destination: 'Gulu',
    });

    expect(results).toHaveLength(1);
    expect(results[0].finalPrice).toBe(configuredRoute.price);
  });
});
