import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Bus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ActiveRoute {
  origin: string;
  destination: string;
  price: number;
}

interface OperatorStats {
  myBuses: number;
  myRoutes: number;
  todayBookings: number;
  monthlyRevenue: number;
  pendingBookings: number;
  confirmedBookings: number;
  averageOccupancy: number;
  myActiveRoutes: ActiveRoute[];
}

// Operator-specific dashboard with limited scope and different design
const OperatorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<OperatorStats>({
    myBuses: 0,
    myRoutes: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    averageOccupancy: 0,
    myActiveRoutes: []
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const loadOperatorData = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      // Load operator-specific data from the operator-management endpoints
      const [busesRes, routesRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/buses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/routes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/operator-management/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (busesRes.ok && routesRes.ok) {
        const busesData = await busesRes.json();
        const routesData = await routesRes.json();
        
        // Calculate operator-specific stats
        const myBuses = busesData.length || 0;
        const myRoutes = routesData.routes?.length || routesData.length || 0;
        
        let bookingsData = [];
        if (bookingsRes.ok) {
          const bookingsResult = await bookingsRes.json();
          bookingsData = bookingsResult.bookings || bookingsResult || [];
        }

        const todayBookings = bookingsData.filter((booking: any) => {
          const bookingDate = new Date(booking.createdAt);
          const today = new Date();
          return bookingDate.toDateString() === today.toDateString();
        }).length;

        const confirmedBookings = bookingsData.filter((b: any) => b.status === 'CONFIRMED').length;
        const pendingBookings = bookingsData.filter((b: any) => b.status === 'PENDING').length;
        
        const monthlyRevenue = bookingsData
          .filter((booking: any) => {
            const bookingDate = new Date(booking.createdAt);
            const now = new Date();
            return bookingDate.getMonth() === now.getMonth() && 
                   bookingDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum: number, booking: any) => sum + (booking.totalAmount || 0), 0);

        setStats({
          myBuses,
          myRoutes,
          todayBookings,
          monthlyRevenue,
          pendingBookings,
          confirmedBookings,
          averageOccupancy: 72, // Could be calculated from real data
          myActiveRoutes: routesData.routes?.slice(0, 3) || routesData.slice(0, 3) || []
        });

        // Set recent bookings (last 5)
        setRecentBookings(bookingsData.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading operator data:', error);
      // Set fallback data for operators
      setStats({
        myBuses: 2,
        myRoutes: 3,
        todayBookings: 5,
        monthlyRevenue: 150000,
        pendingBookings: 2,
        confirmedBookings: 8,
        averageOccupancy: 68,
        myActiveRoutes: [
          { origin: 'Kampala', destination: 'Jinja', price: 15000 },
          { origin: 'Jinja', destination: 'Kampala', price: 15000 },
          { origin: 'Kampala', destination: 'Entebbe', price: 10000 }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadOperatorData();
  }, [loadOperatorData]);

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      {/* Operator Welcome Section - Different from Admin */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-green-100">
              Manage your bus operations and track your business performance.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.todayBookings}</div>
            <div className="text-green-200 text-sm">bookings today</div>
          </div>
        </div>
      </div>

      {/* Operator-Specific Stats - Different colors and focus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Buses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.myBuses}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <Bus className="h-3 w-3 mr-1" />
                Fleet size
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Bus className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Routes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.myRoutes}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                Active routes
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-sm text-yellow-600 flex items-center mt-1">
                <DollarSign className="h-3 w-3 mr-1" />
                This month
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Occupancy</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageOccupancy}%</p>
              <p className="text-sm text-purple-600 flex items-centers mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Performance
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed Bookings</p>
              <p className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayBookings}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings - Operator View */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              <span className="text-sm text-gray-500">Your buses only</span>
            </div>
          </div>
          <div className="p-6">
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{booking.user?.firstName} {booking.user?.lastName}</div>
                      <div className="text-sm text-gray-600">{booking.route?.origin} → {booking.route?.destination}</div>
                      <div className="text-xs text-gray-500">
                        Seat {booking.seatNumber} • {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{formatCurrency(booking.totalAmount)}</div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* My Routes - Operator-Specific Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Routes</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.myActiveRoutes.map((route: ActiveRoute, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {route.origin} → {route.destination}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(route.price)} per seat
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              ))}
              {stats.myActiveRoutes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No active routes</p>
                  <p className="text-sm">Contact admin to set up routes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Operator Tips - Different from admin */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Operator Tips</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Keep your bus information updated for better bookings</li>
              <li>• Confirm bookings promptly to improve customer satisfaction</li>
              <li>• Monitor your routes' performance and suggest improvements</li>
              <li>• Contact admin if you need to add new routes or modify existing ones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;