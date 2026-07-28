import React from 'react';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import { Container, Section, Badge, Heading, StyledCard } from '@/components/styled';

const termPoints = [
  'You must provide accurate registration information and keep your account secure.',
  'Ticket purchases are contracts with transport operators; TransConnect provides the booking platform.',
  'Refund and cancellation outcomes may vary by operator policy and booking timing.',
  'Fraud, abuse, scraping, and platform misuse are prohibited and may lead to account suspension.'
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />
      <Section variant="light" className="pt-12 pb-8">
        <Container>
          <Badge className="!bg-[#e8f2ff] !text-[#2f6faa] border border-[#cce0fb] mb-4">Terms of Service</Badge>
          <Heading as="h1" className="text-[#13263f] mb-3">Terms for using TransConnect</Heading>
          <p className="text-[#5f789a] max-w-3xl">These terms explain account responsibilities, booking conditions, and fair use of our services.</p>

          <StyledCard hover={false} className="!p-6 mt-8">
            <ol className="list-decimal pl-5 space-y-3 text-sm text-[#5f789a]">
              {termPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ol>
          </StyledCard>

          <StyledCard hover={false} className="!p-6 mt-5">
            <p className="text-sm text-[#5f789a]">
              Full legal terms: <a className="text-[#2f6faa] font-semibold hover:underline" href="/terms-of-service.html">Read complete Terms of Service</a>
            </p>
          </StyledCard>
        </Container>
      </Section>
      <PortalFooter />
    </div>
  );
}
