import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Bus, 
  Users, 
  Settings, 
  Menu, 
  X,
  Home,
  MapPin,
  Bell,
  LogOut,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  QrCode,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import RouteManagement from './components/RouteManagement';
import UserManagement from './components/UserManagement';
import OperatorManagement from './components/OperatorManagement';
import QRScannerPage from './components/QRScannerPage';
import AgentManagement from './components/AgentManagement';
import OperatorLayout from './components/operator/OperatorLayout';
import MasterBookings from './components/MasterBookings';
import FieldOperatorDirectory from './components/FieldOperatorDirectory';

// Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeRoutes: 0,
    totalPassengers: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    popularRoute: ''
  });
  const [funnelStats, setFunnelStats] = useState({
    windowDays: 30,
    newPassengerSignups: 0,
    firstBookingRate: 0,
    repeat30DayRate: 0,
    averageBookingsPerActivePassenger: 0,
    activePassengerCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [routePerformance, setRoutePerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/api';

  const loadDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/bookings/admin/analytics?windowDays=30`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`Failed to load dashboard analytics: HTTP ${response.status}`);
      }

      const payload = await response.json();
      const overview = payload.overview || {};
      const funnel = payload.funnel || {};

      setStats({
        totalBookings: overview.totalBookings || 0,
        totalRevenue: overview.totalRevenue || 0,
        activeRoutes: overview.activeRoutes || 0,
        totalPassengers: overview.totalPassengers || 0,
        todayBookings: overview.todayBookings || 0,
        monthlyRevenue: overview.monthlyRevenue || 0,
        popularRoute: overview.popularRoute || '—'
      });

      setFunnelStats({
        windowDays: funnel.windowDays || 30,
        newPassengerSignups: funnel.newPassengerSignups || 0,
        firstBookingRate: Number(funnel.firstBookingRate || 0),
        repeat30DayRate: Number(funnel.repeat30DayRate || 0),
        averageBookingsPerActivePassenger: Number(funnel.averageBookingsPerActivePassenger || 0),
        activePassengerCount: funnel.activePassengerCount || 0,
      });

      setRecentBookings(payload.recentBookings || []);
      setRoutePerformance(payload.routePerformance || []);
      setLastUpdated(payload.generatedAt || new Date().toISOString());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats({
        totalBookings: 0,
        totalRevenue: 0,
        activeRoutes: 0,
        totalPassengers: 0,
        todayBookings: 0,
        monthlyRevenue: 0,
        popularRoute: '—'
      });
      setFunnelStats({
        windowDays: 30,
        newPassengerSignups: 0,
        firstBookingRate: 0,
        repeat30DayRate: 0,
        averageBookingsPerActivePassenger: 0,
        activePassengerCount: 0,
      });
      setRoutePerformance([]);
      setRecentBookings([]);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${Math.round(amount).toLocaleString()}`;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Here's your system overview.</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(lastUpdated || Date.now()).toLocaleString()}
        </div>
      </div>
      
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}!
            </h2>
            <p className="text-blue-100">
              You're logged in as System Administrator. Here's your platform overview.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <div className="text-blue-200 text-sm">bookings today</div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Platform total
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <DollarSign className="h-3 w-3 mr-1" />
                Completed payments
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeRoutes}</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                Active in system
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Passengers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPassengers.toLocaleString()}</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                Registered passengers
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Funnel KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Passenger Sign-ups</p>
              <p className="text-2xl font-bold text-gray-900">{funnelStats.newPassengerSignups}</p>
              <p className="text-sm text-gray-500">Last {funnelStats.windowDays} days</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">First Booking Rate</p>
              <p className="text-2xl font-bold text-gray-900">{funnelStats.firstBookingRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">New passengers with at least one booking</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">30-Day Repeat Rate</p>
              <p className="text-2xl font-bold text-gray-900">{funnelStats.repeat30DayRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Passengers who book again within 30 days</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Bookings per Active Passenger</p>
            <p className="text-2xl font-bold text-gray-900">{funnelStats.averageBookingsPerActivePassenger.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Active passengers: {funnelStats.activePassengerCount.toLocaleString()} in last {funnelStats.windowDays} days</p>
          </div>
          <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{booking.passenger}</div>
                    <div className="text-sm text-gray-600">{booking.route}</div>
                    <div className="text-xs text-gray-500">
                      Seat {booking.seatNumber} • {getTimeAgo(booking.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">UGX {booking.amount.toLocaleString()}</div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <div className="text-[11px] text-gray-500 mt-1">Booked {new Date(booking.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link to="/routes" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Bus className="h-6 w-6 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Manage Routes</div>
                <div className="text-sm text-gray-600">Add or edit routes</div>
              </Link>
              <Link to="/users" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Users className="h-6 w-6 text-green-600 mb-2" />
                <div className="font-medium text-gray-900">View Users</div>
                <div className="text-sm text-gray-600">Manage passengers</div>
              </Link>
              <Link to="/analytics" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <BarChart3 className="h-6 w-6 text-purple-600 mb-2" />
                <div className="font-medium text-gray-900">Analytics</div>
                <div className="text-sm text-gray-600">View detailed reports</div>
              </Link>
              <Link to="/settings" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Settings className="h-6 w-6 text-gray-600 mb-2" />
                <div className="font-medium text-gray-900">Settings</div>
                <div className="text-sm text-gray-600">System configuration</div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Route Performance */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Route Performance</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {routePerformance.map((route, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{route.route}</div>
                  <div className="text-sm text-gray-600">Route</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{route.bookings}</div>
                  <div className="text-sm text-gray-600">Bookings</div>
                </div>
                <div>
                  <div className="font-semibold text-green-600">{formatCurrency(route.revenue)}</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">{stats.popularRoute === route.route ? 'Top route' : 'Active route'}</div>
                  <div className="text-sm text-gray-600">Performance</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Booked in {funnelStats.windowDays}d window</div>
                  <div className="text-sm text-gray-600">Window</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};



// Analytics Component
const Analytics = () => {
  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/api';
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<any>({});
  const [funnel, setFunnel] = useState<any>({});
  const [routes, setRoutes] = useState<any[]>([]);
  const [dailyBookings, setDailyBookings] = useState<any[]>([]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/bookings/admin/analytics?windowDays=${windowDays}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      setOverview(payload.overview || {});
      setFunnel(payload.funnel || {});
      setRoutes(payload.routePerformance || []);
      setDailyBookings(payload.dailyBookings || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, windowDays]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Window</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          >
            {[30, 60, 90, 180].map((days) => (
              <option key={days} value={days}>{days} days</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow border p-10 text-center text-gray-500">Loading analytics…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <p className="text-xs text-gray-500">New Passenger Sign-ups</p>
              <p className="text-2xl font-bold text-gray-900">{(funnel.newPassengerSignups || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <p className="text-xs text-gray-500">First Booking Rate</p>
              <p className="text-2xl font-bold text-gray-900">{Number(funnel.firstBookingRate || 0).toFixed(1)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <p className="text-xs text-gray-500">30-Day Repeat Rate</p>
              <p className="text-2xl font-bold text-gray-900">{Number(funnel.repeat30DayRate || 0).toFixed(1)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <p className="text-xs text-gray-500">Avg Bookings / Active Passenger</p>
              <p className="text-2xl font-bold text-gray-900">{Number(funnel.averageBookingsPerActivePassenger || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Snapshot</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total Revenue</span><span className="font-semibold">UGX {(overview.totalRevenue || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Monthly Revenue</span><span className="font-semibold">UGX {(overview.monthlyRevenue || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total Bookings</span><span className="font-semibold">{(overview.totalBookings || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Today Bookings</span><span className="font-semibold">{(overview.todayBookings || 0).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Bookings</h3>
              <div className="max-h-64 overflow-auto text-sm divide-y">
                {dailyBookings.length === 0 ? (
                  <p className="text-gray-500">No booking activity in this window.</p>
                ) : dailyBookings.map((row: any) => (
                  <div key={row.day} className="py-2 flex justify-between">
                    <span className="text-gray-600">{row.day}</span>
                    <span className="font-medium">{row.bookings}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Routes (by bookings)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="py-2">Route</th>
                    <th className="py-2">Bookings</th>
                    <th className="py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {routes.length === 0 ? (
                    <tr>
                      <td className="py-4 text-gray-500" colSpan={3}>No route performance data yet.</td>
                    </tr>
                  ) : routes.map((route: any) => (
                    <tr key={route.routeId}>
                      <td className="py-3 font-medium text-gray-900">{route.route}</td>
                      <td className="py-3">{route.bookings}</td>
                      <td className="py-3">UGX {(route.revenue || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main App Component with Authentication
const AuthenticatedApp = () => {
  const { user } = useAuth();

  // Route based on user role
  if (user?.role === 'OPERATOR') {
    return <OperatorLayout />;
  }

  // Default to shared operations/admin interface for platform roles
  return <AdminLayout />;
};

// Admin-specific layout (renamed from AuthenticatedApp)
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';
  const isMasterFieldOperator = user?.role === 'MASTER_FIELD_OPERATOR';

  // Admin-only navigation - operators don't see these
  const adminNavigation = isAdmin
    ? [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Routes', href: '/routes', icon: MapPin },
        { name: 'Operators', href: '/operators', icon: Building2 },
        { name: 'Bookings', href: '/bookings', icon: Calendar },
        { name: 'Agents', href: '/agents', icon: UserCheck },
        { name: 'QR Scanner', href: '/qr-scanner', icon: QrCode },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    : isMasterFieldOperator
    ? [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Bookings', href: '/bookings', icon: Calendar },
        { name: 'Operators', href: '/operators-directory', icon: Building2 },
      ]
    : [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Bookings', href: '/bookings', icon: Calendar },
      ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Bus className="h-8 w-8 text-blue-600" />
            <div className={`ml-2 ${sidebarCollapsed ? 'hidden lg:hidden' : ''}`}>
              <span className="text-xl font-bold text-gray-900">TransConnect</span>
              <div className="text-xs text-blue-600">Admin Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <nav className={`mt-8 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="space-y-2">
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={`${sidebarCollapsed ? '' : 'mr-3'} h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer - User Info & Logout */}
        <div className={`absolute bottom-0 left-0 right-0 ${sidebarCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 bg-white`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-3`}>
            <div className="bg-blue-100 rounded-full p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? 'hidden' : ''}`}>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.replace(/_/g, ' ')} • {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors`}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className={`${sidebarCollapsed ? '' : 'mr-3'} h-4 w-4`} />
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  Admin Portal
                </p>
                <p className="text-xs text-gray-500">
                  Welcome back, {user?.firstName}
                </p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={isAdmin ? <Dashboard /> : <MasterBookings />} />
              <Route path="/routes" element={isAdmin ? <RouteManagement /> : <MasterBookings />} />
              <Route path="/operators" element={isAdmin ? <OperatorManagement /> : <MasterBookings />} />
              <Route path="/bookings" element={<MasterBookings />} />
              <Route path="/agents" element={isAdmin ? <AgentManagement /> : <MasterBookings />} />
              <Route path="/qr-scanner" element={isAdmin ? <QRScannerPage /> : <MasterBookings />} />
              <Route path="/analytics" element={isAdmin ? <Analytics /> : <MasterBookings />} />
              <Route path="/users" element={isAdmin ? <UserManagement /> : <MasterBookings />} />
              <Route path="/operators-directory" element={isMasterFieldOperator ? <FieldOperatorDirectory /> : <MasterBookings />} />
              <Route path="/settings" element={isAdmin ? <div>Settings page coming soon...</div> : <MasterBookings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Route to operator layout if user is an operator
  if (user?.role === 'OPERATOR') {
    return (
      <Routes>
        <Route path="/*" element={<OperatorLayout />} />
      </Routes>
    );
  }

  return <AuthenticatedApp />;
};

export default App;
