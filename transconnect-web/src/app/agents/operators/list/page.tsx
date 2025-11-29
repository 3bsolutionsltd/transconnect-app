'use client';
import React, { useEffect, useState } from 'react';
import { useAgentAuth } from '../../../../lib/agents/authHelpers';
import agentOperatorAPI from '../../../../lib/agents/operatorApi';

interface Operator {
  id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  license: string;
  approved: boolean;
  createdAt: string;
  stats: {
    totalRoutes: number;
    totalBuses: number;
    bookingsLast30Days: number;
    revenueLast30Days: number;
  };
}

export default function OperatorListPage() {
  const { token, agentId, clearAuth } = useAgentAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [demoMode, setDemoMode] = useState(false); // Use real database data

  useEffect(() => {
    async function loadOperators() {
      // Use demo mode only when explicitly enabled or missing auth
      if (demoMode || !agentId || !token) {
        // Set demo data for testing
        setOperators([
          {
            id: '1',
            companyName: 'Express Bus Company Ltd',
            firstName: 'John',
            lastName: 'Mukasa',
            email: 'john@expressbus.ug',
            phone: '256701234567',
            license: 'EBC-001-2025',
            approved: true,
            createdAt: '2025-11-20T10:00:00Z',
            stats: { totalRoutes: 5, totalBuses: 3, bookingsLast30Days: 80, revenueLast30Days: 1200000 }
          },
          {
            id: '2',
            companyName: 'Swift Transport Limited',
            firstName: 'Mary',
            lastName: 'Namuli',
            email: 'mary@swifttransport.ug',
            phone: '256702345678',
            license: 'STL-002-2025',
            approved: true,
            createdAt: '2025-11-18T14:30:00Z',
            stats: { totalRoutes: 4, totalBuses: 2, bookingsLast30Days: 45, revenueLast30Days: 900000 }
          },
          {
            id: '3',
            companyName: 'City Link Bus Services',
            firstName: 'David',
            lastName: 'Okello',
            email: 'david@citylink.ug',
            phone: '256703456789',
            license: 'CLB-003-2025',
            approved: false,
            createdAt: '2025-11-22T09:15:00Z',
            stats: { totalRoutes: 3, totalBuses: 3, bookingsLast30Days: 25, revenueLast30Days: 400000 }
          },
          {
            id: '4',
            companyName: 'Golden Arrow Coaches',
            firstName: 'Sarah',
            lastName: 'Akello',
            email: 'sarah@goldenarrow.ug',
            phone: '256704567890',
            license: 'GAC-004-2025',
            approved: true,
            createdAt: '2025-11-15T16:45:00Z',
            stats: { totalRoutes: 6, totalBuses: 4, bookingsLast30Days: 95, revenueLast30Days: 1500000 }
          },
          {
            id: '5',
            companyName: 'Metro Line Transport',
            firstName: 'James',
            lastName: 'Tukei',
            email: 'james@metroline.ug',
            phone: '256705678901',
            license: 'MLT-005-2025',
            approved: false,
            createdAt: '2025-11-23T11:20:00Z',
            stats: { totalRoutes: 2, totalBuses: 1, bookingsLast30Days: 12, revenueLast30Days: 180000 }
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        const response = await agentOperatorAPI.getAgentOperators(agentId, token || undefined);
        setOperators(response.operators || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Failed to load operators:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOperators();
  }, [agentId, token, demoMode]);

  // Filter operators based on search term and status
  const filteredOperators = operators.filter(operator => {
    const matchesSearch = operator.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operator.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && operator.approved) ||
                         (statusFilter === 'pending' && !operator.approved);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading operators...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Operators</h2>
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
                href="/agents/operators" 
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

          {/* Page Title and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Operators</h1>
              <p className="text-gray-600 mt-1">Complete list of your registered bus operators</p>
            </div>
            
            <div className="mt-4 lg:mt-0">
              <a
                href="/agents/operators/register"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Register New Operator
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search operators by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'pending')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 text-sm text-gray-600">
          Showing {filteredOperators.length} of {operators.length} operators
        </div>

        {/* Operators Grid/Table */}
        {filteredOperators.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No operators found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start by registering your first operator.'}
            </p>
            <a
              href="/agents/operators/register"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Register First Operator
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOperators.map((operator) => (
              <div key={operator.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    operator.approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {operator.approved ? 'Active' : 'Pending Approval'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(operator.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Company Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{operator.companyName}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {operator.firstName} {operator.lastName}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">{operator.email}</p>
                  <p className="text-sm text-gray-500">📱 {operator.phone}</p>
                  <p className="text-xs text-gray-400 mt-2">License: {operator.license}</p>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{operator.stats.totalRoutes}</div>
                    <div className="text-xs text-gray-600">Routes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{operator.stats.totalBuses}</div>
                    <div className="text-xs text-gray-600">Buses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{operator.stats.bookingsLast30Days}</div>
                    <div className="text-xs text-gray-600">Bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {(operator.stats.revenueLast30Days / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-gray-600">Revenue (UGX)</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}