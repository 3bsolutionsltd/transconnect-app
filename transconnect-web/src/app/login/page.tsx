'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, LogIn, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Heading, StyledButton } from '@/components/styled';
import TransConnectLogo from '@/components/branding/TransConnectLogo';
import { COPYRIGHT_ATTRIBUTION } from '@/lib/links';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      const fullName = [result?.user?.firstName, result?.user?.lastName].filter(Boolean).join(' ').trim();
      toast.success(`Welcome back, ${fullName || result?.user?.email || 'traveller'}!`);
      router.push('/search');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tc-auth-layout">
      <aside className="tc-auth-panel">
        <div className="tc-auth-panel-content">
          <div className="flex items-center gap-3 mb-16">
            <TransConnectLogo
              width={188}
              height={52}
              priority
              usage="dark"
              imageClassName="h-8 sm:h-9"
              className="shadow-sm"
              wordmarkClassName="text-2xl"
            />
          </div>

          <span className="tc-auth-badge mb-8">Uganda's #1 Bus Booking Platform</span>
          <h1 className="text-6xl font-black leading-[0.95] tracking-tight max-w-md mb-6">
            Welcome
            <br />
            back,
            <br />
            <span className="text-[#57e0be]">Traveller.</span>
          </h1>
          <p className="text-lg text-[#c6d7ef] max-w-md leading-relaxed mb-12">
            Sign in to view your tickets, manage bookings, and book your next journey across Uganda in seconds.
          </p>

          <div className="mt-auto border-t border-white/15 pt-7 grid grid-cols-4 gap-4 max-w-md">
            <div className="tc-auth-metric">
              <p className="text-4xl font-black text-[#57e0be]">50K+</p>
              <p className="text-xs text-[#9fb6d6]">Travellers</p>
            </div>
            <div className="tc-auth-metric">
              <p className="text-4xl font-black text-[#57e0be]">120+</p>
              <p className="text-xs text-[#9fb6d6]">Routes</p>
            </div>
            <div className="tc-auth-metric">
              <p className="text-4xl font-black text-[#57e0be]">4.8</p>
              <p className="text-xs text-[#9fb6d6]">App Rating</p>
            </div>
            <div className="tc-auth-metric">
              <p className="text-4xl font-black text-[#57e0be]">24/7</p>
              <p className="text-xs text-[#9fb6d6]">Support</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="tc-auth-right">
        <div className="tc-auth-form-shell">
          <div className="text-center mb-7">
            <Heading as="h2" className="text-[#192c45] mb-2">Sign in to your account</Heading>
            <p className="text-[#89a0bf]">Enter your credentials to access your bookings and tickets.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              className="tc-social-btn"
              onClick={() => toast('Google sign-in is coming soon. Please use email or phone OTP for now.', { icon: '⏳' })}
            >
              Google
            </button>
            <button
              type="button"
              className="tc-social-btn"
              onClick={() => toast('Facebook sign-in is coming soon. Please use email or phone OTP for now.', { icon: '⏳' })}
            >
              Facebook
            </button>
          </div>

          <div className="tc-auth-separator"><span>or sign in with email</span></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="tc-label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="tc-input !pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="tc-label">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="tc-input !pl-10 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#00D9A3] touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#5c708f]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#b8cae3] text-[#00D9A3]" defaultChecked />
                Remember me
              </label>
              <Link href="/forgot-password" className="tc-link-accent">Forgot password?</Link>
            </div>

            <StyledButton
              type="submit" 
              variant="primary" 
              size="lg"
              className="w-full touch-manipulation !py-3.5 !text-lg" 
              disabled={loading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Signing In...' : 'Sign In'}
            </StyledButton>

            <div className="tc-auth-separator"><span>or</span></div>
            <button
              type="button"
              className="tc-social-btn !h-12 !bg-[#eaf2ff] !text-[#21416f]"
              onClick={() => router.push('/login/phone-otp')}
            >
              <Smartphone className="h-4 w-4" />
              Sign in with Phone Number (OTP)
            </button>
          </form>

          <div className="text-center text-sm mt-6 text-[#8ca4c4]">
            Don't have an account?{' '}
            <Link href="/register" className="tc-link-accent">Create one free →</Link>
          </div>

          <div className="mt-8 pt-5 border-t border-[#e7eef8] text-center text-xs text-[#90a6c4]">
            {COPYRIGHT_ATTRIBUTION}
          </div>
        </div>
      </main>
    </div>
  );
}
