import React from 'react';
import Link from 'next/link';
import TransConnectLogo from '@/components/branding/TransConnectLogo';
import PlayStoreCTA from '@/components/PlayStoreCTA';
import { COPYRIGHT_ATTRIBUTION } from '@/lib/links';

interface PortalFooterProps {
  slim?: boolean;
}

export default function PortalFooter({ slim = false }: PortalFooterProps) {
  if (slim) {
    return (
      <footer className="bg-[#0d1b2a] border-t border-[#1a3a5c] text-slate-400 py-4 mt-10">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <TransConnectLogo
              usage="dark"
              width={76}
              height={22}
              imageClassName="h-4"
              wordmarkClassName="text-sm"
            />
            <PlayStoreCTA compact />
          </div>
          <p>{COPYRIGHT_ATTRIBUTION}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[#0d1b2a] text-white py-10 mt-14 border-t border-[#1a3a5c]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-3">
              <TransConnectLogo
                usage="dark"
                width={108}
                height={30}
                imageClassName="h-6"
                wordmarkClassName="text-lg"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Book intercity buses, track trips, and manage tickets in one place.
            </p>
            <div className="mt-4">
              <PlayStoreCTA compact className="!text-sm !px-4 !py-2.5" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">Travel</h4>
            <div className="space-y-2 text-sm">
              <Link href="/search" className="block text-slate-400 hover:text-white">Search Routes</Link>
              <Link href="/trusted-operators" className="block text-slate-400 hover:text-white">Trusted Operators</Link>
              <Link href="/bookings" className="block text-slate-400 hover:text-white">My Bookings</Link>
              <Link href="/transfers" className="block text-slate-400 hover:text-white">My Transfers</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">Account</h4>
            <div className="space-y-2 text-sm">
              <Link href="/login" className="block text-slate-400 hover:text-white">Sign In</Link>
              <Link href="/register" className="block text-slate-400 hover:text-white">Create Account</Link>
              <Link href="/profile" className="block text-slate-400 hover:text-white">Profile</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">Company</h4>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block text-slate-400 hover:text-white">About TransConnect</Link>
              <Link href="/help" className="block text-slate-400 hover:text-white">Help Centre</Link>
              <Link href="/contact" className="block text-slate-400 hover:text-white">Contact Us</Link>
              <Link href="/terms" className="block text-slate-400 hover:text-white">Terms of Service</Link>
              <Link href="/privacy" className="block text-slate-400 hover:text-white">Privacy Policy</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#1a3a5c] text-xs text-slate-500 text-center">
          <p>{COPYRIGHT_ATTRIBUTION}</p>
        </div>
      </div>
    </footer>
  );
}
