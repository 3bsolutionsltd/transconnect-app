'use client';
import React from 'react';
import Link from 'next/link';
import { useAgentAuth, logoutAgent } from '../../lib/agents/authHelpers';

interface AgentHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
}

export default function AgentHeader({ 
  title = "Agent Dashboard", 
  subtitle,
  showBackButton = true,
  backUrl = "/agents",
  backText = "Back to Home"
}: AgentHeaderProps) {
  const { agentId, isAuthenticated } = useAgentAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logoutAgent();
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <>
                <Link 
                  href={backUrl}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {backText}
                </Link>
                <div className="text-gray-300">|</div>
              </>
            )}
            <Link 
              href="/agents/dashboard" 
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Dashboard
            </Link>
            <div className="text-gray-300">|</div>
            <Link 
              href="/agents/operators/register" 
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Register Operator
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <button 
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-red-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">TC</span>
            </div>
            <span className="text-sm text-gray-600">Agent ID: {agentId?.slice(-6) || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}