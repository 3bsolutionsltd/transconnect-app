'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Heading, StyledButton } from '@/components/styled';
import TransConnectLogo from '@/components/branding/TransConnectLogo';
import { COPYRIGHT_ATTRIBUTION } from '@/lib/links';

export default function PhoneOtpLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedPhone = (value: string) => value.replace(/[^\d+]/g, '');

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (normalizedPhone(phoneNumber).length < 10) {
      toast.error('Enter a valid phone number, e.g. +256700123456');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.requestPhoneOtp(normalizedPhone(phoneNumber));
      toast.success(result?.message || 'OTP sent successfully');
      setStep('otp');
    } catch (error: any) {
      console.error('Request OTP error:', error);
      toast.error(error.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.verifyPhoneOtp(normalizedPhone(phoneNumber), otp);
      if (result?.isNewUser) {
        toast.success('Welcome to TransConnect. Your account has been created.');
      } else {
        toast.success('Signed in successfully');
      }
      router.push('/search');
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast.error(error.response?.data?.error || 'Invalid or expired OTP. Please try again.');
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

          <span className="tc-auth-badge mb-8">Phone OTP Access</span>
          <h1 className="text-6xl font-black leading-[0.95] tracking-tight max-w-md mb-6">
            Quick access
            <br />
            <span className="text-[#57e0be]">with OTP.</span>
          </h1>
          <p className="text-lg text-[#c6d7ef] max-w-md leading-relaxed mb-8">
            Use your phone number to sign in instantly. If this is your first time, we will create your passenger account automatically.
          </p>

          <div className="mt-auto pt-8 text-[#9fb6d6] text-sm">
            Prefer password login? <Link href="/login" className="text-[#57e0be] font-semibold">Use email sign in →</Link>
          </div>
        </div>
      </aside>

      <main className="tc-auth-right">
        <div className="tc-auth-form-shell">
          <div className="text-center mb-7">
            <Heading as="h2" className="text-[#192c45] mb-2">{step === 'phone' ? 'Sign in with Phone OTP' : 'Verify OTP code'}</Heading>
            <p className="text-[#89a0bf]">
              {step === 'phone'
                ? 'Enter your phone number to receive a one-time verification code.'
                : `Enter the 6-digit code sent to ${phoneNumber}.`}
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="tc-label">Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(normalizedPhone(e.target.value))}
                  placeholder="+256700123456"
                  className="tc-input"
                  required
                />
              </div>

              <StyledButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full touch-manipulation !py-3.5 !text-lg"
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </StyledButton>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="tc-label">6-digit OTP Code</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="tc-input text-center tracking-[0.35em]"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>

              <StyledButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full touch-manipulation !py-3.5 !text-lg"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </StyledButton>

              <button
                type="button"
                className="tc-social-btn !h-12"
                onClick={handleRequestOtp}
                disabled={loading}
              >
                Resend OTP
              </button>

              <button
                type="button"
                className="tc-social-btn !h-12"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                disabled={loading}
              >
                Change Phone Number
              </button>
            </form>
          )}

          <div className="text-center text-sm mt-6 text-[#8ca4c4]">
            New here? <Link href="/register" className="tc-link-accent">Create account with email →</Link>
          </div>

          <div className="mt-8 pt-5 border-t border-[#e7eef8] text-center text-xs text-[#90a6c4]">
            {COPYRIGHT_ATTRIBUTION}
          </div>
        </div>
      </main>
    </div>
  );
}
