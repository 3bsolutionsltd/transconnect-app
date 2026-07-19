export type TrustedOperator = {
  name: string;
  activeRoutes: number;
  destinationsServed: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  sampleRoute: string;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

function getOperatorName(route: any): string {
  const candidates = [
    route?.operator?.companyName,
    route?.operator?.name,
    route?.operatorName,
    route?.companyName,
    route?.busCompany,
    route?.providerName,
    route?.company,
    typeof route?.operator === 'string' ? route.operator : undefined,
  ];

  const raw = candidates.find((item) => typeof item === 'string' && item.trim().length > 0) as string | undefined;
  return raw ? normalizeName(raw) : 'Independent Operator';
}

function isRouteActive(route: any): boolean {
  if (typeof route?.isActive === 'boolean') return route.isActive;
  if (typeof route?.status === 'string') return route.status.toUpperCase() === 'ACTIVE';
  return true;
}

export function deriveTrustedOperators(routes: any[]): TrustedOperator[] {
  const map = new Map<string, {
    name: string;
    activeRoutes: number;
    prices: number[];
    destinations: Set<string>;
    sampleRoute: string;
  }>();

  for (const route of routes || []) {
    if (!isRouteActive(route)) continue;

    const name = getOperatorName(route);
    const origin = normalizeName(route?.origin || route?.from || 'Kampala');
    const destination = normalizeName(route?.destination || route?.to || 'Destination');
    const price = toNumber(route?.price);
    const routeLabel = `${origin} -> ${destination}`;

    if (!map.has(name)) {
      map.set(name, {
        name,
        activeRoutes: 0,
        prices: [],
        destinations: new Set<string>(),
        sampleRoute: routeLabel,
      });
    }

    const entry = map.get(name)!;
    entry.activeRoutes += 1;
    entry.destinations.add(destination);
    if (price > 0) entry.prices.push(price);
  }

  return Array.from(map.values())
    .map((entry) => {
      const minPrice = entry.prices.length ? Math.min(...entry.prices) : 0;
      const maxPrice = entry.prices.length ? Math.max(...entry.prices) : 0;
      const avgPrice = entry.prices.length
        ? Math.round(entry.prices.reduce((sum, p) => sum + p, 0) / entry.prices.length)
        : 0;

      return {
        name: entry.name,
        activeRoutes: entry.activeRoutes,
        destinationsServed: entry.destinations.size,
        minPrice,
        maxPrice,
        avgPrice,
        sampleRoute: entry.sampleRoute,
      };
    })
    .sort((a, b) => b.activeRoutes - a.activeRoutes || a.name.localeCompare(b.name));
}
