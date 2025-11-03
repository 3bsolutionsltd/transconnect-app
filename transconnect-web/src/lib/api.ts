import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  const res = await api.get('/routes', { params });
  return res.data;
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
  const res = await api.patch(`/bookings/${bookingId}/cancel`, {}, { headers });
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

export default api;
