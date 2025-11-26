'use client';
import React, { useState } from 'react';
import agentApi from '../../lib/agents/agentApi';
import uploadToPresigned from '../../lib/agents/fileUpload';

export default function StepKycUpload({ onNext, onBack, draft }: any) {
  const [file, setFile] = useState<File|null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const submit = async (e:any) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    try {
      // Get presigned URL from backend
      const presign = await agentApi.getPresign(file.name, file.type, draft.id);
      
      // Check if we're in demo mode based on the URL
      const isDemoMode = presign.uploadUrl.includes('demo-upload.transconnect.app');
      
      if (isDemoMode) {
        console.log('📄 [DEMO MODE] Starting KYC upload simulation...');
      }
      
      // Upload file (will be simulated if demo mode)
      await uploadToPresigned(presign.uploadUrl, file, (p:number)=>setProgress(p));
      
      // Confirm upload with backend
      await agentApi.uploadKyc(draft.id, presign.fileKey);
      
      setLoading(false);
      onNext({ kycUploaded: true, fileName: file.name, fileSize: file.size });
    } catch (error) {
      setLoading(false);
      console.error('Upload error:', error);
      alert('Upload failed. Please make sure the backend server is running and try again.');
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your ID</h2>
        <p className="text-gray-600">We need to verify your identity for security and compliance</p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-md">
            <p className="text-xs text-yellow-800">
              🧪 Demo Mode: File uploads will be simulated
            </p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input 
            type="file" 
            accept=".jpg,.jpeg,.png,.pdf" 
            onChange={(e)=>setFile(e.target.files?.[0] ?? null)} 
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Upload your ID document</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG, or PDF • Max 10MB</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-xs text-blue-800 font-medium mb-2">Accepted documents:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• National ID</li>
                  <li>• Passport</li>
                  <li>• Driver's License</li>
                </ul>
              </div>
            </div>
          </label>
        </div>

        {file && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-2 text-sm font-medium text-gray-900">{file.name}</span>
              </div>
              <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        )}

        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-blue-600 font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                style={{width: `${progress}%`}} 
                className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
              ></div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button 
            type="button" 
            onClick={onBack} 
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
          <button 
            disabled={!file || loading} 
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 font-semibold"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              <span className="flex items-center">
                Upload & Continue
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