'use client';
import React, { useState } from 'react';
import agentApi from '../../lib/agents/agentApi';

export default function StepBasicInfo({ onNext, draft }: any) {
  const [loading, setLoading] = useState(false);

  const submit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    const payload = {
      name: form.get('name'),
      phone: form.get('phone'),
      email: form.get('email'),
      referralCode: form.get('referralCode')
    };
    try {
      const res = await agentApi.register(payload);
      setLoading(false);
      onNext({ id: res.agent?.id, phone: payload.phone, name: payload.name });
    } catch (error) {
      setLoading(false);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's get started</h2>
        <p className="text-gray-600">Tell us a bit about yourself to create your agent account</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input 
              name="name" 
              defaultValue={draft.name || ''} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input 
              name="phone" 
              defaultValue={draft.phone || ''} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              placeholder="+256 700 000 000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input 
            name="email" 
            type="email"
            defaultValue={draft.email || ''} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            placeholder="your.email@example.com (optional)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral Code
          </label>
          <input 
            name="referralCode" 
            defaultValue={draft.referralCode || ''} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
            placeholder="Enter referral code if you have one"
          />
          <p className="mt-1 text-sm text-gray-500">Optional: If someone referred you, enter their code here</p>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            disabled={loading} 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              <span className="flex items-center">
                Continue
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}