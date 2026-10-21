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
  Prisma: {
    sql: jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings: [...strings],
      values,
    })),
  },
}));

import { searchRoutesWithSegments } from '../../src/services/routeSegmentService';

describe('Route segment search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([]);
  });

  it('requires exact case-insensitive stop matches', async () => {
    await searchRoutesWithSegments({
      origin: ' Kampala ',
      destination: 'Masindi',
    });

    const query = mockPrisma.$queryRaw.mock.calls[0][0] as {
      strings: string[];
      values: unknown[];
    };
    const sql = query.strings.join('?');

    expect(sql).toContain('LOWER(TRIM(rs1.from_location)) = LOWER(TRIM(?))');
    expect(sql).toContain('LOWER(TRIM(rs2.to_location)) = LOWER(TRIM(?))');
    expect(query.values).toContain('Kampala');
    expect(query.values).toContain('Masindi');
  });

  it('uses the configured route fare for the search result, not matched segment fares', async () => {
    const configuredRoute = {
      id: 'route-1',
      origin: 'Kampala',
      destination: 'Arua',
      price: 50000,
      distance: 300,
      duration: 300,
      departureTime: '08:00',
      bus: { plateNumber: 'UBA 123A', model: 'Coach', capacity: 50 },
      operator: { companyName: 'Test Coaches' },
    };
    mockPrisma.$queryRaw.mockResolvedValue([{
      route_id: configuredRoute.id,
      pickup: 'Kampala',
      dropoff: 'Masindi',
      start_order: 1,
      end_order: 1,
    }]);
    mockPrisma.route.findUnique.mockResolvedValue(configuredRoute);
    mockPrisma.routeSegment.findMany.mockResolvedValue([{
      id: 'segment-1',
      distanceKm: 100,
      durationMinutes: 100,
      basePrice: 16667,
      priceVariations: [],
    }]);

    const results = await searchRoutesWithSegments({
      origin: 'Kampala',
      destination: 'Masindi',
    });

    expect(results).toHaveLength(1);
    expect(results[0].segments[0].finalPrice).toBe(16667);
    expect(results[0].finalPrice).toBe(configuredRoute.price);
  });
});
