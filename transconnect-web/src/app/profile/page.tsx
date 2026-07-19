'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  Bell,
  Calendar,
  CreditCard,
  Lock,
  Mail,
  Phone,
  Shield,
  Ticket,
  User,
} from 'lucide-react';
import Header from '@/components/Header';
import PortalFooter from '@/components/PortalFooter';
import { useAuth } from '@/contexts/AuthContext';
import { Container, Heading, Lead, StyledCard } from '@/components/styled';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const memberSince = useMemo(
    () =>
      new Date().toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
      }),
    []
  );

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f8fe]">
        <Header />
        <Container className="max-w-[1240px] py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        </Container>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Container className="max-w-[1240px] py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside>
            <StyledCard hover={false} className="!p-0 overflow-hidden mb-4">
              <div className="p-6 text-white" style={{ background: 'linear-gradient(165deg, #1f4f89 0%, #1f4f89 65%, #186b73 100%)' }}>
                <div className="h-16 w-16 rounded-full bg-[#00a878] border-2 border-[#6ee6cb] flex items-center justify-center text-3xl font-black mb-4">
                  {initials}
                </div>
                <h2 className="text-2xl font-bold leading-tight">{user?.firstName} {user?.lastName}</h2>
                <p className="text-sm text-cyan-100 mt-1">{user?.email}</p>
                <span className="inline-flex items-center mt-4 rounded-full bg-[#0a9f77]/35 border border-[#81f1d2]/40 px-3 py-1 text-xs font-semibold">
                  Verified Account
                </span>
              </div>
            </StyledCard>

            <StyledCard hover={false} className="!p-0">
              <nav className="p-3 space-y-1">
                <div className="text-[11px] uppercase font-bold text-[#8ca4c4] px-2 pt-1 pb-2">Account</div>
                <a className="flex items-center gap-3 rounded-xl bg-[#eafaf5] text-[#0f8c6b] font-semibold px-3 py-2" href="#">
                  <User className="h-4 w-4" />
                  Personal Info
                </a>
                <a className="flex items-center gap-3 rounded-xl text-[#3d5475] hover:bg-[#f3f7fd] px-3 py-2" href="#">
                  <CreditCard className="h-4 w-4" />
                  Payment Methods
                </a>
                <a className="flex items-center gap-3 rounded-xl text-[#3d5475] hover:bg-[#f3f7fd] px-3 py-2" href="#">
                  <Bell className="h-4 w-4" />
                  Notifications
                </a>
                <a className="flex items-center gap-3 rounded-xl text-[#3d5475] hover:bg-[#f3f7fd] px-3 py-2" href="#">
                  <Lock className="h-4 w-4" />
                  Security
                </a>

                <div className="text-[11px] uppercase font-bold text-[#8ca4c4] px-2 pt-4 pb-2">Travel</div>
                <Link className="flex items-center gap-3 rounded-xl text-[#3d5475] hover:bg-[#f3f7fd] px-3 py-2" href="/bookings">
                  <Ticket className="h-4 w-4" />
                  My Bookings
                </Link>
                <Link className="flex items-center gap-3 rounded-xl text-[#3d5475] hover:bg-[#f3f7fd] px-3 py-2" href="/transfers">
                  <Calendar className="h-4 w-4" />
                  My Transfers
                </Link>
              </nav>
            </StyledCard>
          </aside>

          <main className="space-y-6">
            <div>
              <Heading as="h1" className="text-[#192c45]">My Profile</Heading>
              <Lead className="text-[#6f86a7]">Manage your account details and travel preferences.</Lead>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StyledCard hover={false} className="!p-4 border-l-4 border-l-[#214c86]">
                <p className="text-xs font-semibold text-[#8ca4c4] uppercase">Member Since</p>
                <p className="text-3xl font-black text-[#192c45] mt-2">{memberSince}</p>
              </StyledCard>
              <StyledCard hover={false} className="!p-4 border-l-4 border-l-[#00a878]">
                <p className="text-xs font-semibold text-[#8ca4c4] uppercase">Status</p>
                <p className="text-3xl font-black text-[#00a878] mt-2">Active</p>
              </StyledCard>
              <StyledCard hover={false} className="!p-4">
                <p className="text-xs font-semibold text-[#8ca4c4] uppercase">Phone</p>
                <p className="text-lg font-bold text-[#192c45] mt-2">{user?.phone || 'Not set'}</p>
              </StyledCard>
              <StyledCard hover={false} className="!p-4">
                <p className="text-xs font-semibold text-[#8ca4c4] uppercase">Role</p>
                <p className="text-lg font-bold text-[#192c45] mt-2">{user?.role || 'PASSENGER'}</p>
              </StyledCard>
            </div>

            <StyledCard hover={false}>
              <h2 className="text-xl font-bold text-[#192c45] mb-4">Profile Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="tc-label">First Name</label>
                  <input className="tc-input" value={user?.firstName || ''} readOnly />
                </div>
                <div>
                  <label className="tc-label">Last Name</label>
                  <input className="tc-input" value={user?.lastName || ''} readOnly />
                </div>
                <div>
                  <label className="tc-label">Email Address</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input className="tc-input !pl-10" value={user?.email || ''} readOnly />
                  </div>
                </div>
                <div>
                  <label className="tc-label">Phone Number</label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input className="tc-input !pl-10" value={user?.phone || ''} readOnly />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[#e7eef8] bg-[#f8fbff] p-4">
                <div className="flex items-start gap-3 text-[#4f6585]">
                  <Shield className="h-4 w-4 mt-0.5 text-[#00a878]" />
                  <p className="text-sm">Your profile details are encrypted and used only for secure booking and ticketing operations.</p>
                </div>
              </div>
            </StyledCard>

            <StyledCard hover={false}>
              <h2 className="text-lg font-bold text-[#192c45] mb-3">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/bookings" className="tc-card-bordered !p-4 hover:!shadow-none block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Ticket className="h-4 w-4 text-[#00C28F]" />
                      My Bookings
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>

                <Link href="/transfers" className="tc-card-bordered !p-4 hover:!shadow-none block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <ArrowRightLeft className="h-4 w-4 text-[#00C28F]" />
                      Transfer Requests
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              </div>
            </StyledCard>
          </main>
        </div>
      </Container>
      <PortalFooter slim />
    </div>
  );
}
