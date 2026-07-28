import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import PlayStoreCTA from '@/components/PlayStoreCTA';
import { Container, Section, Badge, Heading, Lead, StyledCard } from '@/components/styled';
import { Compass, ShieldCheck, Sparkles, Users } from 'lucide-react';

const principles = [
  {
    icon: ShieldCheck,
    title: 'Trustworthy',
    description: 'Reliable booking, transparent pricing, and secure digital tickets on every trip.'
  },
  {
    icon: Sparkles,
    title: 'Innovative',
    description: 'Smart route discovery and real-time updates built for modern African mobility.'
  },
  {
    icon: Users,
    title: 'Connected',
    description: 'A platform that links travellers, operators, and communities in one network.'
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />

      <Section variant="light" className="pt-12 pb-8">
        <Container>
          <Badge className="!bg-[#e8f2ff] !text-[#2f6faa] border border-[#cce0fb] mb-4">About TransConnect</Badge>
          <Heading as="h1" className="text-[#13263f] mb-4">Connecting journeys. Building the future.</Heading>
          <Lead className="text-[#5f789a] max-w-3xl">
            TransConnect is a transport technology platform helping people book intercity trips quickly and safely.
            We design mobility products that make travel more accessible, reliable, and digital-first.
          </Lead>

          <div className="mt-8 rounded-2xl p-6 md:p-8 text-white" style={{ background: 'linear-gradient(120deg, #2368aa 0%, #1f4f83 55%, #0f1b2a 100%)' }}>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9fd7ff] mb-3">Official Tagline</p>
            <p className="text-2xl md:text-3xl font-black">"Connecting Journeys. Building the Future."</p>
          </div>
        </Container>
      </Section>

      <Section variant="gray" className="py-8">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {principles.map((item) => (
              <StyledCard key={item.title} hover={false} className="!p-6">
                <div className="h-12 w-12 rounded-xl bg-[#eaf3ff] text-[#2f6faa] flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-[#13263f] mb-2">{item.title}</h2>
                <p className="text-sm text-[#5f789a]">{item.description}</p>
              </StyledCard>
            ))}
          </div>

          <StyledCard hover={false} className="!p-6 md:!p-8 mt-5">
            <div className="flex items-start gap-3 mb-4">
              <Compass className="h-5 w-5 text-[#0f8c6b] mt-0.5" />
              <div>
                <h3 className="text-xl font-bold text-[#13263f]">Our Mission</h3>
                <p className="text-[#5f789a] mt-2">
                  To design and deploy transportation technology that seamlessly connects people to places,
                  while enabling inclusive mobility for growing communities.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <PlayStoreCTA />
              <Link href="/search" className="inline-flex items-center rounded-xl border border-[#d2e1f4] px-5 py-3 text-sm font-semibold text-[#284b73] hover:bg-[#f4f8ff]">Start booking now</Link>
            </div>
          </StyledCard>
        </Container>
      </Section>

      <PortalFooter />
    </div>
  );
}
