'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgentAuth } from '../../lib/agents/authHelpers';

interface AgentAuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AgentAuthGuard({ children, redirectTo = '/agents/login' }: AgentAuthGuardProps) {
  const { isAuthenticated } = useAgentAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}