'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Bus, 
  MapPin, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Eye,
  Plus,
  Settings,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeRoutes: 0,
    totalPassengers: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR') {
      router.push('/');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    try {
      // Mock data for demo - in real app, fetch from API
      setStats({
        totalBookings: 1247,
        totalRevenue: 18750000, // UGX
        activeRoutes: 9,
        totalPassengers: 892
      });

      setRecentBookings([
        {
          id: '1',
          passenger: 'John Doe',
          route: 'Kampala → Jinja',
          amount: 15000,
          status: 'CONFIRMED',
          date: new Date().toISOString()
        },
        {
          id: '2', 
          passenger: 'Jane Smith',
          route: 'Kampala → Mbarara',
          amount: 25000,
          status: 'PENDING',
          date: new Date().toISOString()
        },
        {
          id: '3',
          passenger: 'Bob Wilson', 
          route: 'Entebbe → Kampala',
          amount: 12000,
          status: 'COMPLETED',
          date: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">You need admin or operator privileges to access this dashboard</p>
            <Link href="/" className="btn-primary">
              Go Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 space-y-3">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.firstName}! Here's your business overview.</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">UGX {(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Routes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeRoutes}</p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    4 major cities
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bus className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPassengers.toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Bookings
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{booking.passenger}</div>
                      <div className="text-sm text-gray-600">{booking.route}</div>
                      <div className="text-xs text-gray-500">{new Date(booking.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">UGX {booking.amount.toLocaleString()}</div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Bus className="h-6 w-6 mb-2" />
                  Manage Routes
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Users className="h-6 w-6 mb-2" />
                  View Passengers
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Analytics
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Settings className="h-6 w-6 mb-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Performance */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Route Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { route: 'Kampala → Jinja', bookings: 342, revenue: 5130000, occupancy: 85 },
                { route: 'Kampala → Mbarara', bookings: 256, revenue: 6400000, occupancy: 78 },
                { route: 'Entebbe → Kampala', bookings: 189, revenue: 2268000, occupancy: 92 },
                { route: 'Jinja → Kampala', bookings: 298, revenue: 4470000, occupancy: 81 }
              ].map((route, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{route.route}</div>
                    <div className="text-sm text-gray-600">Route</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{route.bookings}</div>
                    <div className="text-sm text-gray-600">Bookings</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600">UGX {(route.revenue / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-gray-600">Revenue</div>
                  </div>
                  <div>
                    <div className="font-semibold text-blue-600">{route.occupancy}%</div>
                    <div className="text-sm text-gray-600">Occupancy</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}