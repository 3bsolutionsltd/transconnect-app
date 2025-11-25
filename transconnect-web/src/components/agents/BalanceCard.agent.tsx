'use client';
import React from 'react';

export default function BalanceCard({ balance = 0 }: { balance?: number }) {
  const handleWithdraw = () => {
    // TODO: Implement withdrawal modal/flow
    alert('Withdrawal feature coming soon!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-100">Available Balance</h3>
            <div className="text-3xl font-bold mt-2">UGX {balance.toLocaleString()}</div>
          </div>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
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
            onClick={handleWithdraw}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Request Withdrawal
            </span>
          </button>
          
          <p className="text-xs text-gray-500 text-center">Minimum withdrawal: UGX 10,000 • Instant processing</p>
        </div>
      </div>
    </div>
  );
}