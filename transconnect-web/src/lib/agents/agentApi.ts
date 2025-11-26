/**
 * Lightweight wrapper for agent API calls.
 * All calls return parsed JSON or throw.
 */
import { endpoints } from '../config';

const BASE = endpoints.agents.register.replace('/register', ''); // Get base agents URL

async function request(path: string, opts: any = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `HTTP ${res.status}: ${res.statusText}`);
  }
  
  return res.json().catch(() => null);
}

export default {
  // Agent registration
  register: (data: any) => request('/register', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),

  // OTP verification
  resendOtp: (phone: string) => request('/resend-otp', { 
    method: 'POST', 
    body: JSON.stringify({ phone }) 
  }).catch(() => {}),

  verifyOtp: (data: any) => request('/verify-otp', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),

  // KYC and file upload
  getPresign: (fileName: string, type: string, agentId?: string) => {
    const params = new URLSearchParams({
      fileName,
      type,
      ...(agentId && { agentId })
    });
    return request(`/kyc/presign?${params}`);
  },

  uploadKyc: (agentId: string, fileUrl: string) => request('/kyc/upload', { 
    method: 'POST', 
    body: JSON.stringify({ agentId, fileUrl }) 
  }),

  // Dashboard and agent data
  getDashboard: (agentId: string, token?: string) => request(`/${agentId}/dashboard`, { 
    headers: token ? { Authorization: `Bearer ${token}` } : {} 
  }),

  // Withdrawals and financial operations
  requestWithdrawal: (agentId: string, amount: number, method: string, accountDetails: string, token?: string) => 
    request('/withdraw', { 
      method: 'POST', 
      headers: token ? { Authorization: `Bearer ${token}` } : {}, 
      body: JSON.stringify({ agentId, amount, method, accountDetails }) 
    }),

  // Network and referrals
  getDownline: (agentId: string, depth = 3, token?: string) => request(`/downline`, { 
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    method: 'POST',
    body: JSON.stringify({ agentId, depth })
  }),

  // Profile management
  saveProfile: (agentId: string, profile: any, token?: string) => request(`/profile`, { 
    method: 'PUT', 
    headers: token ? { Authorization: `Bearer ${token}` } : {}, 
    body: JSON.stringify({ agentId, ...profile }) 
  }),

  // Admin functions (for future use)
  getPendingKyc: (token?: string) => request('/kyc/pending', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),

  approveKyc: (kycId: string, token?: string) => request(`/kyc/${kycId}/approve`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
};