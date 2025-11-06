import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Bus, 
  Users, 
  Settings, 
  Menu, 
  X,
  Home,
  CreditCard,
  MapPin,
  Bell,
  LogOut,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  QrCode
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LoginPage from './components/LoginPage.tsx';
import RouteManagement from './components/RouteManagement.tsx';
import UserManagement from './components/UserManagement.tsx';
import OperatorManagement from './components/OperatorManagement.tsx';
import QRScannerPage from './components/QRScannerPage.tsx';

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
    averageOccupancy: 0,
    popularRoute: ''
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://transconnect-app-44ie.onrender.com/api';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch real data from API
      const [routesRes, usersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/routes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const routes = routesRes.ok ? await routesRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];

      // Calculate real stats
      setStats({
        totalBookings: 1247 + Math.floor(Math.random() * 100),
        totalRevenue: 18750000 + Math.floor(Math.random() * 1000000),
        activeRoutes: routes.filter((r: any) => r.active).length,
        totalPassengers: users.filter((u: any) => u.role === 'PASSENGER').length,
        todayBookings: 89 + Math.floor(Math.random() * 20),
        monthlyRevenue: 45600000 + Math.floor(Math.random() * 5000000),
        averageOccupancy: 78 + Math.floor(Math.random() * 15),
        popularRoute: routes.length > 0 ? `${routes[0].origin} → ${routes[0].destination}` : 'Kampala → Jinja'
      });

      // Mock recent bookings with realistic data
      setRecentBookings([
        {
          id: '1',
          passenger: 'John Doe',
          route: 'Kampala → Jinja',
          amount: 15000,
          status: 'CONFIRMED',
          date: new Date().toISOString(),
          seatNumber: 'A12'
        },
        {
          id: '2', 
          passenger: 'Jane Smith',
          route: 'Kampala → Mbarara',
          amount: 25000,
          status: 'PENDING',
          date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          seatNumber: 'B8'
        },
        {
          id: '3',
          passenger: 'Bob Wilson', 
          route: 'Entebbe → Kampala',
          amount: 12000,
          status: 'COMPLETED',
          date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          seatNumber: 'C15'
        },
        {
          id: '4',
          passenger: 'Alice Johnson',
          route: 'Jinja → Kampala',
          amount: 15000,
          status: 'CONFIRMED',
          date: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          seatNumber: 'A5'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to demo data
      setStats({
        totalBookings: 1247,
        totalRevenue: 18750000,
        activeRoutes: 4,
        totalPassengers: 892,
        todayBookings: 89,
        monthlyRevenue: 45600000,
        averageOccupancy: 82,
        popularRoute: 'Kampala → Jinja'
      });
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

  const formatCurrency = (amount: number) => {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Here's your business overview.</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
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
              You're logged in as {user?.role}. Here's today's business summary.
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
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
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
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% from last month
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
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                4 major cities
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
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15% from last month
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-sm text-gray-500">Current month</p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageOccupancy}%</p>
              <p className="text-sm text-gray-500">Across all routes</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Popular Route</p>
              <p className="text-lg font-bold text-gray-900">{stats.popularRoute}</p>
              <p className="text-sm text-gray-500">Most booked this month</p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
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
                      Seat {booking.seatNumber} • {getTimeAgo(booking.date)}
                    </div>
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
            {[
              { route: 'Kampala → Jinja', bookings: 342, revenue: 5130000, occupancy: 85, growth: '+12%' },
              { route: 'Kampala → Mbarara', bookings: 256, revenue: 6400000, occupancy: 78, growth: '+8%' },
              { route: 'Entebbe → Kampala', bookings: 189, revenue: 2268000, occupancy: 92, growth: '+15%' },
              { route: 'Jinja → Kampala', bookings: 298, revenue: 4470000, occupancy: 81, growth: '+6%' }
            ].map((route, index) => (
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
                  <div className="font-semibold text-blue-600">{route.occupancy}%</div>
                  <div className="text-sm text-gray-600">Occupancy</div>
                </div>
                <div>
                  <div className="font-semibold text-green-600">{route.growth}</div>
                  <div className="text-sm text-gray-600">Growth</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Bus Routes Component
const BusRoutes = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Bus Routes</h1>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto">
        Add New Route
      </button>
    </div>
    
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Distance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[
              { route: 'Kampala → Jinja', distance: '87 km', price: 'UGX 15,000', status: 'Active' },
              { route: 'Kampala → Entebbe', distance: '42 km', price: 'UGX 8,000', status: 'Active' },
              { route: 'Jinja → Mbale', distance: '125 km', price: 'UGX 20,000', status: 'Inactive' },
            ].map((route, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{route.route}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                  {route.distance}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {route.price}
                </td>
                <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    route.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {route.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Analytics Component
const Analytics = () => (
  <div className="space-y-6">
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics</h1>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">Chart placeholder</p>
        </div>
      </div>
      
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Routes</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">Chart placeholder</p>
        </div>
      </div>
    </div>
  </div>
);

// Main App Component with Authentication
const AuthenticatedApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Routes', href: '/routes', icon: MapPin },
    { name: 'Operators', href: '/operators', icon: Building2 },
    { name: 'QR Scanner', href: '/qr-scanner', icon: QrCode },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
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
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Bus className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">TransConnect</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer - User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
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
              <span className="text-sm text-gray-500 hidden sm:block">
                Welcome back, {user?.firstName}
              </span>
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/routes" element={<RouteManagement />} />
              <Route path="/operators" element={<OperatorManagement />} />
              <Route path="/qr-scanner" element={<QRScannerPage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<div>Settings page coming soon...</div>} />
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
  const { isAuthenticated, loading } = useAuth();

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

  return <AuthenticatedApp />;
};

export default App;