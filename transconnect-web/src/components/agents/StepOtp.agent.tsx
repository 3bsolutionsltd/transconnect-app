'use client';
import React, { useState, useEffect } from 'react';
import agentApi from '../../lib/agents/agentApi';
import { setAgentToken, setAgentId } from '../../lib/agents/authHelpers';

export default function StepOtp({ onNext, onBack, draft }: any) {
  const [otp, setOtp] = useState('');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let t: any;
    if (count > 0) {
      t = setInterval(() => setCount(c => c - 1), 1000);
    }
    return () => clearInterval(t);
  }, [count]);

  const resend = async () => {
    setCount(60);
    await agentApi.resendOtp(draft.phone);
  };

  const submit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await agentApi.verifyOtp({ phone: draft.phone, otp });
      setAgentToken(res.token);
      setAgentId(draft.id);
      setLoading(false);
      onNext({ token: res.token });
    } catch (error) {
      setLoading(false);
      alert('Invalid OTP. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Phone</h2>
        <p className="text-gray-600">We've sent a 6-digit code to</p>
        <p className="font-semibold text-blue-600">{draft.phone}</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Enter Verification Code
          </label>
          <input 
            value={otp} 
            onChange={(e)=>setOtp(e.target.value)} 
            required 
            className="w-full px-4 py-4 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors tracking-widest" 
            maxLength={6}
            placeholder="000000"
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">Didn't receive the code?</p>
          <button 
            type="button" 
            disabled={count>0} 
            onClick={resend} 
            className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {count>0 ? `Resend in ${count}s` : 'Resend Code'}
          </button>
        </div>

        <div className="flex justify-between pt-4">
          <button 
            type="button" 
            onClick={onBack} 
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button 
            disabled={loading || otp.length !== 6} 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify & Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}