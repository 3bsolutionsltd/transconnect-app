import axios from 'axios';

// Dynamic API URL configuration
const getBackendPort = () => {
  return process.env.NEXT_PUBLIC_BACKEND_PORT || '5000';
};

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, try to detect backend port
    const backendPort = getBackendPort();
    return `http://localhost:${backendPort}/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || `http://localhost:${getBackendPort()}/api`;
};

const API_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token is invalid or expired
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Don't automatically redirect - let components handle it
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }) {
    const response = await api.post('/auth/register', userData);
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  isAuthenticated() {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }
};

export async function fetchRoutes(params?: Record<string, any>) {
  console.log('Fetching routes with params:', params);
  console.log('API Base URL:', api.defaults.baseURL);
  try {
    const res = await api.get('/routes', { params });
    console.log('Routes API response:', res.data?.length || 0, 'routes found');
    return res.data;
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
}

export async function fetchRouteById(id: string, params?: Record<string, any>) {
  const res = await api.get(`/routes/${id}`, { params });
  return res.data;
}

export async function createBooking(token: string | null, payload: any) {
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await api.post('/bookings', payload, { headers });
  return res.data;
}

export async function getMyBookings(token: string | null) {
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await api.get('/bookings/my-bookings', { headers });
  return res.data;
}

export async function cancelBooking(bookingId: string, token: string | null) {
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await api.put(`/bookings/${bookingId}/cancel`, {}, { headers });
  return res.data;
}

export async function modifyBookingDate(bookingId: string, newDate: string, token: string | null) {
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await api.patch(`/bookings/${bookingId}/modify-date`, { travelDate: newDate }, { headers });
  return res.data;
}

export async function getBookingStatus(bookingId: string, token: string | null) {
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await api.get(`/bookings/${bookingId}/status`, { headers });
  return res.data;
}

// Payment API functions
export const paymentApi = {
  async initiate(paymentData: {
    bookingId: string;
    method: string;
    phoneNumber?: string;
  }) {
    const response = await api.post('/payments/initiate', paymentData);
    return response.data;
  },

  async getStatus(paymentId: string) {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  },

  async getHistory(page = 1, limit = 10) {
    const response = await api.get('/payments/history', { params: { page, limit } });
    return response.data;
  },

  async getSupportedMethods() {
    const response = await api.get('/payments/methods');
    return response.data;
  },

  async validatePaymentMethod(method: string, phoneNumber: string) {
    const response = await api.post('/payments/validate', { method, phoneNumber });
    return response.data;
  },

  async completePayment(paymentId: string) {
    const response = await api.post(`/payments/${paymentId}/complete`);
    return response.data;
  }
};

export default api;
