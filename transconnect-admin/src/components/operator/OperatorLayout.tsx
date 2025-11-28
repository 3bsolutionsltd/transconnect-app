import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Bus, 
  Menu, 
  X, 
  MapPin, 
  Calendar,
  Users,
  Settings,
  LogOut,
  Bell,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OperatorDashboard from './OperatorDashboard';
import OperatorBookings from './OperatorBookings';
import OperatorBuses from './OperatorBuses';
import OperatorRoutes from './OperatorRoutes';

const OperatorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Limited navigation for operators - only what they need
  const operatorNavigation = [
    { name: 'Dashboard', href: '/', icon: Home, description: 'Overview & stats' },
    { name: 'My Bookings', href: '/bookings', icon: Calendar, description: 'Manage bookings' },
    { name: 'My Buses', href: '/buses', icon: Bus, description: 'Fleet management' },
    { name: 'My Routes', href: '/routes', icon: MapPin, description: 'Route information' },
    { name: 'Settings', href: '/settings', icon: Settings, description: 'Account settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Operator Sidebar - Different styling from admin */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-green-800 to-green-900 shadow-xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-green-700">
          <div className="flex items-center">
            <Bus className="h-8 w-8 text-white" />
            <div className="ml-2">
              <span className="text-xl font-bold text-white">TransConnect</span>
              <div className="text-xs text-green-200">Operator Portal</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-green-200 hover:text-white hover:bg-green-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Operator Info Section */}
        <div className="px-4 py-4 border-b border-green-700">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 rounded-full p-2">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-green-200 truncate">
                Bus Operator • {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Operator Navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-2">
            {operatorNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-green-700 text-white shadow-md'
                      : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-green-300 group-hover:text-white'
                  }`} />
                  <div className="flex-1">
                    <div>{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Operator-specific footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <div className="mb-3">
            <div className="text-xs text-green-200 mb-1">Need help?</div>
            <div className="text-xs text-green-100">Contact admin for support</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm text-green-100 hover:text-white hover:bg-green-700 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Operator Header - Different styling */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-lg font-medium text-gray-900">
                  Operator Portal
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your bus operations
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                Welcome back, {user?.firstName}
              </span>
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 bg-red-400 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<OperatorDashboard />} />
              <Route path="/bookings" element={<OperatorBookings />} />
              <Route path="/buses" element={<OperatorBuses />} />
              <Route path="/routes" element={<OperatorRoutes />} />
              <Route path="/settings" element={
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Operator Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Your company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Phone
                      </label>
                      <input 
                        type="tel" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Your contact number"
                      />
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                      Update Settings
                    </button>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OperatorLayout;