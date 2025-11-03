'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Bus, 
  DollarSign,
  Calendar,
  ArrowLeft,
  Download,
  RefreshCw,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [analytics, setAnalytics] = useState({
    revenue: {
      current: 2850000,
      previous: 2400000,
      change: 18.75
    },
    bookings: {
      current: 342,
      previous: 298,
      change: 14.77
    },
    passengers: {
      current: 267,
      previous: 234,
      change: 14.10
    },
    occupancy: {
      current: 78.5,
      previous: 72.3,
      change: 8.57
    }
  });

  const [chartData, setChartData] = useState({
    daily: [
      { date: '2024-01-01', bookings: 45, revenue: 675000 },
      { date: '2024-01-02', bookings: 52, revenue: 780000 },
      { date: '2024-01-03', bookings: 38, revenue: 570000 },
      { date: '2024-01-04', bookings: 61, revenue: 915000 },
      { date: '2024-01-05', bookings: 48, revenue: 720000 },
      { date: '2024-01-06', bookings: 55, revenue: 825000 },
      { date: '2024-01-07', bookings: 43, revenue: 645000 }
    ],
    routes: [
      { route: 'Kampala → Jinja', bookings: 89, revenue: 1335000, occupancy: 85 },
      { route: 'Kampala → Mbarara', bookings: 67, revenue: 1675000, occupancy: 78 },
      { route: 'Entebbe → Kampala', route: 'Entebbe → Kampala', bookings: 76, revenue: 912000, occupancy: 92 },
      { route: 'Jinja → Kampala', bookings: 72, revenue: 1080000, occupancy: 81 }
    ]
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR') {
      router.push('/');
      return;
    }

    loadAnalytics();
  }, [isAuthenticated, user, router, timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app, fetch analytics data based on timeframe
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Track your business performance and trends</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="flex bg-white rounded-lg border">
                {['7d', '30d', '90d'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-4 py-2 text-sm font-medium ${
                      timeframe === period
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    } ${period === '7d' ? 'rounded-l-lg' : period === '90d' ? 'rounded-r-lg' : ''}`}
                  >
                    {period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={loadAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.revenue.current)}</p>
                  <p className={`text-sm flex items-center mt-1 ${getChangeColor(analytics.revenue.change)}`}>
                    {getChangeIcon(analytics.revenue.change)}
                    <span className="ml-1">+{analytics.revenue.change}% vs prev period</span>
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
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.bookings.current.toLocaleString()}</p>
                  <p className={`text-sm flex items-center mt-1 ${getChangeColor(analytics.bookings.change)}`}>
                    {getChangeIcon(analytics.bookings.change)}
                    <span className="ml-1">+{analytics.bookings.change}% vs prev period</span>
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
                  <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.passengers.current.toLocaleString()}</p>
                  <p className={`text-sm flex items-center mt-1 ${getChangeColor(analytics.passengers.change)}`}>
                    {getChangeIcon(analytics.passengers.change)}
                    <span className="ml-1">+{analytics.passengers.change}% vs prev period</span>
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Occupancy</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.occupancy.current}%</p>
                  <p className={`text-sm flex items-center mt-1 ${getChangeColor(analytics.occupancy.change)}`}>
                    {getChangeIcon(analytics.occupancy.change)}
                    <span className="ml-1">+{analytics.occupancy.change}% vs prev period</span>
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Bus className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Daily Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.daily.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{day.bookings} bookings</div>
                        <div className="text-xs text-gray-600">Bookings</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">{formatCurrency(day.revenue)}</div>
                        <div className="text-xs text-gray-600">Revenue</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Route Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Route Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.routes.map((routeData, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{routeData.route}</div>
                      <div className="text-sm text-blue-600 font-semibold">{routeData.occupancy}% occupied</div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">{routeData.bookings} bookings</span>
                      </div>
                      <div>
                        <span className="text-green-600 font-semibold">{formatCurrency(routeData.revenue)}</span>
                      </div>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${routeData.occupancy}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Peak Hours Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Peak Hours Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { time: '06:00-09:00', label: 'Morning Rush', bookings: 89, percentage: 26 },
                { time: '09:00-12:00', label: 'Mid Morning', bookings: 56, percentage: 16 },
                { time: '12:00-15:00', label: 'Afternoon', bookings: 67, percentage: 20 },
                { time: '15:00-18:00', label: 'Evening Rush', bookings: 95, percentage: 28 },
                { time: '18:00-21:00', label: 'Evening', bookings: 23, percentage: 7 },
                { time: '21:00-06:00', label: 'Night', bookings: 12, percentage: 3 }
              ].slice(0, 4).map((period, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{period.bookings}</div>
                  <div className="text-sm text-gray-600">{period.label}</div>
                  <div className="text-xs text-blue-600 font-medium">{period.time}</div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${period.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{period.percentage}% of daily bookings</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}