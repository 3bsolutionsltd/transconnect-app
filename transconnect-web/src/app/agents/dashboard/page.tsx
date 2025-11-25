'use client';
import React, { useEffect, useState } from 'react';
import agentApi from '../../../lib/agents/agentApi';
import { useAgentAuth, logoutAgent } from '../../../lib/agents/authHelpers';
import BalanceCard from '../../../components/agents/BalanceCard.agent';
import PendingCommissionsList from '../../../components/agents/PendingCommissionsList.agent';
import ReferralShare from '../../../components/agents/ReferralShare.agent';
import DownlineView from '../../../components/agents/DownlineView.agent';

export default function AgentDashboardPage() {
  const { token, agentId } = useAgentAuth();
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  useEffect(() => {
    async function load() {
      if (!agentId) {
        console.warn('No agent ID found. Setting demo data for testing...');
        // Set demo data when no agent ID is found (for testing)
        setData({
          agent: { name: 'Stephen Omwony', referralCode: 'STEP6946' },
          wallet: { balance: 25000 },
          pendingCommissions: [
            { id: 1, amount: 2500, type: 'Direct Referral', date: '2025-11-24', status: 'pending' },
            { id: 2, amount: 1250, type: 'Level 2 Commission', date: '2025-11-23', status: 'pending' }
          ],
          downline: [
            { id: 1, name: 'John Doe', phone: '256701234567', joinDate: '2025-11-20', status: 'active' },
            { id: 2, name: 'Jane Smith', phone: '256709876543', joinDate: '2025-11-22', status: 'pending' }
          ]
        });
        // Set some demo notifications
        setNotifications([
          'New referral: John Doe joined using your link!',
          'Commission earned: UGX 2,500 from direct referral',
          'KYC verification pending - complete to unlock withdrawals'
        ]);
        // Set some demo notifications
        setNotifications([
          'New referral: John Doe joined using your link!',
          'Commission earned: UGX 2,500 from direct referral',
          'KYC verification pending - complete to unlock withdrawals'
        ]);
        return;
      }
      
      try {
        const resp = await agentApi.getDashboard(agentId, token);
        setData(resp);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Set fallback data on API error
        setData({
          agent: { name: 'Stephen Omwony', referralCode: 'STEP6946' },
          wallet: { balance: 25000 },
          pendingCommissions: [],
          downline: []
        });
      }
    }
    load();
  }, [token, agentId]);

  // Interactive functions
  const copyReferralLink = () => {
    const link = `http://localhost:3000/agents/register?ref=${data?.agent?.referralCode}`;
    navigator.clipboard.writeText(link);
    setNotifications(prev => ['Referral link copied to clipboard!', ...prev.slice(0, 4)]);
  };

  const shareReferralLink = () => {
    const link = `http://localhost:3000/agents/register?ref=${data?.agent?.referralCode}`;
    const text = `Join TransConnect as an agent and earn commissions! Use my referral link: ${link}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Join TransConnect', text, url: link });
    } else {
      // Fallback to copying
      navigator.clipboard.writeText(text);
      setNotifications(prev => ['Referral message copied to clipboard!', ...prev.slice(0, 4)]);
    }
  };

  const handleWithdrawal = () => {
    const amount = parseInt(withdrawalAmount);
    if (amount < 10000) {
      setNotifications(prev => ['Minimum withdrawal amount is UGX 10,000', ...prev.slice(0, 4)]);
      return;
    }
    if (amount > data?.wallet?.balance) {
      setNotifications(prev => ['Insufficient balance for withdrawal', ...prev.slice(0, 4)]);
      return;
    }
    
    // Simulate withdrawal request
    setNotifications(prev => [`Withdrawal request for UGX ${amount.toLocaleString()} submitted!`, ...prev.slice(0, 4)]);
    setShowWithdrawalModal(false);
    setWithdrawalAmount('');
  };

  const dismissNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <a 
                href="/" 
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </a>
              <div className="text-gray-300">|</div>
              <a 
                href="/agents/onboard" 
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Registration
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to logout?')) {
                    logoutAgent();
                  }
                }}
                className="flex items-center text-gray-600 hover:text-red-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Dashboard Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {data?.agent?.name || 'Agent'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">TC</span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{data?.agent?.name || 'Agent'}</div>
                <div className="text-gray-500">ID: {data?.agent?.referralCode}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.slice(0, 3).map((notification, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-start justify-between animate-slide-in"
            >
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-sm text-gray-800">{notification}</p>
              </div>
              <button
                onClick={() => dismissNotification(index)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Request Withdrawal</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (UGX)
              </label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="Minimum 10,000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available balance: UGX {data?.wallet?.balance?.toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawal}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Demo Notice */}
        {!agentId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Mode:</strong> This dashboard is showing sample data. 
                  <a href="/agents/onboard" className="font-medium underline hover:text-yellow-900 ml-1">
                    Complete your registration
                  </a> to access your real dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Row - Balance and Referral */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {/* Enhanced Balance Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-100">Available Balance</h3>
                    <div className="text-3xl font-bold mt-2">UGX {data.wallet?.balance?.toLocaleString() ?? '0'}</div>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">UGX 125K</div>
                      <div className="text-xs text-gray-500">This Month</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">UGX 45K</div>
                      <div className="text-xs text-gray-500">This Week</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowWithdrawalModal(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                      </svg>
                      Request Withdrawal
                    </span>
                  </button>
                  <p className="text-xs text-gray-500 text-center">Minimum withdrawal: UGX 10,000 • Instant processing</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            {/* Enhanced Referral Share */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-fit">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-100">Your Referral Code</h3>
                    <div className="font-mono mt-2 text-xl font-bold">{data.agent?.referralCode}</div>
                  </div>
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Referral Link</div>
                  <div className="text-sm font-mono text-gray-800 break-all">
                    http://localhost:3000/agents/register?ref={data.agent?.referralCode}
                  </div>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={copyReferralLink}
                    className="w-full px-4 py-3 border rounded-lg transition-all duration-300 font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      Copy Link
                    </span>
                  </button>
                  <button 
                    onClick={shareReferralLink}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                      </svg>
                      Share Link
                    </span>
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Earn up to 10% commission on referrals</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Three sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PendingCommissionsList items={data.pendingCommissions || []} />
          <DownlineView downline={data.downline || []} />
          
          {/* Operator Management Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-purple-100">Operator Management</h3>
                  <div className="text-2xl font-bold mt-2">Manage Operators</div>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Operators</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">12</div>
                    <div className="text-xs text-gray-500">Routes</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <a
                    href="/agents/operators"
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold text-center block"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      View Dashboard
                    </span>
                  </a>
                  <a
                    href="/agents/operators/register"
                    className="w-full px-4 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 font-medium text-center block"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Register Operator
                    </span>
                  </a>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Manage your bus operators and earn commissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}