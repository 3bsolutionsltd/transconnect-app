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
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 py-5 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Logo and Company Name */}
            <div className="flex items-center gap-3">
              {operator.brandLogoUrl && (
                <div className="bg-[#00D9A3] p-2.5 rounded-lg shadow-md">
                  <Image
                    src={operator.brandLogoUrl}
                    alt={`${operator.companyName} logo`}
                    width={36}
                    height={36}
                    className="rounded"
                  />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">{operator.companyName}</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Trusted & Recommended</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-10">
              <a href="#home" className="text-sm font-semibold text-gray-700 hover:text-[#00D9A3] transition-colors">
                Home
              </a>
              <a href="#routes" className="text-sm font-semibold text-gray-700 hover:text-[#00D9A3] transition-colors">
                Routes
              </a>
              <a href="#schedule" className="text-sm font-semibold text-gray-700 hover:text-[#00D9A3] transition-colors">
                Schedule
              </a>
              <a href="#about" className="text-sm font-semibold text-gray-700 hover:text-[#00D9A3] transition-colors">
                About Us
              </a>
              <a href="#contact" className="text-sm font-semibold text-gray-700 hover:text-[#00D9A3] transition-colors">
                Contact
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" className="border-gray-300 text-gray-700 font-semibold text-sm px-5 py-2">
                  My Tickets
                </Button>
              </Link>
              <Button className="text-white font-bold text-sm px-6 py-2.5" style={{ backgroundColor: TEAL_COLOR }}>
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section
        id="home"
        className="relative h-[550px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url(${heroImage})`,
        }}
      >
        <div className="container mx-auto px-6 h-full flex flex-col justify-center items-start">
          {/* Official Badge */}
          <div className="inline-flex items-center gap-2 bg-[#00D9A3] text-white px-5 py-2.5 rounded-full mb-8 shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Official Booking Portal</span>
          </div>

          {/* Two-Tone Title */}
          <h2 className="text-6xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-white">Travel Uganda</span>
            <br />
            <span className="text-[#00D9A3]">With {operator.companyName.split(' ')[0]}</span>
          </h2>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-white mb-10 max-w-2xl leading-relaxed font-medium">
            {operator.tagline || "Direct bookings from Kampala to Gulu, Mbarara, Mbale & more. Best price guaranteed."}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              className="text-white font-bold px-10 py-6 text-base rounded-lg shadow-xl hover:shadow-2xl transition-all"
              style={{ backgroundColor: TEAL_COLOR }}
              onClick={() => {
                document.getElementById("search")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Search Routes →
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white font-bold px-10 py-6 text-base rounded-lg hover:bg-white hover:text-gray-900 transition-all"
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
      <section id="search" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Find Your Bus</h3>
            <Card className="shadow-2xl border-0 rounded-xl">
              <CardContent className="pt-8 pb-8">
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                      <MapPin className="w-3.5 h-3.5 inline mr-1.5" style={{ color: TEAL_COLOR }} />
                      FROM
                    </label>
                    <input
                      type="text"
                      placeholder="Kampala"
                      value={searchFrom}
                      onChange={(e) => setSearchFrom(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent font-medium text-gray-900 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                      <MapPin className="w-3.5 h-3.5 inline mr-1.5" style={{ color: TEAL_COLOR }} />
                      TO
                    </label>
                    <input
                      type="text"
                      placeholder="Gulu"
                      value={searchTo}
                      onChange={(e) => setSearchTo(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent font-medium text-gray-900 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 inline mr-1.5" style={{ color: TEAL_COLOR }} />
                      TRAVEL DATE
                    </label>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent font-medium text-gray-900 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
                      <Users className="w-3.5 h-3.5 inline mr-1.5" style={{ color: TEAL_COLOR }} />
                      PASSENGERS
                    </label>
                    <select className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent font-medium text-gray-900 text-base">
                      <option>1 Adult</option>
                      <option>2 Adults</option>
                      <option>3 Adults</option>
                      <option>4+ Adults</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    className="w-full py-5 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
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
      <section className="bg-gray-50 border-y border-gray-200 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-900 mb-2">{operator.stats.activeRoutes}+</div>
              <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">Routes Served</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-900 mb-2">{operator.stats.totalTripsCompleted || 50},000+</div>
              <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">Happy Passengers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-900 mb-2">4.8★</div>
              <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-900 mb-2">Daily</div>
              <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">Departures</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section id="routes" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Popular Routes</h2>
              <p className="text-gray-600 text-base">Daily departures from Kampala</p>
            </div>
            {operator.routes.length > 6 && (
              <Link href={`/?operator=${operator.companyName}`}>
                <Button variant="link" style={{ color: TEAL_COLOR }} className="text-base font-semibold">
                  View all routes →
                </Button>
              </Link>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularRoutes.map((route) => (
              <Card key={route.id} className="hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden rounded-xl shadow-lg">
                <div className="bg-gradient-to-r from-[#00D9A3] to-[#00C28F] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-extrabold text-white">{route.origin}</div>
                    <div className="text-white text-2xl">→</div>
                    <div className="text-xl font-extrabold text-white">{route.destination}</div>
                  </div>
                </div>
                <CardContent className="pt-6 pb-6 px-6">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 font-semibold">DEPART</div>
                      <div className="text-lg font-bold text-gray-900">{route.departureTime}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 font-semibold">ARRIVAL</div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Date(
                          new Date("2000-01-01 " + route.departureTime).getTime() + route.duration * 60 * 60 * 1000
                        ).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Bus className="w-4 h-4" style={{ color: TEAL_COLOR }} />
                          <span className="font-medium">{route.bus.capacity} seats left</span>
                        </div>
                        <div className="text-3xl font-extrabold" style={{ color: TEAL_COLOR }}>
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
                    <Button className="w-full text-white font-bold py-6 text-base rounded-lg shadow-md hover:shadow-xl transition-all" style={{ backgroundColor: TEAL_COLOR }}>
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
      <section className="py-20" style={{ backgroundColor: "#1a3a5c" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <h2 className="text-sm font-bold text-[#00D9A3] mb-4 uppercase tracking-widest">WHY BOOK DIRECT</h2>
            <h3 className="text-4xl md:text-5xl text-white font-extrabold mb-4 tracking-tight">Your seat. Your price.<br />Your journey.</h3>
            <p className="text-blue-200 text-lg leading-relaxed">
              No commissions, no middleman. Book directly through {operator.companyName}'s official portal and get the best seat
              every time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center bg-white bg-opacity-[0.08] backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-[0.12] transition-all">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl" style={{ backgroundColor: TEAL_COLOR }}>
                <span className="text-4xl font-extrabold text-white">0%</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Booking Fee</h3>
              <p className="text-sm text-blue-300 font-medium">No hidden charges</p>
            </div>
            <div className="text-center bg-white bg-opacity-[0.08] backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-[0.12] transition-all">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl" style={{ backgroundColor: TEAL_COLOR }}>
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant</h3>
              <p className="text-sm text-blue-300 font-medium">E-Ticket</p>
              <p className="text-sm text-blue-300 font-medium">On your phone</p>
            </div>
            <div className="text-center bg-white bg-opacity-[0.08] backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-[0.12] transition-all">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl" style={{ backgroundColor: TEAL_COLOR }}>
                <span className="text-3xl font-extrabold text-white">24/7</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Support</h3>
              <p className="text-sm text-blue-300 font-medium">Call us anytime</p>
            </div>
            <div className="text-center bg-white bg-opacity-[0.08] backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 hover:bg-opacity-[0.12] transition-all">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl" style={{ backgroundColor: TEAL_COLOR }}>
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">MTN</h3>
              <p className="text-sm text-blue-300 font-medium">Mobile Money</p>
              <p className="text-sm text-blue-300 font-medium">Airtel & Cash</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="text-white font-bold px-12 py-7 text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all"
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
        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">About {operator.companyName}</h2>
              <p className="text-gray-700 leading-relaxed text-lg mb-10 font-medium">{operator.description}</p>
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md">
                  <Award className="w-6 h-6" style={{ color: TEAL_COLOR }} />
                  <span className="font-bold text-gray-900 text-base">Licensed Operator</span>
                </div>
                <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md">
                  <TrendingUp className="w-6 h-6" style={{ color: TEAL_COLOR }} />
                  <span className="font-bold text-gray-900 text-base">{operator.stats.yearsInOperation || 10}+ Years Experience</span>
                </div>
                <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md">
                  <Shield className="w-6 h-6" style={{ color: TEAL_COLOR }} />
                  <span className="font-bold text-gray-900 text-base">Safety First</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Get In Touch</h2>
            <p className="text-gray-600 text-lg">Have questions? We're here to help</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-0 hover:shadow-2xl transition-all duration-300 shadow-lg rounded-xl">
              <CardContent className="pt-10 pb-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ backgroundColor: TEAL_COLOR }}>
                  <Phone className="w-9 h-9 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">Phone</h3>
                <p className="text-gray-700 font-semibold text-base">{operator.contact.phone || "Not available"}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 hover:shadow-2xl transition-all duration-300 shadow-lg rounded-xl">
              <CardContent className="pt-10 pb-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ backgroundColor: TEAL_COLOR }}>
                  <Mail className="w-9 h-9 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">Email</h3>
                <p className="text-gray-700 font-semibold break-all text-base">{operator.contact.email || "Not available"}</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 hover:shadow-2xl transition-all duration-300 shadow-lg rounded-xl">
              <CardContent className="pt-10 pb-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ backgroundColor: TEAL_COLOR }}>
                  <MapPin className="w-9 h-9 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">Manager</h3>
                <p className="text-gray-700 font-semibold text-base">{operator.contact.name}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1b2a] text-white py-16 border-t-4" style={{ borderColor: TEAL_COLOR }}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                {operator.brandLogoUrl && (
                  <div className="bg-[#00D9A3] p-2.5 rounded-lg shadow-lg">
                    <Image
                      src={operator.brandLogoUrl}
                      alt={`${operator.companyName} logo`}
                      width={36}
                      height={36}
                      className="rounded"
                    />
                  </div>
                )}
                <h3 className="text-xl font-extrabold">{operator.companyName}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">{operator.tagline || "Your trusted travel partner"}</p>
            </div>

            {/* Routes */}
            <div>
              <h4 className="text-base font-extrabold mb-5 tracking-wider" style={{ color: TEAL_COLOR }}>
                ROUTES
              </h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>
                  <a href="#routes" className="hover:text-white transition-colors font-medium">
                    Kampala → Gulu
                  </a>
                </li>
                <li>
                  <a href="#routes" className="hover:text-white transition-colors font-medium">
                    Kampala → Mbarara
                  </a>
                </li>
                <li>
                  <a href="#routes" className="hover:text-white transition-colors font-medium">
                    Kampala → Mbale
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-base font-extrabold mb-5 tracking-wider" style={{ color: TEAL_COLOR }}>
                COMPANY
              </h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li>
                  <a href="#about" className="hover:text-white transition-colors font-medium">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors font-medium">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#schedule" className="hover:text-white transition-colors font-medium">
                    Schedules
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400 font-medium">
                © {new Date().getFullYear()} {operator.companyName}. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-medium">Powered by</span>
                <Link href="/" className="font-extrabold hover:opacity-80 transition-opacity" style={{ color: TEAL_COLOR }}>
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
