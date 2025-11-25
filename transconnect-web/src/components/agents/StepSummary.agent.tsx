'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function StepSummary({ draft, onBack, onComplete }: any) {
  const router = useRouter();

  const handleComplete = () => {
    // Clear the draft
    localStorage.removeItem('agent_onboard');
    
    if (onComplete) {
      onComplete();
    } else {
      // Navigate to dashboard
      router.push('/agents/dashboard');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Registration Complete!</h2>
      <div className="p-4 border rounded bg-green-50">
        <p className="text-green-800"><strong>✅ Account Created</strong></p>
        <p className="text-sm text-green-700 mt-1">Your agent account has been successfully created and is pending approval.</p>
      </div>
      
      <div className="p-4 border rounded">
        <p><strong>Name:</strong> {draft.name}</p>
        <p><strong>Phone:</strong> {draft.phone}</p>
        {draft.email && <p><strong>Email:</strong> {draft.email}</p>}
        <p><strong>Status:</strong> <span className="text-yellow-600">Pending Verification</span></p>
      </div>
      
      <div className="p-4 border rounded bg-blue-50">
        <p className="text-blue-800"><strong>Next Steps:</strong></p>
        <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
          <li>Your KYC documents are being reviewed</li>
          <li>You'll receive an SMS when approved</li>
          <li>Once approved, you can start earning commissions</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-3 py-2 border rounded">Back</button>
        <button onClick={handleComplete} className="px-4 py-2 bg-green-600 text-white rounded">
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}