'use client';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { 
  User, 
  LogOut, 
  LogIn,
  BarChart3, 
  Bus,
  Menu,
  X,
  Search,
  Ticket,
  UserCircle,
  ChevronDown
} from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import TransConnectLogo from '@/components/branding/TransConnectLogo';
import PlayStoreCTA from '@/components/PlayStoreCTA';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const getAdminPortalBaseUrl = () => {
    const fromEnv = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL?.trim();
    if (fromEnv) {
      return fromEnv.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const protocol = window.location.protocol;

      if (host === 'localhost' || host === '127.0.0.1') {
        return `${protocol}//localhost:3001`;
      }

      if (host === 'staging.transconnect.app' || host === 'www.staging.transconnect.app') {
        return 'https://staging-admin.transconnect.app';
      }

      if (host === 'staging-admin.transconnect.app' || host === 'admin.transconnect.app') {
        return `${protocol}//${host}`;
      }
    }

    return 'https://admin.transconnect.app';
  };

  const getAdminPortalUrl = (path = '/') => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${getAdminPortalBaseUrl()}${normalizedPath === '/' ? '' : normalizedPath}`;
  };

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [pathname]);

  function linkClass(href: string) {
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);
    return isActive
      ? 'text-white border-b-2 border-[#00D9A3] pb-1'
      : 'text-slate-300 hover:text-white transition-colors';
  }

  return (
    <header className="bg-[#0d1b2a] border-b border-[#1a3a5c] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" aria-label="TransConnect home" className="flex items-center touch-manipulation">
            <TransConnectLogo
              width={42}
              height={42}
              priority
              usage="dark"
              imageClassName="h-7 w-7 sm:h-8 sm:w-8"
              className="min-w-0"
              wordmarkClassName="text-base sm:text-lg"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 text-[0.98rem]">
            <Link href="/search" className={`font-medium transition-colors ${linkClass('/search')}`}>
              <span className="whitespace-nowrap">Search Routes</span>
            </Link>
            <Link href="/trusted-operators" className={`font-medium transition-colors ${linkClass('/trusted-operators')}`}>
              <span className="whitespace-nowrap">Trusted Operators</span>
            </Link>
            {isAdmin && (
              <a href={getAdminPortalUrl('/')} className="font-medium transition-colors text-slate-300 hover:text-white">
                <span className="whitespace-nowrap">Admin</span>
              </a>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="h-10 rounded-xl bg-[#13273d] border border-[#1f3a58] text-slate-300 hover:text-white flex items-center justify-center px-2">
                  <NotificationCenter />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((open) => !open)}
                    className="flex items-center space-x-2 bg-[#13273d] border border-[#1f3a58] rounded-xl px-3 py-2 min-w-0 hover:bg-[#193451] transition-colors"
                    aria-label="Open account menu"
                    aria-expanded={accountMenuOpen}
                  >
                    <User className="h-4 w-4 text-slate-300" />
                    <span className="text-slate-100 font-medium text-sm whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-300" />
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#1f3a58] bg-[#13273d] shadow-xl overflow-hidden">
                      <Link href="/bookings" className="block px-4 py-2 text-sm text-slate-100 hover:bg-[#1b3e60]" onClick={() => setAccountMenuOpen(false)}>
                        My Bookings
                      </Link>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-slate-100 hover:bg-[#1b3e60]" onClick={() => setAccountMenuOpen(false)}>
                        My Profile
                      </Link>
                      {isAdmin && (
                        <>
                          <a href={getAdminPortalUrl('/')} className="block px-4 py-2 text-sm text-slate-100 hover:bg-[#1b3e60]" onClick={() => setAccountMenuOpen(false)}>
                            Admin Dashboard
                          </a>
                          <a href={getAdminPortalUrl('/routes')} className="block px-4 py-2 text-sm text-slate-100 hover:bg-[#1b3e60]" onClick={() => setAccountMenuOpen(false)}>
                            Manage Routes
                          </a>
                          <a href={getAdminPortalUrl('/analytics')} className="block px-4 py-2 text-sm text-slate-100 hover:bg-[#1b3e60]" onClick={() => setAccountMenuOpen(false)}>
                            Analytics
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-[#fecaca] hover:bg-[#2a1820] border-t border-[#1f3a58]"
                        aria-label="Sign out of your account"
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-white/20 bg-[#0f0f10] px-4 text-white shadow-[0_2px_8px_rgba(0,0,0,0.32)] hover:bg-[#1a1a1c] hover:text-white font-semibold"
                    aria-label="Sign in to your account"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#00D9A3] hover:bg-[#00E5B0] text-white">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-700 active:bg-slate-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-100" />
            ) : (
              <Menu className="h-6 w-6 text-slate-100" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#1a3a5c] bg-[#0d1b2a]">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/search" 
                className="block px-3 py-3 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-[#13273d] transition-colors touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="inline h-4 w-4 mr-2" />
                Search Routes
              </Link>
              <Link
                href="/trusted-operators"
                className="block px-3 py-3 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-[#13273d] transition-colors touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bus className="inline h-4 w-4 mr-2" />
                Trusted Operators
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    href="/bookings" 
                    className="block px-3 py-3 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-[#13273d] transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Ticket className="inline h-4 w-4 mr-2" />
                    My Bookings
                  </Link>
                  <Link 
                    href="/profile" 
                    className="block px-3 py-3 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-[#13273d] transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircle className="inline h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                </>
              )}
              {isAdmin && (
                <>
                  <a
                    href={getAdminPortalUrl('/')} 
                    className="block px-3 py-3 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-[#13273d] transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="inline h-4 w-4 mr-2" />
                    Dashboard
                  </a>
                  <a
                    href={getAdminPortalUrl('/routes')} 
                    className="block px-3 py-3 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-[#13273d] transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bus className="inline h-4 w-4 mr-2" />
                    Routes
                  </a>
                  <a
                    href={getAdminPortalUrl('/analytics')} 
                    className="block px-3 py-3 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-[#13273d] transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="inline h-4 w-4 mr-2" />
                    Analytics
                  </a>
                </>
              )}
              
              <div className="border-t border-[#1a3a5c] pt-3 mt-3">
                <div className="px-3 pb-3">
                  <PlayStoreCTA compact source="header_mobile_utility" className="w-full justify-center" onClick={() => setMobileMenuOpen(false)} />
                </div>
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="px-3 py-3 flex items-center justify-between text-slate-100 font-medium border-b border-[#1a3a5c]">
                      <div>
                        <User className="inline h-4 w-4 mr-2" />
                        {user?.firstName} {user?.lastName}
                        {isAdmin && (
                          <span className="ml-2 px-2 py-1 bg-[#e8f5f2] text-[#1a3a5c] text-xs font-medium rounded-full">
                            {user?.role}
                          </span>
                        )}
                      </div>
                      <NotificationCenter />
                    </div>
                    <button 
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-3 text-[#fecaca] font-semibold rounded-lg bg-[#2a1820] border border-[#ef4444] hover:bg-[#3a1f29] transition-colors touch-manipulation"
                      aria-label="Sign out of your account"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link 
                      href="/login" 
                      className="block w-full text-center px-3 py-3 text-white border border-slate-300 bg-[#13273d] hover:bg-slate-700 font-medium rounded-lg transition-colors touch-manipulation"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LogIn className="inline h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      className="block w-full text-center px-3 py-3 text-white bg-[#00D9A3] hover:bg-[#00E5B0] font-medium rounded-lg transition-colors touch-manipulation"
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