import React from 'react';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import PlayStoreCTA from '@/components/PlayStoreCTA';
import { Container, Section, Badge, Heading, StyledCard } from '@/components/styled';
import { COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_PHONE } from '@/lib/links';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />
      <Section variant="light" className="pt-12 pb-8">
        <Container>
          <Badge className="!bg-[#e8f2ff] !text-[#2f6faa] border border-[#cce0fb] mb-4">Contact TransConnect</Badge>
          <Heading as="h1" className="text-[#13263f] mb-3">Support and company contacts</Heading>
          <p className="text-[#5f789a] max-w-3xl">For booking support, account issues, and partnership requests, contact our team through the channels below.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <StyledCard hover={false} className="!p-6">
              <Mail className="h-5 w-5 text-[#2f6faa] mb-2" />
              <h2 className="text-lg font-bold text-[#13263f] mb-1">Email</h2>
              <a className="text-sm text-[#2f6faa] font-semibold hover:underline" href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
            </StyledCard>
            <StyledCard hover={false} className="!p-6">
              <Phone className="h-5 w-5 text-[#2f6faa] mb-2" />
              <h2 className="text-lg font-bold text-[#13263f] mb-1">Phone</h2>
              <a className="text-sm text-[#2f6faa] font-semibold hover:underline" href={`tel:${COMPANY_PHONE.replace(/\s+/g, '')}`}>{COMPANY_PHONE}</a>
            </StyledCard>
            <StyledCard hover={false} className="!p-6">
              <MapPin className="h-5 w-5 text-[#2f6faa] mb-2" />
              <h2 className="text-lg font-bold text-[#13263f] mb-1">Office</h2>
              <p className="text-sm text-[#5f789a]">{COMPANY_ADDRESS}</p>
            </StyledCard>
          </div>

          <StyledCard hover={false} className="!p-6 mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#13263f]">Travel better with the mobile app</h3>
              <p className="text-sm text-[#5f789a]">Get faster booking, QR tickets, and real-time updates from your phone.</p>
            </div>
            <PlayStoreCTA />
          </StyledCard>
        </Container>
      </Section>
      <PortalFooter />
    </div>
  );
}
