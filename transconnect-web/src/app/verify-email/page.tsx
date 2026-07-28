'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bus, MailOpen, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email = useMemo(() => {
    const value = searchParams.get('email') || '';
    return String(value).trim().toLowerCase();
  }, [searchParams]);

  const source = useMemo(() => searchParams.get('source') || 'signup', [searchParams]);

  const maskedEmail = useMemo(() => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (!name) return email;
    if (name.length <= 2) return `${name[0] || ''}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }, [email]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      toast.error('Missing email. Please register or login again.');
      router.push('/register');
      return;
    }

    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error('Please enter a valid 6-digit code.');
      return;
    }

    setIsVerifying(true);
    try {
      await authApi.verifyEmailOtp({ email, otp: code });
      toast.success('Email verified successfully. Welcome to TransConnect!');
      router.push('/search');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) {
      toast.error('Missing email. Please register again.');
      return;
    }

    setIsResending(true);
    try {
      const response = await authApi.resendEmailVerification(email);
      toast.success(response?.message || 'Verification code sent. Check your inbox.');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bus className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            <h1 className="ml-3 text-2xl sm:text-3xl font-bold text-gray-900">TransConnect</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Verify your email to activate your account</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-3">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MailOpen className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Enter Verification Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              We sent a 6-digit code to <span className="font-semibold text-gray-900">{maskedEmail || email}</span>
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="form-input text-center tracking-[0.5em] text-lg"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full btn-primary py-3" disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 disabled:text-gray-400"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 flex gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600" />
              <p>
                This verification protects your account and ensures only you can complete signup.
              </p>
            </div>

            <div className="text-center text-sm text-gray-600">
              <Link href={source === 'login' ? '/login' : '/register'} className="text-blue-600 hover:text-blue-700 font-medium">
                {source === 'login' ? 'Back to Login' : 'Back to Registration'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
