// API Configuration for TransConnect Web Portal
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const config = {
  api: {
    baseURL: API_BASE_URL,
    socketURL: SOCKET_URL,
    timeout: 10000, // 10 seconds
    retries: 3,
  },
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
};

// API Endpoints
export const endpoints = {
  // Agent endpoints
  agents: {
    register: `${API_BASE_URL}/agents/register`,
    login: `${API_BASE_URL}/agents/login`,
    verifyLogin: `${API_BASE_URL}/agents/login/verify`,
    dashboard: (agentId: string) => `${API_BASE_URL}/agents/${agentId}/dashboard`,
    ping: (agentId: string) => `${API_BASE_URL}/agents/${agentId}/ping`,
    withdraw: (agentId: string) => `${API_BASE_URL}/agents/${agentId}/withdraw`,
  },
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    verify: `${API_BASE_URL}/auth/verify`,
    refresh: `${API_BASE_URL}/auth/refresh`,
  },
  // Booking endpoints
  bookings: {
    create: `${API_BASE_URL}/bookings`,
    get: (id: string) => `${API_BASE_URL}/bookings/${id}`,
    list: `${API_BASE_URL}/bookings`,
    update: (id: string) => `${API_BASE_URL}/bookings/${id}`,
  },
  // Route endpoints
  routes: {
    search: `${API_BASE_URL}/routes/search`,
    list: `${API_BASE_URL}/routes`,
    get: (id: string) => `${API_BASE_URL}/routes/${id}`,
  },
  // Payment endpoints
  payments: {
    process: `${API_BASE_URL}/payments/process`,
    status: (id: string) => `${API_BASE_URL}/payments/${id}/status`,
    history: `${API_BASE_URL}/payments/history`,
  },
  // QR endpoints
  qr: {
    generate: `${API_BASE_URL}/qr/generate`,
    validate: `${API_BASE_URL}/qr/validate`,
    booking: (bookingId: string) => `${API_BASE_URL}/qr/booking/${bookingId}`,
  },
  // Health check
  health: `${API_BASE_URL.replace('/api', '')}/health`,
};

export default config;