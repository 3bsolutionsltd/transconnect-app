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

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log detailed error information
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Error:', error.message);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if error indicates token expired
      const errorCode = error.response?.data?.code;
      const isTokenExpired = errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN';

      if (isTokenExpired) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return apiClient(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log('🔄 Attempting to refresh token...');
          const token = await secureStorage.getItem('auth_token');
          
          if (!token) {
            throw new Error('No token to refresh');
          }

          // Call refresh endpoint
          const response = await apiClient.post('/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const { token: newToken, expiresAt } = response.data;
          
          // Store new token and expiry
          await secureStorage.setItem('auth_token', newToken);
          await secureStorage.setItem('token_expires_at', expiresAt);
          
          console.log('✅ Token refreshed successfully');
          
          // Update the authorization header
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          
          processQueue(null, newToken);
          
          // Retry the original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          processQueue(refreshError, null);
          
          // Clear auth data and force re-login
          try {
            await secureStorage.clear();
          } catch (e) {
            console.error('Error clearing auth data:', e);
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Not a token expiry error, clear auth data
        try {
          await secureStorage.clear();
          // Note: Navigation to login should be handled by auth context
        } catch (e) {
          console.error('Error clearing auth data:', e);
        }
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
  
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  
  refreshToken: () =>
    apiClient.post('/auth/refresh'),
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
    apiClient.get('/bookings/my-bookings'),
  
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