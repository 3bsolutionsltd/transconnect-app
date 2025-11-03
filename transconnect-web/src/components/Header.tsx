'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  User, 
  LogOut, 
  Settings, 
  BarChart3, 
  Bus,
  Calendar,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 touch-manipulation">
            <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">TransConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/search" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Search Routes
            </Link>
            {isAuthenticated && (
              <Link href="/bookings" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                My Bookings
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/routes" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Routes
                </Link>
                <Link href="/admin/analytics" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Analytics
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  {isAdmin && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {user?.role}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/search" 
                className="block px-3 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search Routes
              </Link>
              {isAuthenticated && (
                <Link 
                  href="/bookings" 
                  className="block px-3 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link 
                    href="/admin" 
                    className="block px-3 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="inline h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link 
                    href="/admin/routes" 
                    className="block px-3 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bus className="inline h-4 w-4 mr-2" />
                    Routes
                  </Link>
                  <Link 
                    href="/admin/analytics" 
                    className="block px-3 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="inline h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </>
              )}
              
              <div className="border-t pt-3 mt-3">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="px-3 py-3 text-gray-700 font-medium border-b border-gray-100">
                      <User className="inline h-4 w-4 mr-2" />
                      {user?.firstName} {user?.lastName}
                      {isAdmin && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {user?.role}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link 
                      href="/login" 
                      className="block w-full text-center px-3 py-3 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg transition-colors touch-manipulation"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/register" 
                      className="block w-full text-center px-3 py-3 text-blue-600 border border-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors touch-manipulation"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}