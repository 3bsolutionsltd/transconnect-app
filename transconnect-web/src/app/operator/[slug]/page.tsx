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
      <nav className="bg-white border-b border-gray-100 py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo and Company Name */}
            <div className="flex items-center gap-3">
              {operator.brandLogoUrl && (
                <div className="bg-[#00D9A3] p-2 rounded-lg">
                  <Image
                    src={operator.brandLogoUrl}
                    alt={`${operator.companyName} logo`}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{operator.companyName}</h1>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Trusted & Recommended</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-gray-700 hover:text-[#00D9A3] font-medium transition-colors">
                Home
              </a>
              <a href="#routes" className="text-gray-700 hover:text-[#00D9A3] font-medium transition-colors">
                Routes
              </a>
              <a href="#schedule" className="text-gray-700 hover:text-[#00D9A3] font-medium transition-colors">
                Schedule
              </a>
              <a href="#about" className="text-gray-700 hover:text-[#00D9A3] font-medium transition-colors">
                About Us
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#00D9A3] font-medium transition-colors">
                Contact
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" className="border-gray-300 text-gray-700">
                  My Tickets
                </Button>
              </Link>
              <Button className="text-white font-semibold" style={{ backgroundColor: TEAL_COLOR }}>
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section
        id="home"
        className="relative h-[500px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
        }}
      >
        <div className="container mx-auto px-4 h-full flex flex-col justify-center items-start">
          {/* Official Badge */}
          <div className="inline-flex items-center gap-2 bg-[#00D9A3] text-white px-4 py-2 rounded-full mb-6">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wide">Official Booking Portal</span>
          </div>

          {/* Two-Tone Title */}
          <h2 className="text-6xl font-bold mb-4">
            <span className="text-white">Travel Uganda</span>
            <br />
            <span className="text-[#00D9A3]">With {operator.companyName}</span>
          </h2>

          {/* Tagline */}
          <p className="text-xl text-white mb-8 max-w-2xl">
            {operator.tagline || "Direct bookings from Kampala to Gulu, Mbarara, Mbale & more. Best price guaranteed."}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              className="text-white font-semibold px-8 py-6 text-lg"
              style={{ backgroundColor: TEAL_COLOR }}
              onClick={() => {
                document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Search Routes →
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white font-semibold px-8 py-6 text-lg hover:bg-white hover:text-gray-900"
              onClick={() => {
                document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Schedule
            </Button>
          </div>
        </div>
      </section>

      {/* Find Your Bus Section */}
      <section id="search" className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Find Your Bus</h3>
            <Card className="shadow-lg border-gray-200">
              <CardContent className="pt-6 pb-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" style={{ color: TEAL_COLOR }} />
                      FROM
                    </label>
                    <input
                      type="text"
                      placeholder="Kampala"
                      value={searchFrom}
                      onChange={(e) => setSearchFrom(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" style={{ color: TEAL_COLOR }} />
                      TO
                    </label>
                    <input
                      type="text"
                      placeholder="Gulu"
                      value={searchTo}
                      onChange={(e) => setSearchTo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" style={{ color: TEAL_COLOR }} />
                      TRAVEL DATE
                    </label>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" style={{ color: TEAL_COLOR }} />
                      PASSENGERS
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent">
                      <option>1 Adult</option>
                      <option>2 Adults</option>
                      <option>3 Adults</option>
                      <option>4+ Adults</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    className="w-full py-4 text-white font-semibold text-lg"
                    style={{ backgroundColor: TEAL_COLOR }}
                    onClick={() => {
                      if (searchFrom && searchTo) {
                        window.location.href = `/?origin=${encodeURIComponent(searchFrom)}&destination=${encodeURIComponent(
                          searchTo
                        )}&date=${searchDate}`;
                      }
                    }}
                  >
                    Search Routes →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-50 border-y border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">{operator.stats.activeRoutes}+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">Routes Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">{operator.stats.totalTripsCompleted || 50}K+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">Happy Passengers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">4.8★</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">Daily</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">Departures</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section id="routes" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Routes</h2>
              <p className="text-gray-600">Daily departures from Kampala</p>
            </div>
            {operator.routes.length > 6 && (
              <Link href={`/?operator=${operator.companyName}`}>
                <Button variant="link" style={{ color: TEAL_COLOR }} className="text-base font-semibold">
                  View all routes →
                </Button>
              </Link>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularRoutes.map((route) => (
              <Card key={route.id} className="hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-gray-900">{route.origin}</div>
                      <div className="text-[#00D9A3]">→</div>
                      <div className="text-lg font-bold text-gray-900">{route.destination}</div>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" style={{ color: TEAL_COLOR }} />
                        <span>{route.departureTime}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">Depart</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" style={{ color: TEAL_COLOR }} />
                        <span>
                          {new Date(
                            new Date("2000-01-01 " + route.departureTime).getTime() + route.duration * 60 * 60 * 1000
                          ).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="mr-2">Arrival</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <Bus className="w-4 h-4 inline mr-1" />
                          {route.bus.capacity} seats left
                        </div>
                        <div className="text-2xl font-bold" style={{ color: TEAL_COLOR }}>
                          UGX {route.price.toLocaleString()}K
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(
                      route.destination
                    )}`}
                  >
                    <Button className="w-full text-white font-semibold" style={{ backgroundColor: TEAL_COLOR }}>
                      Book Seat →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Book Direct Section - Blue Background */}
      <section className="py-16" style={{ backgroundColor: "#1e3a5f" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">WHY BOOK DIRECT</h2>
            <h3 className="text-2xl text-white font-semibold mb-2">Your seat. Your price. Your journey.</h3>
            <p className="text-blue-200">
              No commissions, no middleman. Book directly through {operator.companyName}'s official portal and get the best seat
              every time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: TEAL_COLOR }}>
                <span className="text-3xl font-bold text-white">0%</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Booking Fee</h3>
              <p className="text-sm text-blue-200">No hidden charges</p>
            </div>
            <div className="text-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: TEAL_COLOR }}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Instant</h3>
              <p className="text-sm text-blue-200">E-Ticket</p>
              <p className="text-sm text-blue-200">On your phone</p>
            </div>
            <div className="text-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: TEAL_COLOR }}>
                <span className="text-2xl font-bold text-white">24/7</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Support</h3>
              <p className="text-sm text-blue-200">Call us anytime</p>
            </div>
            <div className="text-center bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: TEAL_COLOR }}>
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">MTN</h3>
              <p className="text-sm text-blue-200">Mobile Money</p>
              <p className="text-sm text-blue-200">Airtel & Cash</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button
              size="lg"
              className="text-white font-semibold px-8 py-6 text-lg"
              style={{ backgroundColor: TEAL_COLOR }}
              onClick={() => {
                document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get Started →
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      {operator.description && (
        <section id="about" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About {operator.companyName}</h2>
              <p className="text-gray-700 leading-relaxed text-lg mb-8">{operator.description}</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-lg">
                  <Award className="w-6 h-6" style={{ color: TEAL_COLOR }} />
                  <span className="font-semibold text-gray-900">Licensed Operator</span>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-6 h-6" style={{ color: TEAL_COLOR }} />
                  <span className="font-semibold text-gray-900">{operator.stats.yearsInOperation || 10}+ Years Experience</span>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-lg">
                  <Shield className="w-6 h-6" style={{ color: TEAL_COLOR }} />
                  <span className="font-semibold text-gray-900">Safety First</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Get In Touch</h2>
            <p className="text-gray-600">Have questions? We're here to help</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: TEAL_COLOR }}>
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Phone</h3>
                <p className="text-gray-600 font-medium">{operator.contact.phone || "Not available"}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: TEAL_COLOR }}>
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Email</h3>
                <p className="text-gray-600 font-medium break-all">{operator.contact.email || "Not available"}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: TEAL_COLOR }}>
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Manager</h3>
                <p className="text-gray-600 font-medium">{operator.contact.name}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1f35] text-white py-12 border-t-4" style={{ borderColor: TEAL_COLOR }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {operator.brandLogoUrl && (
                  <div className="bg-[#00D9A3] p-2 rounded-lg">
                    <Image
                      src={operator.brandLogoUrl}
                      alt={`${operator.companyName} logo`}
                      width={40}
                      height={40}
                      className="rounded"
                    />
                  </div>
                )}
                <h3 className="text-xl font-bold">{operator.companyName}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{operator.tagline || "Your trusted travel partner"}</p>
            </div>

            {/* Routes */}
            <div>
              <h4 className="text-lg font-bold mb-4" style={{ color: TEAL_COLOR }}>
                ROUTES
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#routes" className="hover:text-white transition-colors">
                    Kampala → Gulu
                  </a>
                </li>
                <li>
                  <a href="#routes" className="hover:text-white transition-colors">
                    Kampala → Mbarara
                  </a>
                </li>
                <li>
                  <a href="#routes" className="hover:text-white transition-colors">
                    Kampala → Mbale
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-lg font-bold mb-4" style={{ color: TEAL_COLOR }}>
                COMPANY
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#schedule" className="hover:text-white transition-colors">
                    Schedules
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} {operator.companyName}. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Powered by</span>
                <Link href="/" className="font-bold hover:opacity-80 transition-opacity" style={{ color: TEAL_COLOR }}>
                  TransConnect
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
