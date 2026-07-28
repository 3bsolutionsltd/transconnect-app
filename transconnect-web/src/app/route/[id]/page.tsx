'use client';
import React, { useEffect, useState } from 'react';
import { fetchRouteById } from '../../../lib/api';
import SeatMap from '../../../components/booking/SeatMap';
import BookingForm from '../../../components/booking/BookingForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Route, Bus, Calendar, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Section, Container, Heading, StyledCard, StyledButton, Badge } from '@/components/styled';
import OperatorLogoBadge from '@/components/branding/OperatorLogoBadge';

export default function RoutePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [route, setRoute] = useState<any>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchRouteById(id, { travelDate });
        setRoute(data);

        if (data.availability && Array.isArray(data.availability.bookedSeatNumbers)) {
          setBookedSeats(data.availability.bookedSeatNumbers.map((n: any) => n.toString()));
        } else {
          setBookedSeats([]);
        }

        setSelectedSeats([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, travelDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
          <span className="text-gray-700 font-medium">Loading route details...</span>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-6">
        <StyledCard variant="elevated" className="text-center max-w-md">
          <div className="text-gray-600 mb-4 text-lg font-semibold">Route not found</div>
          <div className="text-sm text-gray-500 mb-6">The route you are looking for does not exist or has been removed.</div>
          <div className="space-y-3">
            <StyledButton variant="primary" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </StyledButton>
            <Link href="/search" className="block">
              <StyledButton variant="outline" className="w-full">
                Search Routes
              </StyledButton>
            </Link>
          </div>
        </StyledCard>
      </div>
    );
  }

  return (
    <Section variant="light">
      <Container className="max-w-6xl py-8 pb-28 md:pb-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="text-sm text-gray-500">
              <Link href="/" className="hover:text-teal-600">Home</Link>
              <span className="mx-2">›</span>
              <Link href="/search" className="hover:text-teal-600">Search</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">Route Details</span>
            </div>
          </div>
          <Link href="/search">
            <StyledButton variant="outline" size="sm">
              Search Other Routes
            </StyledButton>
          </Link>
        </div>

        <StyledCard variant="elevated" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <Heading as="h1" className="flex items-center space-x-3 text-gray-900">
                <MapPin className="h-8 w-8 text-teal-600" />
                <span>{route.origin}</span>
                <span className="text-gray-400">→</span>
                <span>{route.destination}</span>
              </Heading>
              <p className="text-gray-600 mt-2">Select your seat and complete your booking</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-teal-600">UGX {route.price?.toLocaleString()}</div>
              <div className="text-sm text-gray-500">per seat</div>
            </div>
          </div>

          {route.operator && (
            <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                  <OperatorLogoBadge operator={route.operator} size="lg" className="!rounded-full !bg-teal-100 !border-teal-200" />
                  <div>
                    <div className="font-semibold text-teal-900">{route.operator.companyName}</div>
                    <div className="text-sm text-teal-700">Licensed Bus Operator</div>
                  </div>
                </div>
                <Badge variant="success" icon={<CheckCircle className="h-3 w-3" />}>
                  Verified
                </Badge>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Duration</div>
                <div className="font-semibold text-gray-900">{Math.floor(route.duration / 60)}h {route.duration % 60}m</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Route className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Distance</div>
                <div className="font-semibold text-gray-900">{route.distance} km</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Departure</div>
                <div className="font-semibold text-gray-900">{route.departureTime}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <Bus className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Bus Model</div>
                <div className="font-semibold text-gray-900">{route.bus?.model}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-50 rounded-lg">
                <MapPin className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Plate Number</div>
                <div className="font-semibold text-gray-900">{route.bus?.plateNumber}</div>
              </div>
            </div>
          </div>

          {route.availability && (
            <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg border border-teal-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Available Seats:</span>
                <span className="font-bold text-green-600 text-lg">
                  {route.availability.availableSeats} of {route.availability.totalSeats}
                </span>
              </div>
            </div>
          )}
        </StyledCard>

        <StyledCard variant="bordered" className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="h-6 w-6 text-teal-600" />
            <Heading as="h2" className="text-gray-900">Select Travel Date</Heading>
          </div>
          <div className="max-w-md">
            <label className="tc-label">When do you want to travel?</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="tc-input"
            />
            <div className="text-sm text-gray-500 mt-2">Seat availability will update based on your selected date</div>
          </div>
        </StyledCard>

        <div className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-6 items-start">
          <StyledCard variant="bordered" className="mb-0">
            <div className="flex items-center justify-between mb-6">
              <Heading as="h2" className="text-gray-900">Select Your Seats</Heading>
              {loading && (
                <div className="flex items-center space-x-2 text-teal-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  <span className="text-sm font-medium">Updating availability...</span>
                </div>
              )}
            </div>

            <SeatMap
              capacity={route.bus.capacity}
              bookedSeats={bookedSeats}
              selectedSeats={selectedSeats}
              maxSeats={4}
              onSelect={(seats) => setSelectedSeats(seats)}
            />
          </StyledCard>

          <div className="xl:sticky xl:top-24">
            <StyledCard variant="elevated">
              <Heading as="h2" className="text-gray-900 mb-6">Complete Your Booking</Heading>
              <BookingForm
                routeId={route.id}
                price={route.price}
                selectedSeats={selectedSeats}
                defaultTravelDate={travelDate}
                onSuccess={() => router.push('/profile')}
                routeOrigin={route.origin}
                routeDestination={route.destination}
                routeDepartureTime={route.departureTime}
              />
            </StyledCard>
          </div>
        </div>
      </Container>
    </Section>
  );
}
