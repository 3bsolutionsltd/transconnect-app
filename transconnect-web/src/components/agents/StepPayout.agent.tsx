'use client';
import React, { useState } from 'react';
import agentApi from '../../lib/agents/agentApi';

export default function StepPayout({ onNext, onBack, draft }: any) {
  const [loading, setLoading] = useState(false);

  const submit = async (e:any) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    const profile = {
      momoNumber: form.get('momoNumber'),
      bankName: form.get('bankName'),
      bankAccount: form.get('bankAccount'),
    };
    try {
      await agentApi.saveProfile(draft.id, profile);
      setLoading(false);
      onNext({ profile });
    } catch (error) {
      setLoading(false);
      // Continue anyway as this is optional
      onNext({ profile });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm">Mobile money number</span>
        <input 
          name="momoNumber" 
          defaultValue={draft.profile?.momoNumber || ''} 
          className="w-full p-2 border rounded" 
          placeholder="+256700000000"
        />
      </label>
      <label className="block">
        <span className="text-sm">Bank name (optional)</span>
        <input 
          name="bankName" 
          defaultValue={draft.profile?.bankName || ''} 
          className="w-full p-2 border rounded" 
          placeholder="e.g. Stanbic Bank"
        />
      </label>
      <label className="block">
        <span className="text-sm">Bank account (optional)</span>
        <input 
          name="bankAccount" 
          defaultValue={draft.profile?.bankAccount || ''} 
          className="w-full p-2 border rounded" 
          placeholder="Account number"
        />
      </label>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="px-3 py-2 border rounded">Back</button>
        <button 
          disabled={loading} 
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Next'}
        </button>
      </div>
    </form>
  );
}