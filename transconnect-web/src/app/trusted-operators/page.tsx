'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Bus, MapPin, Search, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import { Badge, Container, Heading, Section, StyledCard, StyledButton } from '@/components/styled';
import { fetchRoutes } from '@/lib/api';
import { deriveTrustedOperators, TrustedOperator } from '@/lib/trustedOperators';

export default function TrustedOperatorsPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [operators, setOperators] = useState<TrustedOperator[]>([]);
  const [totalRoutes, setTotalRoutes] = useState(0);

  useEffect(() => {
    async function loadTrustedOperators() {
      try {
        const routes = await fetchRoutes();
        setTotalRoutes(Array.isArray(routes) ? routes.length : 0);
        setOperators(deriveTrustedOperators(routes || []));
      } catch (error) {
        console.error('Failed to load operators from routes:', error);
        setOperators([]);
      } finally {
        setLoading(false);
      }
    }

    loadTrustedOperators();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return operators;
    return operators.filter((op) => op.name.toLowerCase().includes(term));
  }, [operators, query]);

  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />

      <Section variant="light" className="pt-10 pb-8 border-b border-[#e6eef9]">
        <Container>
          <Badge className="!bg-[#e9fbf5] !text-[#0f8c6b] border border-[#c9f0e4] mb-4">Verified Network</Badge>
          <Heading as="h1" className="text-[#14263f] mb-3">Trusted Bus Operators</Heading>
          <p className="text-[#6f86a7] max-w-3xl">
            Browse operators currently onboarded and actively serving routes on TransConnect.
            This list is generated from live route inventory.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StyledCard hover={false} className="!p-4 text-center">
              <p className="text-2xl font-black text-[#214c86]">{operators.length}</p>
              <p className="text-xs text-[#8ca4c4] uppercase">Operators</p>
            </StyledCard>
            <StyledCard hover={false} className="!p-4 text-center">
              <p className="text-2xl font-black text-[#0f8c6b]">{totalRoutes}</p>
              <p className="text-xs text-[#8ca4c4] uppercase">Active Routes</p>
            </StyledCard>
            <StyledCard hover={false} className="!p-4 text-center">
              <p className="text-2xl font-black text-[#214c86]">100%</p>
              <p className="text-xs text-[#8ca4c4] uppercase">Verified Listings</p>
            </StyledCard>
            <StyledCard hover={false} className="!p-4 text-center">
              <p className="text-2xl font-black text-[#0f8c6b]">24/7</p>
              <p className="text-xs text-[#8ca4c4] uppercase">Service Window</p>
            </StyledCard>
          </div>

          <div className="mt-6 max-w-md relative">
            <Search className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search operator name"
              className="tc-input !pl-9 !py-3"
            />
          </div>
        </Container>
      </Section>

      <Section variant="gray" className="pt-6 pb-10">
        <Container>
          {loading ? (
            <div className="text-center py-14 text-[#6f86a7]">Loading trusted operators...</div>
          ) : filtered.length === 0 ? (
            <StyledCard hover={false} className="!p-8 text-center">
              <Building2 className="h-10 w-10 mx-auto text-[#9bb0cc] mb-3" />
              <h2 className="text-xl font-bold text-[#14263f] mb-2">No operators found</h2>
              <p className="text-[#6f86a7]">Try a different search term, or check back as new operators are onboarded.</p>
            </StyledCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((operator) => (
                <StyledCard key={operator.name} hover={false} className="!p-5 border border-[#e7edf8]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#14263f]">{operator.name}</h3>
                      <p className="text-xs text-[#8ca4c4] mt-1">Example route: {operator.sampleRoute}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e9fbf5] px-3 py-1 text-xs font-semibold text-[#0f8c6b]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl bg-[#f3f7fe] p-3 text-center">
                      <Bus className="h-4 w-4 mx-auto text-[#214c86] mb-1" />
                      <p className="text-base font-black text-[#214c86]">{operator.activeRoutes}</p>
                      <p className="text-[10px] text-[#8ca4c4] uppercase">Routes</p>
                    </div>
                    <div className="rounded-xl bg-[#f3f7fe] p-3 text-center">
                      <MapPin className="h-4 w-4 mx-auto text-[#214c86] mb-1" />
                      <p className="text-base font-black text-[#214c86]">{operator.destinationsServed}</p>
                      <p className="text-[10px] text-[#8ca4c4] uppercase">Cities</p>
                    </div>
                    <div className="rounded-xl bg-[#f0fbf7] p-3 text-center">
                      <p className="text-base font-black text-[#0f8c6b]">UGX {operator.minPrice.toLocaleString()}</p>
                      <p className="text-[10px] text-[#8ca4c4] uppercase">From</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6f86a7] mb-3">
                    <span>Avg fare: UGX {operator.avgPrice.toLocaleString()}</span>
                    <span>Top fare: UGX {operator.maxPrice.toLocaleString()}</span>
                  </div>

                  <Link href="/search" className="block">
                    <StyledButton variant="primary" className="w-full !py-2.5">View Routes</StyledButton>
                  </Link>
                </StyledCard>
              ))}
            </div>
          )}

          <div className="text-center mt-7">
            <Link href="/search" className="text-sm font-semibold text-[#214c86] hover:underline">
              Explore all available routes &rarr;
            </Link>
          </div>
        </Container>
      </Section>

      <PortalFooter />
    </div>
  );
}
