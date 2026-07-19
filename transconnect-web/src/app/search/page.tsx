'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { fetchRoutes } from '../../lib/api';
import Link from 'next/link';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import { Bus as BusIcon, Clock, MapPin, Search, Star, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Section, Container, StyledCard, StyledButton } from '@/components/styled';
import OperatorLogoBadge from '@/components/branding/OperatorLogoBadge';

function SearchContent() {
  const searchParams = useSearchParams();
  const operatorFilter = (searchParams.get('operator') || '').trim();
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [passengers, setPassengers] = useState(Number(searchParams.get('passengers') || 1));
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [maxPrice, setMaxPrice] = useState(80000);
  const [minPrice] = useState(35000);
  const [sortBy, setSortBy] = useState<'price' | 'departure' | 'duration' | 'rating'>('price');

  React.useEffect(() => {
    handleSearch();
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params: any = {};
      if (origin) params.origin = origin;
      if (destination) params.destination = destination;
      if (date) params.travelDate = date;
      const result = await fetchRoutes(params);
      setRoutes(result || []);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredRoutes = useMemo(() => {
    function toDepartureMinutes(value: unknown) {
      if (typeof value !== 'string' || !value.trim()) return Number.MAX_SAFE_INTEGER;
      const raw = value.trim().toUpperCase();

      const twelveHourMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
      if (twelveHourMatch) {
        let hours = Number(twelveHourMatch[1]);
        const minutes = Number(twelveHourMatch[2]);
        const ampm = twelveHourMatch[3];
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return (hours * 60) + minutes;
      }

      const twentyFourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
      if (twentyFourMatch) {
        const hours = Number(twentyFourMatch[1]);
        const minutes = Number(twentyFourMatch[2]);
        return (hours * 60) + minutes;
      }

      return Number.MAX_SAFE_INTEGER;
    }

    const filtered = routes.filter((route) => {
      const withinPrice = Number(route.price || 0) <= maxPrice;
      if (!withinPrice) return false;

      if (!operatorFilter) return true;

      const routeOperatorName = (
        route?.operator?.companyName ||
        route?.operator?.name ||
        route?.operatorInfo?.companyName ||
        route?.operatorName ||
        ''
      ).toString().toLowerCase();

      return routeOperatorName.includes(operatorFilter.toLowerCase());
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'price') {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (sortBy === 'departure') {
        return toDepartureMinutes(a.departureTime) - toDepartureMinutes(b.departureTime);
      }

      if (sortBy === 'duration') {
        return Number(a.duration || 0) - Number(b.duration || 0);
      }

      // Rating currently static in UI; preserve order for now.
      return 0;
    });

    return sorted;
  }, [maxPrice, operatorFilter, routes, sortBy]);

  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />

      <Section variant="gray" className="py-3 border-b border-[#dfe8f5]">
        <Container>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="relative md:col-span-3">
              <MapPin className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="tc-input !py-3 !pl-9" />
            </div>
            <div className="relative md:col-span-3">
              <MapPin className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={destination} onChange={(e) => setDestination(e.target.value)} className="tc-input !py-3 !pl-9" />
            </div>
            <div className="relative md:col-span-3">
              <Clock className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="tc-input !py-3 !pl-9" />
            </div>
            <div className="relative md:col-span-2">
              <Users className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
              <div className="tc-input !py-3 !pl-9 flex items-center justify-between">
                <span>{passengers} Passenger</span>
                <div className="flex gap-2">
                  <button type="button" className="font-bold" onClick={() => setPassengers((v) => Math.max(1, v - 1))}>-</button>
                  <button type="button" className="font-bold" onClick={() => setPassengers((v) => v + 1)}>+</button>
                </div>
              </div>
            </div>
            <StyledButton type="submit" variant="primary" className="md:col-span-1 !py-3 !px-3 w-full">
              <Search className="h-4 w-4" />
            </StyledButton>
          </form>
        </Container>
      </Section>

      <Section variant="gray" className="pt-5 pb-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            <aside className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#14263f]">{filteredRoutes.length} routes found</h2>
                <button className="text-sm font-semibold text-[#0f8c6b]" onClick={() => setMaxPrice(80000)}>Clear all</button>
              </div>

              {operatorFilter && (
                <StyledCard hover={false} className="!p-3">
                  <p className="text-xs font-bold uppercase text-[#8ca4c4] mb-1">Filtered by operator</p>
                  <p className="text-sm font-semibold text-[#214c86]">{operatorFilter}</p>
                </StyledCard>
              )}

              <StyledCard hover={false} className="!p-4">
                <p className="text-xs font-bold uppercase text-[#8ca4c4] mb-3">Sort By</p>
                <div className="space-y-2 text-sm text-[#3f5778]">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="sortBy" checked={sortBy === 'price'} onChange={() => setSortBy('price')} />
                    Price - Low to High
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="sortBy" checked={sortBy === 'departure'} onChange={() => setSortBy('departure')} />
                    Departure Time
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="sortBy" checked={sortBy === 'duration'} onChange={() => setSortBy('duration')} />
                    Duration
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="sortBy" checked={sortBy === 'rating'} onChange={() => setSortBy('rating')} />
                    Rating
                  </label>
                </div>
              </StyledCard>

              <StyledCard hover={false} className="!p-4">
                <p className="text-xs font-bold uppercase text-[#8ca4c4] mb-3">Amenities</p>
                <div className="space-y-2 text-sm text-[#3f5778]">
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Air Conditioning</label>
                  <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> USB Charging</label>
                  <label className="flex items-center gap-2"><input type="checkbox" /> WiFi</label>
                  <label className="flex items-center gap-2"><input type="checkbox" /> Reclining Seats</label>
                </div>
              </StyledCard>

              <StyledCard hover={false} className="!p-4">
                <p className="text-xs font-bold uppercase text-[#8ca4c4] mb-3">Price Range (UGX)</p>
                <input
                  type="range"
                  min={minPrice}
                  max={80000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs font-semibold text-[#425d83] mt-2">
                  <span>{minPrice.toLocaleString()}</span>
                  <span>{maxPrice.toLocaleString()}</span>
                </div>
              </StyledCard>
            </aside>

            <main className="space-y-4">
              {loading && (
                <StyledCard hover={false} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D9A3] mx-auto" />
                  <p className="text-sm text-[#6f86a7] mt-3">Loading routes...</p>
                </StyledCard>
              )}

              {!loading && filteredRoutes.length === 0 && (
                <StyledCard hover={false} className="text-center py-12">
                  <p className="text-xl font-bold text-[#3f5778] mb-2">No routes available</p>
                  <p className="text-sm text-[#8ca4c4]">Try another date or destination.</p>
                </StyledCard>
              )}

              {!loading && filteredRoutes.map((route: any) => (
                <StyledCard key={route.id} hover={false} className="!p-0 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-[4px_1fr]">
                    <div className="bg-[#00a878]" />
                    <div className="p-5 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr_1fr_auto] gap-4 items-center">
                      <div>
                        <div className="flex items-start gap-3">
                          <OperatorLogoBadge operator={route?.operator || route?.operatorInfo} size="lg" />
                          <div>
                            <h3 className="text-2xl font-black text-[#132742]">{route.operator?.companyName || route.operatorInfo?.companyName || route.operatorName || 'Operator'}</h3>
                            <p className="text-xs text-[#8ca4c4] flex items-center gap-1"><Star className="h-3 w-3 text-[#f59e0b]" />4.7 • 203 reviews</p>
                            <div className="flex gap-2 mt-2">
                              <span className="px-2 py-0.5 rounded-full bg-[#eafaf5] text-[#0f8c6b] text-xs font-semibold">AC</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#f2ebff] text-[#7c3aed] text-xs font-semibold">USB</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#edf3ff] text-[#214c86] text-xs font-semibold">Mercedes</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-3">
                          <p className="text-5xl font-black text-[#132742]">{route.departureTime || '08:00'}</p>
                          <p className="text-5xl font-black text-[#132742]">{route.arrivalTime || '14:30'}</p>
                        </div>
                        <p className="text-xs text-[#8ca4c4]">{route.origin} • {route.destination}</p>
                        <p className="text-xs text-[#0f8c6b] font-semibold mt-1">{Math.floor((route.duration || 360) / 60)}h {(route.duration || 360) % 60}m • Direct</p>
                      </div>

                      <div className="text-right xl:text-left">
                        <p className="text-6xl font-black text-[#0f8c6b]">{Number(route.price || 0).toLocaleString()}</p>
                        <p className="text-xs uppercase text-[#8ca4c4]">UGX per seat</p>
                        <p className="text-xs text-[#8ca4c4] mt-2">{route.availability?.availableSeats || 15} seats available</p>
                      </div>

                      <Link href={`/route/${route.id}`}>
                        <StyledButton variant="primary" className="!px-6 !py-3">View Details</StyledButton>
                      </Link>
                    </div>
                  </div>
                </StyledCard>
              ))}
            </main>
          </div>
        </Container>
      </Section>
      <PortalFooter slim />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D9A3]" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
