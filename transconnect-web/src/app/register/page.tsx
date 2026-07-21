'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, UserPlus, Mail, Lock, Phone, User, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { StyledButton, Heading } from '@/components/styled';
import TransConnectLogo from '@/components/branding/TransConnectLogo';
import { COPYRIGHT_ATTRIBUTION } from '@/lib/links';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'PASSENGER' as const // Fixed as PASSENGER for public registration
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerificationStep, setEmailVerificationStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const router = useRouter();

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    console.log('Form submitted', formData); // Debug log
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...userData } = formData;
      console.log('Sending registration data:', userData); // Debug log
      
      const result = await authApi.register(userData);
      console.log('Registration successful:', result); // Debug log

      if (result?.verificationRequired) {
        setVerificationEmail(result?.user?.email || userData.email);
        setEmailVerificationStep(true);
        toast.success(result?.verificationDelivery?.message || 'Account created. Enter the verification code sent to your email.');
      } else if (result?.token && result?.user) {
        toast.success(`Welcome to TransConnect, ${result.user.firstName}!`);
        router.push('/search');
      } else {
        toast.success('Account created successfully. Please sign in.');
        router.push('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (emailOtp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.verifyEmailOtp(verificationEmail, emailOtp);
      toast.success(result?.message || 'Email verified successfully');
      router.push('/search');
    } catch (error: any) {
      console.error('Email OTP verification error:', error);
      toast.error(error.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmailOtp() {
    if (!verificationEmail) return;
    setLoading(true);
    try {
      const result = await authApi.resendEmailVerification(verificationEmail);
      toast.success(result?.message || 'Verification code resent successfully');
    } catch (error: any) {
      console.error('Resend email OTP error:', error);
      toast.error(error.response?.data?.error || 'Failed to resend code. Please try again.');
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

          <span className="tc-auth-badge mb-8">Join 50K+ Travellers</span>
          <h1 className="text-6xl font-black leading-[0.95] tracking-tight max-w-md mb-6">
            Start travelling
            <br />
            <span className="text-[#57e0be]">smarter today.</span>
          </h1>
          <p className="text-lg text-[#c6d7ef] max-w-md leading-relaxed mb-8">
            Create your free TransConnect account and get instant access to bus routes, digital tickets, and mobile money payments across Uganda.
          </p>

          <ul className="space-y-3 text-[#d5e4f8] text-sm max-w-md">
            <li className="flex items-center gap-3"><span className="h-8 w-8 rounded-lg bg-[#1f8f7f]/40 flex items-center justify-center">✓</span>Book tickets in under 60 seconds</li>
            <li className="flex items-center gap-3"><span className="h-8 w-8 rounded-lg bg-[#1f8f7f]/40 flex items-center justify-center">✓</span>Digital QR tickets — no printing needed</li>
            <li className="flex items-center gap-3"><span className="h-8 w-8 rounded-lg bg-[#1f8f7f]/40 flex items-center justify-center">✓</span>Pay via MTN MoMo or Airtel Money</li>
            <li className="flex items-center gap-3"><span className="h-8 w-8 rounded-lg bg-[#1f8f7f]/40 flex items-center justify-center">✓</span>Transfer tickets to family and friends</li>
          </ul>

          <div className="mt-auto pt-8 text-[#9fb6d6] text-sm">
            Already have an account? <Link href="/login" className="text-[#57e0be] font-semibold">Sign in here →</Link>
          </div>
        </div>
      </aside>

      <main className="tc-auth-right">
        <div className="tc-auth-form-shell">
          <div className="text-center mb-7">
            <Heading as="h2" className="text-[#192c45] mb-2">Create your account</Heading>
            <p className="text-[#89a0bf]">
              {emailVerificationStep
                ? 'Enter the 6-digit code sent to your email to activate your account.'
                : 'Fill in the details below — takes less than 2 minutes.'}
            </p>
          </div>

          {!emailVerificationStep && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                className="tc-social-btn"
                onClick={() => toast('Google sign-up is coming soon. Please use email or phone OTP for now.', { icon: '⏳' })}
              >
                Continue with Google
              </button>
              <button
                type="button"
                className="tc-social-btn"
                onClick={() => toast('Facebook sign-up is coming soon. Please use email or phone OTP for now.', { icon: '⏳' })}
              >
                Continue with Facebook
              </button>
            </div>
          )}

          <div className="tc-auth-separator"><span>{emailVerificationStep ? 'verify your email' : 'or register with email'}</span></div>

          {!emailVerificationStep ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="tc-label">
                  First Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. Busega"
                    className="tc-input !pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="tc-label">
                  Last Name
                </label>
                <div className="relative">
                  <UserRound className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Kibuumbiro"
                    className="tc-input !pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="tc-label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="tc-input !pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="tc-label">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+256 7XX XXX XXX"
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min. 8 characters"
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

            <div>
              <label htmlFor="confirmPassword" className="tc-label">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#8ca4c4] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  className="tc-input !pl-10 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#00D9A3] touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl bg-[#eef4ff] p-3 text-sm text-[#4f6585]">
              <input type="checkbox" className="h-4 w-4 mt-0.5 rounded border-[#b8cae3] text-[#00D9A3]" defaultChecked />
              <span>
                I agree to TransConnect's <Link href="/terms" className="tc-link-accent">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="tc-link-accent">Privacy Policy</Link>.
              </span>
            </label>

            <StyledButton
              type="submit" 
              variant="primary" 
              size="lg"
              className="w-full touch-manipulation mt-2 !py-3.5 !text-lg"
              disabled={loading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </StyledButton>

            <button
              type="button"
              className="tc-social-btn !h-12"
              onClick={() => router.push('/login/phone-otp')}
            >
              Register with Phone Number (OTP)
            </button>
          </form>
          ) : (
          <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
            <div>
              <label htmlFor="verificationEmail" className="tc-label">Email Address</label>
              <input
                id="verificationEmail"
                type="email"
                value={verificationEmail}
                readOnly
                className="tc-input bg-[#f3f7fd]"
              />
            </div>

            <div>
              <label htmlFor="emailOtp" className="tc-label">Verification Code</label>
              <input
                id="emailOtp"
                type="text"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
              className="w-full touch-manipulation mt-2 !py-3.5 !text-lg"
              disabled={loading || emailOtp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email & Continue'}
            </StyledButton>

            <button
              type="button"
              className="tc-social-btn !h-12"
              onClick={handleResendEmailOtp}
              disabled={loading}
            >
              Resend Verification Code
            </button>
          </form>
          )}

          <div className="text-center text-sm mt-6 text-[#8ca4c4]">
            Already have an account? <Link href="/login" className="tc-link-accent">Sign in →</Link>
          </div>

          <div className="mt-8 pt-5 border-t border-[#e7eef8] text-center text-xs text-[#90a6c4]">
            {COPYRIGHT_ATTRIBUTION}
          </div>
          <div className="text-center mt-4">
            <Link href="/" className="tc-link-accent text-sm">Back to Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
