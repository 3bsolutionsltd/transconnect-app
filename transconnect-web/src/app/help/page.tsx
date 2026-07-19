import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import { Container, Section, Badge, Heading, StyledCard } from '@/components/styled';

const faqs = [
  {
    q: 'How do I book a bus ticket?',
    a: 'Go to Search Routes, pick your route and date, select your seat, then pay with supported payment methods.'
  },
  {
    q: 'Where can I find my ticket?',
    a: 'After payment, your QR ticket is available in My Bookings and can be shown directly from your phone.'
  },
  {
    q: 'Can I transfer a booking?',
    a: 'Yes. Use the transfer flow from your bookings page to send an eligible ticket to another passenger.'
  },
  {
    q: 'How do refunds work?',
    a: 'Refund rules are controlled by each operator and by departure timing. Contact support for case-specific help.'
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />
      <Section variant="light" className="pt-12 pb-8">
        <Container>
          <Badge className="!bg-[#e9fbf5] !text-[#0f8c6b] border border-[#c9f0e4] mb-4">Help Centre</Badge>
          <Heading as="h1" className="text-[#13263f] mb-3">How can we help you today?</Heading>
          <p className="text-[#5f789a] max-w-3xl">Quick answers for account setup, booking, ticketing, and travel support.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {faqs.map((faq) => (
              <StyledCard key={faq.q} hover={false} className="!p-6">
                <h2 className="text-lg font-bold text-[#13263f] mb-2">{faq.q}</h2>
                <p className="text-sm text-[#5f789a]">{faq.a}</p>
              </StyledCard>
            ))}
          </div>

          <StyledCard hover={false} className="!p-6 mt-5">
            <p className="text-sm text-[#5f789a]">Still need help? Reach our team via <Link href="/contact" className="text-[#2f6faa] font-semibold hover:underline">Contact Support</Link>.</p>
          </StyledCard>
        </Container>
      </Section>
      <PortalFooter />
    </div>
  );
}
