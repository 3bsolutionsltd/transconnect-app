'use client';
import React, { useState, useEffect } from 'react';
import StepBasicInfo from './StepBasicInfo.agent';
import StepOtp from './StepOtp.agent';
import StepKycUpload from './StepKycUpload.agent';
import StepPayout from './StepPayout.agent';
import StepSummary from './StepSummary.agent';

const DRAFT_KEY = 'agent_onboard';

const steps = [
  { id: 1, name: 'Basic Info', description: 'Personal details' },
  { id: 2, name: 'Verification', description: 'Phone & OTP' },
  { id: 3, name: 'KYC Upload', description: 'ID verification' },
  { id: 4, name: 'Payout Setup', description: 'Payment details' },
  { id: 5, name: 'Complete', description: 'All done!' }
];

export default function OnboardingFlow({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<any>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const savedDraft = JSON.parse(saved);
        setDraft(savedDraft);
        
        // Resume from the correct step based on progress
        if (savedDraft.profile) {
          setStep(5); // Completed all steps
        } else if (savedDraft.kycUploaded) {
          setStep(4); // KYC uploaded, go to payout
        } else if (savedDraft.token) {
          setStep(3); // OTP verified, go to KYC
        } else if (savedDraft.id) {
          setStep(2); // Registered, go to OTP
        }
      }
    } catch {}
  }, []);

  const save = (patch: any) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  };

  const next = (patch?: any) => {
    if (patch) save(patch);
    setStep(s => s + 1);
  };

  const back = () => setStep(s => Math.max(1, s - 1));

  return (
    <div>
      {/* Resume Indicator */}
      {step > 1 && draft.name && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-800 font-medium">Resuming Registration</p>
              <p className="text-blue-600 text-sm">Welcome back, {draft.name}! Continue where you left off.</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((stepItem, index) => (
            <div key={stepItem.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                step > stepItem.id
                  ? 'bg-green-500 border-green-500 text-white'
                  : step === stepItem.id
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {step > stepItem.id ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{stepItem.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-0.5 mx-4 transition-all duration-300 ${
                  step > stepItem.id ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((stepItem) => (
            <div key={stepItem.id} className="text-center flex-1">
              <div className={`text-sm font-medium transition-colors ${
                step >= stepItem.id ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {stepItem.name}
              </div>
              <div className={`text-xs mt-1 transition-colors ${
                step >= stepItem.id ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {stepItem.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && <StepBasicInfo onNext={(p:any)=>{save(p); next();}} draft={draft} />}
        {step === 2 && <StepOtp onNext={(p:any)=>{save(p); next();}} onBack={back} draft={draft} />}
        {step === 3 && <StepKycUpload onNext={(p:any)=>{save(p); next();}} onBack={back} draft={draft} />}
        {step === 4 && <StepPayout onNext={(p:any)=>{save(p); next();}} onBack={back} draft={draft} />}
        {step === 5 && <StepSummary draft={draft} onBack={back} onComplete={onComplete} />}
      </div>
    </div>
  );
}