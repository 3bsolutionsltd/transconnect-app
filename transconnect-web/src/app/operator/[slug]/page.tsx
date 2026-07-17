"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Users,
  Bus,
  TrendingUp,
  Award,
  Star,
  Search,
  CheckCircle2,
  Shield,
  CreditCard,
  Headphones,
} from "lucide-react";

// Fixed teal color for all operators
const TEAL_COLOR = "#00D9A3";

// Types
interface Operator {
  id: string;
  companyName: string;
  license: string;
  approved: boolean;
  slug: string;
  brandLogoUrl: string | null;
  brandColor: string | null;
  heroImageUrl: string | null;
  tagline: string | null;
  description: string | null;
  portalEnabled: boolean;
  contact: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  stats: {
    totalBuses: number;
    activeRoutes: number;
    totalTripsCompleted: number;
    yearsInOperation: number;
  };
  routes: Route[];
  buses: BusData[];
}

interface Route {
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

interface BusData {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  operator: Operator;
}

export default function OperatorPortalPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");

  useEffect(() => {
    if (!slug) return;

    async function fetchOperatorData() {
      try {
        setLoading(true);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${apiBaseUrl}/operator-portal/slug/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Operator not found or portal not enabled");
          }
          throw new Error("Failed to load operator data");
        }

        const data: ApiResponse = await response.json();
        setOperator(data.operator);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchOperatorData();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D9A3]"></div>
      </div>
    );
  }

  // Error state
  if (error || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error || "Operator not found"}</p>
          <Link href="/">
            <Button style={{ backgroundColor: TEAL_COLOR }}>Go to TransConnect Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get popular routes (first 6)
  const popularRoutes = operator.routes.filter(r => r.active).slice(0, 6);

  // Get hero image or default
  const heroImage = operator.heroImageUrl || "/images/default-hero.jpg";

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {operator.brandLogoUrl && (
                <Image
                  src={operator.brandLogoUrl}
                  alt={`${operator.companyName} logo`}
                  width={50}
                  height={50}
                  className="rounded-lg"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{operator.companyName}</h1>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-gray-300">
                All Operators
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section
        className="relative h-[500px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`,
        }}
      >
        <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h2 className="text-5xl font-bold text-white mb-4">{operator.companyName}</h2>
          {operator.tagline && <p className="text-2xl text-white mb-8 opacity-90">{operator.tagline}</p>}

          {/* Search Box */}
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <input
                  type="text"
                  placeholder="Departure city"
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <input
                  type="text"
                  placeholder="Arrival city"
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full py-3 text-white font-semibold"
                  style={{ backgroundColor: TEAL_COLOR }}
                  onClick={() => {
                    if (searchFrom && searchTo) {
                      window.location.href = `/?origin=${encodeURIComponent(searchFrom)}&destination=${encodeURIComponent(
                        searchTo
                      )}&date=${searchDate}`;
                    }
                  }}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Buses
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 border-b border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <MapPin className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{operator.stats.activeRoutes}</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Routes Served</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Bus className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{operator.stats.totalBuses}</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Modern Buses</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{operator.stats.totalTripsCompleted}K+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Happy Passengers</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Star className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">4.8</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Popular Routes</h2>
            <p className="text-gray-600">Explore our most traveled destinations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularRoutes.map((route) => (
              <Card key={route.id} className="hover:shadow-xl transition-shadow border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {route.origin} → {route.destination}
                    </CardTitle>
                    <div className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: TEAL_COLOR }}>
                      UGX {route.price.toLocaleString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm">{route.duration} hours journey</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm">Departs: {route.departureTime}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Bus className="w-4 h-4 mr-2" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm">{route.bus.model} ({route.bus.capacity} seats)</span>
                    </div>
                  </div>
                  <Link
                    href={`/?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(
                      route.destination
                    )}`}
                  >
                    <Button className="w-full text-white font-semibold" style={{ backgroundColor: TEAL_COLOR }}>
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {operator.routes.length > 6 && (
            <div className="text-center mt-8">
              <Link href={`/?operator=${operator.companyName}`}>
                <Button variant="outline" className="border-2" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>
                  View All {operator.routes.length} Routes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Book Direct Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Book Direct with {operator.companyName}?</h2>
            <p className="text-gray-600">Experience the best in bus travel</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${TEAL_COLOR}20` }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Guaranteed Seats</h3>
              <p className="text-sm text-gray-600">Your seat is reserved and confirmed</p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${TEAL_COLOR}20` }}
              >
                <CreditCard className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-gray-600">Multiple payment options available</p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${TEAL_COLOR}20` }}
              >
                <Shield className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety First</h3>
              <p className="text-sm text-gray-600">Licensed drivers and insured vehicles</p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${TEAL_COLOR}20` }}
              >
                <Headphones className="w-8 h-8" style={{ color: TEAL_COLOR }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">We're here to help anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      {operator.description && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">About {operator.companyName}</h2>
                <div className="w-20 h-1 mx-auto rounded-full" style={{ backgroundColor: TEAL_COLOR }}></div>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg text-center">{operator.description}</p>
              <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Award className="w-5 h-5 mr-2" style={{ color: TEAL_COLOR }} />
                  <span>Licensed Operator</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" style={{ color: TEAL_COLOR }} />
                  <span>{operator.stats.yearsInOperation}+ Years Experience</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Fleet Section */}
      {operator.buses && operator.buses.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Fleet</h2>
              <p className="text-gray-600">Modern, comfortable buses for your journey</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {operator.buses.slice(0, 8).map((bus) => (
                <Card key={bus.id} className="text-center border-gray-200">
                  <CardContent className="pt-8 pb-8">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${TEAL_COLOR}20` }}
                    >
                      <Bus className="w-8 h-8" style={{ color: TEAL_COLOR }} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{bus.model}</h3>
                    <p className="text-sm text-gray-600 mb-2">{bus.plateNumber}</p>
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{bus.capacity} seats</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Get In Touch</h2>
            <p className="text-gray-600">Have questions? We're here to help</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center border-gray-200">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${TEAL_COLOR}20` }}>
                  <Phone className="w-7 h-7" style={{ color: TEAL_COLOR }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600">{operator.contact.phone || "Not available"}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-gray-200">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${TEAL_COLOR}20` }}>
                  <Mail className="w-7 h-7" style={{ color: TEAL_COLOR }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 break-all">{operator.contact.email || "Not available"}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-gray-200">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${TEAL_COLOR}20` }}>
                  <Users className="w-7 h-7" style={{ color: TEAL_COLOR }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Manager</h3>
                <p className="text-gray-600">{operator.contact.name}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-4">
              <span className="text-gray-400">Powered by </span>
              <span className="font-bold" style={{ color: TEAL_COLOR }}>
                TransConnect
              </span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {operator.companyName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
