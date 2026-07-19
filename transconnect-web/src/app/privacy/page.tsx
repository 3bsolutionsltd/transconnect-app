import React from 'react';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import { Container, Section, Badge, Heading, StyledCard } from '@/components/styled';

const items = [
  {
    title: 'What We Collect',
    body: 'Basic account details, booking data, payment references, and optional location data used for trip services.'
  },
  {
    title: 'How We Use Data',
    body: 'To deliver bookings, process payments, send updates, improve reliability, and provide support.'
  },
  {
    title: 'Who We Share With',
    body: 'Bus operators for trip fulfillment and trusted service providers that support payments, hosting, and notifications.'
  },
  {
    title: 'Your Choices',
    body: 'You can update profile details, opt out of marketing notifications, and request account/data changes through support.'
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />
      <Section variant="light" className="pt-12 pb-8">
        <Container>
          <Badge className="!bg-[#e8f2ff] !text-[#2f6faa] border border-[#cce0fb] mb-4">Privacy Policy</Badge>
          <Heading as="h1" className="text-[#13263f] mb-3">Your privacy matters at TransConnect</Heading>
          <p className="text-[#5f789a] max-w-3xl">This page gives a readable summary of how we handle personal information across our web and mobile services.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {items.map((item) => (
              <StyledCard key={item.title} hover={false} className="!p-6">
                <h2 className="text-xl font-bold text-[#13263f] mb-2">{item.title}</h2>
                <p className="text-sm text-[#5f789a]">{item.body}</p>
              </StyledCard>
            ))}
          </div>

          <StyledCard hover={false} className="!p-6 mt-5">
            <p className="text-sm text-[#5f789a]">
              Full legal policy: <a className="text-[#2f6faa] font-semibold hover:underline" href="/privacy-policy.html">Read complete Privacy Policy</a>
            </p>
          </StyledCard>
        </Container>
      </Section>
      <PortalFooter />
    </div>
  );
}
