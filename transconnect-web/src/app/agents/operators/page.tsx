'use client';
import React, { useEffect, useState } from 'react';
import { useAgentAuth } from '../../../lib/agents/authHelpers';
import agentOperatorAPI from '../../../lib/agents/operatorApi';

interface OperatorSummary {
  totalOperators: number;
  activeOperators: number;
  pendingOperators: number;
  totalRevenue: number;
  totalBookings: number;
  totalRoutes: number;
  totalBuses: number;
}

interface TopOperator {
  id: string;
  companyName: string;
  revenue: number;
  bookings: number;
}

interface RecentOperator {
  id: string;
  companyName: string;
  approved: boolean;
  createdAt: string;
  stats: {
    totalRoutes: number;
    totalBuses: number;
    bookingsLast30Days: number;
    revenueLast30Days: number;
  };
}

interface DashboardData {
  summary: OperatorSummary;
  topOperators: TopOperator[];
  recentOperators: RecentOperator[];
}

export default function AgentOperatorsPage() {
  const { token, agentId, clearAuth } = useAgentAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false); // Enable real API calls

  useEffect(() => {
    async function loadDashboard() {
      // Use real API if agent is authenticated
      if (!agentId || !token) {
        // Set demo data for testing
        setDashboardData({
          summary: {
            totalOperators: 3,
            activeOperators: 2,
            pendingOperators: 1,
            totalRevenue: 2500000,
            totalBookings: 150,
            totalRoutes: 12,
            totalBuses: 8
          },
          topOperators: [
            { id: '1', companyName: 'Express Bus Co.', revenue: 1200000, bookings: 80 },
            { id: '2', companyName: 'Swift Transport Ltd', revenue: 900000, bookings: 45 },
            { id: '3', companyName: 'City Link Buses', revenue: 400000, bookings: 25 }
          ],
          recentOperators: [
            {
              id: '1',
              companyName: 'Express Bus Co.',
              approved: true,
              createdAt: '2025-11-20T10:00:00Z',
              stats: { totalRoutes: 5, totalBuses: 3, bookingsLast30Days: 80, revenueLast30Days: 1200000 }
            },
            {
              id: '2',
              companyName: 'Swift Transport Ltd',
              approved: true,
              createdAt: '2025-11-18T14:30:00Z',
              stats: { totalRoutes: 4, totalBuses: 2, bookingsLast30Days: 45, revenueLast30Days: 900000 }
            },
            {
              id: '3',
              companyName: 'City Link Buses',
              approved: false,
              createdAt: '2025-11-22T09:15:00Z',
              stats: { totalRoutes: 3, totalBuses: 3, bookingsLast30Days: 25, revenueLast30Days: 400000 }
            }
          ]
        });
        setLoading(false);
        return;
      }

      try {
        const response = await agentOperatorAPI.getOperatorDashboard(agentId, token || undefined);
        setDashboardData(response.dashboard);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to load operator dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [agentId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading operator dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <a 
                href="/agents/dashboard" 
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </a>
              <div className="text-gray-300">|</div>
              <a 
                href="/agents/operators/register" 
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Register Operator
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {demoMode && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  Demo Mode
                </div>
              )}
              <button
                onClick={() => {
                  clearAuth();
                  setDemoMode(true);
                  window.location.reload();
                }}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Reset Demo
              </button>
            </div>
          </div>

          {/* Page Title */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Operator Management</h1>
              <p className="text-gray-600 mt-1">Manage your registered bus operators and track their performance</p>
            </div>
            
            {/* Primary Action Buttons - Moved to Header */}
            <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
              <a
                href="/agents/operators/register"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Register New Operator
              </a>
              <a
                href="/agents/operators/list"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                View All Operators
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Operators</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.summary.totalOperators || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">
                {dashboardData?.summary.activeOperators || 0} Active
              </span>
              <span className="text-yellow-600 ml-3">
                {dashboardData?.summary.pendingOperators || 0} Pending
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  UGX {(dashboardData?.summary.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              From {dashboardData?.summary.totalBookings || 0} bookings
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.summary.totalRoutes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Across all operators
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Buses</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData?.summary.totalBuses || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Fleet size
            </div>
          </div>
        </div>

        {/* Top Operators and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Operators */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Operators</h3>
            <div className="space-y-4">
              {dashboardData?.topOperators.map((operator, index) => (
                <div key={operator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{operator.companyName}</h4>
                      <p className="text-sm text-gray-600">{operator.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">UGX {operator.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">30 days</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Operators */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Operators</h3>
            <div className="space-y-4">
              {dashboardData?.recentOperators.map((operator) => (
                <div key={operator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${operator.approved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{operator.companyName}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(operator.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {operator.stats.totalRoutes} routes
                    </p>
                    <p className="text-xs text-gray-600">
                      {operator.approved ? 'Active' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}