'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export function useLogin() {
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
      const requiresVerification =
        error?.response?.status === 403 &&
        error?.response?.data?.code === 'EMAIL_VERIFICATION_REQUIRED';

      if (requiresVerification) {
        const normalizedEmail = String(email).trim().toLowerCase();
        toast.error('Your account is not verified yet. Enter your email code to continue.');
        router.push(`/verify-email?email=${encodeURIComponent(normalizedEmail)}&source=login`);
        return;
      }

      toast.error(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, showPassword, setShowPassword, loading, handleSubmit };
}
