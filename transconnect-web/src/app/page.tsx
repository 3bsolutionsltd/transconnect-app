'use client';

import Link from 'next/link';
import { Bus, Calendar, Clock3, CreditCard, MapPin, QrCode, Search, Shield, Smartphone, Users } from 'lucide-react';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section, Container, Heading, Lead, StyledCard, StyledButton, Badge } from '@/components/styled';
import PortalFooter from '@/components/PortalFooter';
import PlayStoreCTA from '@/components/PlayStoreCTA';
import TransConnectLogo from '@/components/branding/TransConnectLogo';
import { trackEvent } from '@/lib/analytics';
import { fetchRoutes } from '@/lib/api';
import { deriveTrustedOperators, TrustedOperator } from '@/lib/trustedOperators';

export default function HomePage() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [activeGuideStep, setActiveGuideStep] = useState(0);
  const [trustedOperators, setTrustedOperators] = useState<TrustedOperator[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  function handleSearch() {
    trackEvent('hero_search_click', {
      source: 'hero_primary_cta',
      hasOrigin: Boolean(origin),
      hasDestination: Boolean(destination),
      hasTravelDate: Boolean(travelDate),
      passengers,
    });

    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (origin) params.set('origin', origin);
    if (travelDate) params.set('date', travelDate);
    params.set('passengers', String(passengers));
    router.push(`/search?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  const tabs = ['Intercity', 'Local Ride', 'Stay', 'Explore'];

  const popular = [
    { text: 'Kampala -> Gulu', dest: 'Gulu', orig: 'Kampala' },
    { text: 'Kampala -> Mbarara', dest: 'Mbarara', orig: 'Kampala' },
    { text: 'Kampala -> Jinja', dest: 'Jinja', orig: 'Kampala' },
    { text: 'Kampala -> Mbale', dest: 'Mbale', orig: 'Kampala' },
    { text: 'Entebbe -> Kampala', dest: 'Kampala', orig: 'Entebbe' },
  ];

  const trustCards = [
    {
      icon: Clock3,
      title: 'Book Anytime',
      desc: '24/7 booking with instant confirmation and digital tickets on your phone.',
    },
    {
      icon: Shield,
      title: 'Secure Digital Tickets',
      desc: 'Safe payments and QR code tickets for contactless, stress-free boarding.',
    },
    {
      icon: CreditCard,
      title: 'Mobile Money',
      desc: 'Pay with MTN MoMo or Airtel Money with transparent pricing and no surprises.',
    },
    {
      icon: Smartphone,
      title: 'Ticket on Your Phone',
      desc: 'Your QR ticket stays available on your phone so boarding is always quick.',
    },
  ];

  const topRoutes = [
    { route: 'Kampala -> Gulu', price: '50K', time: '6h 30m', departure: '08:00 AM', seats: '16 seats left' },
    { route: 'Kampala -> Mbarara', price: '35K', time: '3h 45m', departure: '09:30 AM', seats: '22 seats left' },
    { route: 'Kampala -> Jinja', price: '20K', time: '1h 30m', departure: 'Every 1h', seats: 'Many operators' },
  ];

  const guideSteps = [
    {
      icon: Search,
      title: 'Search your route',
      detail: 'Pick origin, destination, date, and number of passengers in seconds.'
    },
    {
      icon: CreditCard,
      title: 'Pay securely',
      detail: 'Use MTN MoMo or Airtel Money with instant booking confirmation.'
    },
    {
      icon: QrCode,
      title: 'Board with QR ticket',
      detail: 'Show your digital ticket on your phone and travel without printing.'
    }
  ];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveGuideStep((prev) => (prev + 1) % guideSteps.length);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [guideSteps.length]);

  useEffect(() => {
    async function loadTrustedOperators() {
      try {
        const routes = await fetchRoutes();
        setTrustedOperators(deriveTrustedOperators(routes || []).slice(0, 6));
      } catch (error) {
        console.error('Failed to load trusted operators:', error);
        setTrustedOperators([]);
      } finally {
        setOperatorsLoading(false);
      }
    }

    loadTrustedOperators();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f8fe]">
      <Header />

      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(13,27,42,0.84), rgba(13,27,42,0.6)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container className="pt-10 pb-40 md:pt-14 md:pb-44">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            <div className="max-w-2xl text-white">
              <Badge className="!bg-[#00b7d7]/20 !text-[#46e4ff] border border-[#3ad8ef]/30 mb-5">East Africa's #1 Transport Platform</Badge>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight mb-5">
                Your Journey
                <br />
                <span className="text-[#57e0be]">Starts Here.</span>
              </h1>
              <p className="text-lg text-[#d6e3f6] max-w-xl mb-8">
                Book intercity buses across Uganda in seconds. Secure digital tickets, real-time seat availability, and trusted mobile money payments.
              </p>

              <div className="flex flex-wrap gap-3">
                <StyledButton variant="primary" className="!px-7 !py-3.5" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Routes
                </StyledButton>
                <PlayStoreCTA source="home_hero_primary" />
                <Link
                  href="/bookings"
                  onClick={() => trackEvent('hero_bookings_click', { source: 'hero_primary_cta' })}
                  className="inline-flex items-center rounded-xl border border-white/40 px-6 py-3.5 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  My Bookings
                </Link>
              </div>
            </div>

            <div className="hidden lg:block rounded-2xl border border-white/20 bg-[#0d1b2a]/45 backdrop-blur-md p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8dd9ff] font-bold mb-2">How to use TransConnect</p>
              <h3 className="text-2xl font-black text-white mb-4">From search to boarding</h3>

              <div className="space-y-3">
                {guideSteps.map((step, index) => {
                  const isActive = index === activeGuideStep;

                  return (
                    <div
                      key={step.title}
                      onClick={() => {
                        setActiveGuideStep(index);
                        trackEvent('hero_guide_step_click', {
                          stepIndex: index + 1,
                          stepTitle: step.title,
                        });
                      }}
                      className={`rounded-xl border p-3 transition-all duration-500 cursor-pointer ${isActive ? 'border-[#57e0be] bg-[#103453]/90 shadow-[0_0_0_1px_rgba(87,224,190,0.25)]' : 'border-white/10 bg-[#0f243a]/60'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#57e0be] text-[#123152]' : 'bg-[#1c3958] text-[#9ec5e8]'}`}>
                          <step.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-[#d2e2f3]'}`}>{index + 1}. {step.title}</p>
                          <p className={`text-xs mt-1 ${isActive ? 'text-[#bfe0ff]' : 'text-[#9db6d2]'}`}>{step.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#57e0be] transition-all duration-500"
                  style={{ width: `${((activeGuideStep + 1) / guideSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </Container>

        <Container className="relative -mt-28 pb-10">
          <StyledCard variant="elevated" className="!p-0 overflow-hidden" hover={false}>
            <div className="px-6 pt-5 pb-4 border-b border-[#e7edf7]">
              <div className="flex flex-wrap gap-3 text-sm">
                {tabs.map((tab, index) => (
                  <button key={tab} type="button" className={`px-1 pb-2 font-semibold ${index === 0 ? 'text-[#0f8c6b] border-b-2 border-[#00D9A3]' : 'text-[#8ca4c4]'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="relative md:col-span-1">
                  <MapPin className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Kampala"
                    className="tc-input !py-3 !pl-9"
                  />
                </div>
                <div className="relative md:col-span-1">
                  <MapPin className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Gulu"
                    className="tc-input !py-3 !pl-9"
                  />
                </div>
                <div className="relative md:col-span-1">
                  <Calendar className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="date" value={travelDate} min={today} onChange={(e) => setTravelDate(e.target.value)} className="tc-input !py-3 !pl-9" />
                </div>
                <div className="relative md:col-span-1">
                  <Users className="h-4 w-4 text-[#8ca4c4] absolute left-3 top-1/2 -translate-y-1/2" />
                  <div className="tc-input !py-3 !pl-9 flex items-center justify-between">
                    <span>{passengers} Passenger</span>
                    <div className="flex items-center gap-2">
                      <button type="button" className="font-bold" onClick={() => setPassengers((p) => Math.max(1, p - 1))}>-</button>
                      <button type="button" className="font-bold" onClick={() => setPassengers((p) => p + 1)}>+</button>
                    </div>
                  </div>
                </div>
                <StyledButton variant="primary" className="w-full !px-4 !py-3" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Routes
                </StyledButton>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-[11px] uppercase font-semibold text-[#8ca4c4]">Popular:</span>
                {popular.map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#eef3fb] text-[#28456f] hover:bg-[#e4ecf8]"
                    onClick={() => {
                      setOrigin(item.orig);
                      setDestination(item.dest);
                    }}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          </StyledCard>
        </Container>
      </section>

      <Section variant="gray" className="pt-6 pb-8">
        <Container>
          <div className="text-center mb-8">
            <Badge className="!bg-[#e9fbf5] !text-[#0f8c6b] border border-[#c9f0e4] mb-4">Why TransConnect</Badge>
            <Heading as="h2" className="text-[#14263f] mb-3">Everything you need to travel smarter</Heading>
            <Lead className="text-[#6f86a7] text-base max-w-xl mx-auto">Built for Uganda's roads. Trusted by thousands of daily travellers across East Africa.</Lead>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {trustCards.map((item) => (
              <StyledCard key={item.title} hover={false} className="!p-5">
                <div className="h-12 w-12 rounded-xl bg-[#ecf4ff] text-[#214c86] flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#14263f] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6f86a7] leading-relaxed">{item.desc}</p>
              </StyledCard>
            ))}
          </div>

          <div className="flex items-end justify-between mb-5">
            <div>
              <Heading as="h3" className="text-[#14263f]">Onboarded Operators You Can Trust</Heading>
              <p className="text-sm text-[#8ca4c4]">Generated from live active routes in the system</p>
            </div>
            <Link
              href="/trusted-operators"
              className="text-sm font-semibold text-[#214c86]"
              onClick={() => trackEvent('trusted_operators_view_all_click', { source: 'home_section' })}
            >
              View All Operators -&gt;
            </Link>
          </div>

          {operatorsLoading ? (
            <div className="mb-10 text-center text-[#6f86a7]">Loading onboarded operators...</div>
          ) : trustedOperators.length === 0 ? (
            <StyledCard hover={false} className="!p-5 mb-10 text-center">
              <p className="text-[#6f86a7]">Operator confidence listing will appear as routes are published.</p>
            </StyledCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {trustedOperators.map((operator) => (
                <StyledCard key={operator.name} hover={false} className="!p-5 border border-[#e7edf8]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-xl font-bold text-[#14263f]">{operator.name}</h4>
                      <p className="text-xs text-[#8ca4c4]">{operator.sampleRoute}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#e9fbf5] px-3 py-1 text-xs font-semibold text-[#0f8c6b]">Verified</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#f3f7fe] p-3 text-center">
                      <p className="text-lg font-black text-[#214c86]">{operator.activeRoutes}</p>
                      <p className="text-[10px] text-[#8ca4c4] uppercase">Routes</p>
                    </div>
                    <div className="rounded-xl bg-[#f3f7fe] p-3 text-center">
                      <p className="text-lg font-black text-[#214c86]">{operator.destinationsServed}</p>
                      <p className="text-[10px] text-[#8ca4c4] uppercase">Cities</p>
                    </div>
                    <div className="rounded-xl bg-[#f0fbf7] p-3 text-center">
                      <p className="text-lg font-black text-[#0f8c6b]">{operator.minPrice ? `UGX ${operator.minPrice.toLocaleString()}` : '-'}</p>
                      <p className="text-[10px] text-[#8ca4c4] uppercase">From</p>
                    </div>
                  </div>
                </StyledCard>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between mb-5">
            <div>
              <Heading as="h3" className="text-[#14263f]">Top destinations this week</Heading>
              <p className="text-sm text-[#8ca4c4]">Most booked routes across Uganda</p>
            </div>
            <Link href="/search" className="text-sm font-semibold text-[#214c86]">View All Routes -&gt;</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {topRoutes.map((item) => (
              <StyledCard key={item.route} hover={false} className="!p-0 overflow-hidden">
                <div className="p-4 border-b border-[#e7edf7] flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-[#14263f]">{item.route}</h4>
                    <p className="text-xs text-[#8ca4c4]">Intercity bus - {item.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#0f8c6b]">{item.price}</p>
                    <p className="text-[10px] text-[#8ca4c4] uppercase">UGX</p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="text-xs text-[#6f86a7]">
                    <p>{item.departure}</p>
                    <p>{item.seats}</p>
                  </div>
                  <StyledButton variant="primary" size="sm" className="!px-4 !py-2" onClick={handleSearch}>Search</StyledButton>
                </div>
              </StyledCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section variant="light" className="py-0 pb-12">
        <Container>
          <div
            className="relative overflow-hidden rounded-3xl border border-white/15 p-7 md:p-10 text-white shadow-[0_20px_45px_rgba(8,26,52,0.28)]"
            style={{ background: 'linear-gradient(120deg, #1f3f72 0%, #165f78 55%, #0f8c6b 100%)' }}
          >
            <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#7ee8d0]/20 blur-3xl" />

            <div className="relative grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:gap-12 items-center">
              <div className="max-w-2xl">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <TransConnectLogo
                    usage="dark"
                    width={112}
                    height={32}
                    imageClassName="h-6"
                    wordmarkClassName="text-xl"
                  />
                  <Badge className="!bg-white/15 !text-[#7ee8d0] border border-white/25">Available on Android & iOS</Badge>
                </div>

                <h3 className="text-3xl sm:text-4xl lg:text-[2.9rem] leading-[1.03] font-black mb-4 [text-wrap:balance] max-w-[15ch]">Take TransConnect wherever you go</h3>
                <p className="text-[#d0def3] mb-6 max-w-xl text-base sm:text-lg">Manage bookings, view QR tickets, and track your bus in real-time from your pocket.</p>

                <div className="flex flex-wrap items-center gap-3">
                  <PlayStoreCTA compact source="home_app_section" className="min-w-[176px] justify-center" />
                  <span className="inline-flex h-10 items-center rounded-xl border border-white/30 px-4 text-sm font-semibold text-[#d0def3]">
                    iOS coming soon
                  </span>
                </div>
              </div>

              <div className="w-full max-w-xl lg:ml-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/15 bg-white/14 p-4 text-center backdrop-blur-sm">
                    <p className="text-4xl font-black leading-none">50K+</p>
                    <p className="mt-2 text-xs font-medium text-[#d0def3]">Happy Travellers</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/14 p-4 text-center backdrop-blur-sm">
                    <p className="text-4xl font-black leading-none">120+</p>
                    <p className="mt-2 text-xs font-medium text-[#d0def3]">Routes</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/14 p-4 text-center backdrop-blur-sm">
                    <p className="text-4xl font-black leading-none">4.8</p>
                    <p className="mt-2 text-xs font-medium text-[#d0def3]">App Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <PortalFooter />
    </div>
  );
}
