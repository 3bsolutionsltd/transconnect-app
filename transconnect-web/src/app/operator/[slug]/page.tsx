'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bus, MapPin, Clock, Users, Building, Phone, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { config } from '@/lib/config';

// Types
interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  createdAt: string;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  price: number;
  departureTime: string;
  duration: number;
  active: boolean;
  busId: string;
  bus: {
    plateNumber: string;
    model: string;
    capacity: number;
  };
}

interface OperatorContact {
  name: string;
  email: string;
  phone: string;
}

interface OperatorStats {
  totalBuses: number;
  activeRoutes: number;
  totalTripsCompleted?: number;
  yearsInOperation?: string;
}

interface OperatorPortalData {
  id: string;
  companyName: string;
  slug: string;
  brandLogoUrl?: string;
  brandColor?: string;
  tagline?: string;
  description?: string;
  contact: OperatorContact;
  buses: Bus[];
  routes: Route[];
  stats: OperatorStats;
}

interface OperatorResponse {
  success: boolean;
  operator: OperatorPortalData;
}

export default function OperatorPortalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [operator, setOperator] = useState<OperatorPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');

  // Fetch operator data
  useEffect(() => {
    const fetchOperatorData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${config.api.baseURL}/operator-portal/slug/${slug}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Operator portal not found or not enabled');
          }
          throw new Error('Failed to load operator portal');
        }

        const data: OperatorResponse = await response.json();
        
        if (data.success && data.operator) {
          setOperator(data.operator);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Error fetching operator data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchOperatorData();
    }
  }, [slug]);

  // Get unique origins and destinations from routes
  const origins = operator?.routes
    ? Array.from(new Set(operator.routes.map((r) => r.origin))).sort()
    : [];
  const destinations = operator?.routes
    ? Array.from(new Set(operator.routes.map((r) => r.destination))).sort()
    : [];

  // Filter routes based on selection
  const filteredRoutes = operator?.routes.filter((route) => {
    const matchesOrigin = !selectedOrigin || route.origin === selectedOrigin;
    const matchesDestination = !selectedDestination || route.destination === selectedDestination;
    return matchesOrigin && matchesDestination && route.active;
  }) || [];

  // Handle route booking
  const handleBookRoute = (routeId: string) => {
    router.push(`/search?routeId=${routeId}`);
  };

  // Format duration (minutes to hours/minutes)
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operator portal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Portal Not Found</h2>
              <p className="text-gray-600 mb-6">
                {error || 'This operator portal does not exist or is not available.'}
              </p>
              <Button
                onClick={() => router.push('/')}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get brand color or default
  const brandColor = operator.brandColor || '#2563EB';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded Header */}
      <div
        className="text-white py-12"
        style={{ backgroundColor: brandColor }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Logo */}
            {operator.brandLogoUrl && (
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <img
                  src={operator.brandLogoUrl}
                  alt={`${operator.companyName} Logo`}
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}

            {/* Company Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{operator.companyName}</h1>
              {operator.tagline && (
                <p className="text-xl opacity-90">{operator.tagline}</p>
              )}
            </div>

            {/* Quick Contact */}
            <div className="flex gap-4">
              {operator.contact.phone && (
                <a
                  href={`tel:${operator.contact.phone}`}
                  className="bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <Phone className="h-5 w-5" />
                  Call Us
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Bus className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold text-gray-800">{operator.stats.totalBuses}</p>
              <p className="text-sm text-gray-600">Buses</p>
            </div>
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold text-gray-800">{operator.stats.activeRoutes}</p>
              <p className="text-sm text-gray-600">Active Routes</p>
            </div>
            {operator.stats.totalTripsCompleted !== undefined && (
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-800">{operator.stats.totalTripsCompleted}</p>
                <p className="text-sm text-gray-600">Trips Completed</p>
              </div>
            )}
            {operator.stats.yearsInOperation && (
              <div className="text-center">
                <Building className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-800">{operator.stats.yearsInOperation}</p>
                <p className="text-sm text-gray-600">Years in Operation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* About Section */}
        {operator.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">About Us</h2>
              <p className="text-gray-600 leading-relaxed">{operator.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Routes Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Routes</h2>

            {/* Route Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Origins</option>
                  {origins.map((origin) => (
                    <option key={origin} value={origin}>
                      {origin}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Destinations</option>
                  {destinations.map((destination) => (
                    <option key={destination} value={destination}>
                      {destination}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Routes Grid */}
            {filteredRoutes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoutes.map((route) => (
                  <Card key={route.id} className="hover:shadow-lg transition">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-gray-500" />
                            <span className="font-semibold text-gray-800">
                              {route.origin}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span>→</span>
                            <span>{route.destination}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: brandColor }}>
                            {formatPrice(route.price)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Departs: {route.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Duration: {formatDuration(route.duration)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4" />
                          <span>{route.bus.model} ({route.bus.capacity} seats)</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleBookRoute(route.id)}
                        className="w-full"
                        style={{ backgroundColor: brandColor }}
                      >
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No routes match your selected filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fleet Section */}
        {operator.buses.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Fleet</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operator.buses.map((bus) => (
                  <Card key={bus.id} className="bg-gray-50">
                    <CardContent className="pt-6">
                      <Bus className="h-8 w-8 mb-3" style={{ color: brandColor }} />
                      <p className="font-semibold text-gray-800 mb-1">{bus.model}</p>
                      <p className="text-sm text-gray-600 mb-1">{bus.plateNumber}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{bus.capacity} seats</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Section */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {operator.contact.phone && (
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${brandColor}20` }}
                  >
                    <Phone className="h-6 w-6" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Phone</p>
                    <a
                      href={`tel:${operator.contact.phone}`}
                      className="text-gray-600 hover:underline"
                    >
                      {operator.contact.phone}
                    </a>
                  </div>
                </div>
              )}
              {operator.contact.email && (
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${brandColor}20` }}
                  >
                    <Mail className="h-6 w-6" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Email</p>
                    <a
                      href={`mailto:${operator.contact.email}`}
                      className="text-gray-600 hover:underline"
                    >
                      {operator.contact.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">
            Powered by{' '}
            <a href="/" className="font-semibold hover:underline">
              TransConnect
            </a>
          </p>
          <p className="text-sm text-gray-400">
            Uganda's Premier Bus Booking Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
