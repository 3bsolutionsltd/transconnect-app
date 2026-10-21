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
});
