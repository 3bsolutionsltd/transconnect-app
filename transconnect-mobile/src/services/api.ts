import axios from 'axios';
import Constants from 'expo-constants';
import { secureStorage } from './storage';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
  'https://transconnect-app-44ie.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await secureStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      try {
        await secureStorage.clear();
        // Note: Navigation to login should be handled by auth context
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  
  register: (userData: any) =>
    apiClient.post('/auth/register', userData),
  
  getCurrentUser: () =>
    apiClient.get('/auth/me'),
  
  updateProfile: (profileData: { firstName?: string; lastName?: string; phone?: string }) =>
    apiClient.put('/auth/profile', profileData),
};

// Routes API
export const routesApi = {
  searchRoutes: (params: { from: string; to: string; date?: string }) =>
    apiClient.get('/routes', { 
      params: { 
        origin: params.from, 
        destination: params.to,
        ...(params.date ? { travelDate: params.date } : {})
      } 
    }),
  
  getRouteDetails: (routeId: string, travelDate?: string) =>
    apiClient.get(`/routes/${routeId}`, { 
      params: travelDate ? { travelDate } : {} 
    }),
  
  getSmartSearch: (origin: string, destination: string, travelDate?: string) =>
    apiClient.get('/routes', { 
      params: { 
        origin, 
        destination,
        ...(travelDate ? { travelDate } : {})
      } 
    }),
  
  getAllRoutes: (params?: { origin?: string; destination?: string; travelDate?: string }) =>
    apiClient.get('/routes', { params }),
};

// Bookings API
export const bookingsApi = {
  createBooking: (bookingData: any) =>
    apiClient.post('/bookings', bookingData),
  
  getBookings: () =>
    apiClient.get('/bookings'),
  
  getBookingDetails: (bookingId: string) =>
    apiClient.get(`/bookings/${bookingId}`),
  
  cancelBooking: (bookingId: string) =>
    apiClient.delete(`/bookings/${bookingId}`),
  
  initiatePayment: (paymentData: any) =>
    apiClient.post('/payments/initiate', paymentData),
  
  verifyPayment: (reference: string) =>
    apiClient.get(`/payments/verify/${reference}`),
};

// Payments API
export const paymentsApi = {
  initiatePayment: (paymentData: any) =>
    apiClient.post('/payments/initiate', paymentData),
  
  getPaymentStatus: (paymentId: string) =>
    apiClient.get(`/payments/${paymentId}/status`),
  
  getSupportedMethods: () =>
    apiClient.get('/payments/methods'),
};

// QR API
export const qrApi = {
  validateQR: (qrData: string) =>
    apiClient.post('/qr/validate', { qrData }),
};