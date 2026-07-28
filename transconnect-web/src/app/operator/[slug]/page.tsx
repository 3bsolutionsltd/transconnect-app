"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { Badge, Container, Heading, Lead, Section, StyledButton, StyledCard } from "@/components/styled";

const FALLBACK_COLOR = "#00D9A3";

interface OperatorRoute {
  id: string;
  origin: string;
  destination: string;
  duration: number;
  price: number;
  departureTime: string;
  active: boolean;
  bus: {
    plateNumber: string;
    model: string;
    capacity: number;
  };
}

interface OperatorBus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
}

interface OperatorData {
  id: string;
  companyName: string;
  slug: string;
  brandLogoUrl: string | null;
  brandColor: string | null;
  heroImageUrl: string | null;
  tagline: string | null;
  description: string | null;
  contact: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  stats: {
    totalBuses: number;
    activeRoutes: number;
    totalTripsCompleted?: number;
    yearsInOperation?: number | string;
  };
  routes: OperatorRoute[];
  buses: OperatorBus[];
}

interface OperatorResponse {
  success: boolean;
  operator: OperatorData;
}

export default function OperatorPortalPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [operator, setOperator] = useState<OperatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [travelDate, setTravelDate] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Invalid operator portal URL");
      return;
    }

    async function loadOperator() {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiBaseUrl}/operator-portal/slug/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Operator portal not found or not enabled");
          }
          throw new Error("Failed to load operator portal");
        }

        const data: OperatorResponse = await response.json();
        setOperator(data.operator);
      } catch (err: any) {
        setError(err?.message || "Failed to load operator portal");
      } finally {
        setLoading(false);
      }
    }

    loadOperator();
  }, [slug]);

  const primaryColor = operator?.brandColor || FALLBACK_COLOR;
  const heroImage = operator?.heroImageUrl || "/images/default-hero.jpg";
  const activeRoutes = useMemo(() => (operator?.routes || []).filter((route) => route.active), [operator]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: FALLBACK_COLOR }} />
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <StyledCard className="max-w-lg w-full text-center" hover={false}>
          <h1 className="tc-heading-3 text-gray-900 mb-3">Portal Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The operator portal is unavailable."}</p>
          <Link href="/" className="btn-primary inline-flex">Go to TransConnect Home</Link>
        </StyledCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(125deg, rgba(13,27,42,0.88), rgba(13,27,42,0.68)), url(${heroImage})`,
        }}
      >
        <Container className="py-8 sm:py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                {operator.brandLogoUrl ? (
                  <Image src={operator.brandLogoUrl} alt={operator.companyName} width={34} height={34} className="rounded-md object-cover" />
                ) : (
                  <Bus className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-white font-bold text-lg sm:text-xl">{operator.companyName}</h1>
                <p className="text-white/70 text-xs uppercase tracking-wide">Official Operator Portal</p>
              </div>
            </div>
            <Link href="/" className="text-white/90 text-sm hover:text-white underline">Powered by TransConnect</Link>
          </div>

          <Badge className="!bg-white/15 !text-white border border-white/25 mb-4" icon={<CheckCircle2 className="h-3 w-3" />}>
            Official Booking Portal
          </Badge>

          <Heading as="h2" className="text-white mb-4 max-w-3xl">Travel Uganda With {operator.companyName}</Heading>
          <Lead className="text-white/85 max-w-2xl mb-8 text-base sm:text-lg">
            {operator.tagline || "Book direct with your operator and get instant digital tickets with secure mobile money checkout."}
          </Lead>

          <StyledCard variant="elevated" className="max-w-6xl" hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="From (e.g. Kampala)"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="tc-input"
              />
              <input
                type="text"
                placeholder="To (e.g. Gulu)"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="tc-input"
              />
              <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="tc-input" />
              <StyledButton
                variant="primary"
                className="w-full"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (searchFrom) params.set("origin", searchFrom);
                  if (searchTo) params.set("destination", searchTo);
                  if (travelDate) params.set("date", travelDate);
                  params.set("operator", operator.companyName);
                  window.location.href = `/search?${params.toString()}`;
                }}
                style={{ backgroundColor: primaryColor }}
              >
                <Search className="h-4 w-4 mr-2" />
                Search Routes
              </StyledButton>
            </div>
          </StyledCard>
        </Container>
      </section>

      <Section variant="gray" className="py-10">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StyledCard hover={false} className="text-center !p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Routes</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: primaryColor }}>{operator.stats.activeRoutes || 0}</p>
            </StyledCard>
            <StyledCard hover={false} className="text-center !p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Fleet</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: primaryColor }}>{operator.stats.totalBuses || 0}</p>
            </StyledCard>
            <StyledCard hover={false} className="text-center !p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Trips</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: primaryColor }}>{operator.stats.totalTripsCompleted || 0}</p>
            </StyledCard>
            <StyledCard hover={false} className="text-center !p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500">Years</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: primaryColor }}>{operator.stats.yearsInOperation || "1+"}</p>
            </StyledCard>
          </div>
        </Container>
      </Section>

      <Section variant="light" className="py-14">
        <Container>
          <div className="flex items-center justify-between mb-6">
            <div>
              <Heading as="h3" className="text-gray-900">Available Routes</Heading>
              <p className="text-gray-600">Showing only {operator.companyName} routes and schedules.</p>
            </div>
          </div>

          {activeRoutes.length === 0 ? (
            <StyledCard className="text-center" hover={false}>
              <MapPin className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No active routes available at the moment.</p>
            </StyledCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRoutes.map((route) => (
                <StyledCard key={route.id} className="!p-0 overflow-hidden" hover>
                  <div className="px-5 py-4 text-white" style={{ backgroundColor: primaryColor }}>
                    <p className="font-bold text-lg">{route.origin} → {route.destination}</p>
                    <p className="text-sm text-white/90">Departs at {route.departureTime}</p>
                  </div>
                  <div className="p-5">
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {Math.floor(route.duration / 60)}h {route.duration % 60}m</div>
                      <div className="flex items-center gap-2"><Bus className="h-4 w-4" /> {route.bus.model} • {route.bus.capacity} seats</div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <p className="text-2xl font-extrabold" style={{ color: primaryColor }}>UGX {route.price.toLocaleString()}</p>
                      <Link href={`/route/${route.id}`} className="btn-primary !py-2 !px-4 text-sm">Book Now</Link>
                    </div>
                  </div>
                </StyledCard>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section variant="dark" className="py-14">
        <Container>
          <div className="text-center mb-8">
            <Badge className="!bg-white/10 !text-[#00D9A3] border border-white/15 mb-4">Why Book Direct</Badge>
            <Heading as="h3" className="text-white">Your Seat. Your Price. Your Journey.</Heading>
            <Lead className="text-blue-200 max-w-3xl mx-auto text-base">No middleman, transparent pricing, instant tickets, and trusted operator service.</Lead>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StyledCard variant="bordered" className="!bg-white/5 !border-white/15 text-white text-center" hover={false}>
              <p className="text-3xl font-extrabold" style={{ color: primaryColor }}>0%</p>
              <p className="font-semibold mt-2">Extra Booking Fee</p>
            </StyledCard>
            <StyledCard variant="bordered" className="!bg-white/5 !border-white/15 text-white text-center" hover={false}>
              <CheckCircle2 className="h-7 w-7 mx-auto" style={{ color: primaryColor }} />
              <p className="font-semibold mt-2">Instant E-Ticket</p>
            </StyledCard>
            <StyledCard variant="bordered" className="!bg-white/5 !border-white/15 text-white text-center" hover={false}>
              <Shield className="h-7 w-7 mx-auto" style={{ color: primaryColor }} />
              <p className="font-semibold mt-2">Safe & Verified</p>
            </StyledCard>
            <StyledCard variant="bordered" className="!bg-white/5 !border-white/15 text-white text-center" hover={false}>
              <CreditCard className="h-7 w-7 mx-auto" style={{ color: primaryColor }} />
              <p className="font-semibold mt-2">Mobile Money Ready</p>
            </StyledCard>
          </div>
        </Container>
      </Section>

      <Section variant="light" className="py-14">
        <Container>
          {operator.description && (
            <StyledCard className="mb-8" hover={false}>
              <Heading as="h4" className="text-gray-900 mb-3">About {operator.companyName}</Heading>
              <p className="text-gray-700 leading-relaxed">{operator.description}</p>
            </StyledCard>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <StyledCard hover={false}>
              <Phone className="h-5 w-5 mb-2" style={{ color: primaryColor }} />
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Phone</p>
              <p className="font-semibold text-gray-900">{operator.contact.phone || "Not available"}</p>
            </StyledCard>
            <StyledCard hover={false}>
              <Mail className="h-5 w-5 mb-2" style={{ color: primaryColor }} />
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Email</p>
              <p className="font-semibold text-gray-900 break-all">{operator.contact.email || "Not available"}</p>
            </StyledCard>
            <StyledCard hover={false}>
              <Users className="h-5 w-5 mb-2" style={{ color: primaryColor }} />
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Contact Person</p>
              <p className="font-semibold text-gray-900">{operator.contact.name || "Operator Team"}</p>
            </StyledCard>
          </div>
        </Container>
      </Section>

      <footer className="bg-[#0d1b2a] text-white py-8 border-t-2" style={{ borderColor: primaryColor }}>
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-slate-300">© {new Date().getFullYear()} {operator.companyName}. All rights reserved.</p>
            <p className="text-slate-400">
              Booking powered by <Link href="/" className="font-semibold hover:opacity-80" style={{ color: primaryColor }}>TransConnect</Link>
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
