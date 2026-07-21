const _rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = _rawApiUrl.replace(/\/api\/?$/, '') + '/api';

// Debug log for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Admin Panel API Base URL:', API_BASE_URL);
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string, public response?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle JWT signature errors specifically
    if (response.status === 401 && (errorData.code === 'INVALID_TOKEN' || errorData.code === 'TOKEN_EXPIRED')) {
      // Clear invalid tokens and force re-login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/';
      return;
    }
    
    throw new ApiError(
      response.status,
      errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
      errorData
    );
  }
  return response.json();
};

export const api = {
  get: async <T = any>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  put: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  delete: async <T = any>(url: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  patch: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  }
};

export interface AuthNotificationsHealthResponse {
  success: boolean;
  timestamp: string;
  environment: string;
  auth: {
    emailSignup: {
      registerEndpoint: string;
      verifyEndpoint: string;
      resendEndpoint: string;
      emailOtpConfigured: boolean;
      smtpConfigured: boolean;
      emailOtpStatus: {
        configured: boolean;
        error?: string;
      };
    };
    phoneOtpSignupLogin: {
      requestEndpoint: string;
      verifyEndpoint: string;
      otpExpirySeconds: number;
      demoMode: boolean;
      providerReady: boolean;
      providerStatus: any;
      otpStore: {
        type: string;
        productionSafe: boolean;
      };
    };
  };
  notifications: {
    channels: {
      email: { configured: boolean; from: string | null };
      sms: { configured: boolean; providers: any };
      push: { configured: boolean; provider: string };
      inApp: { configured: boolean };
    };
    adminWorkflow: {
      adminEmailConfigured: boolean;
      adminEmailTarget: string | null;
      note: string;
    };
  };
  risks: string[];
}

export interface AuthNotificationsTestResponse {
  success: boolean;
  channel: 'email' | 'sms' | 'both';
  message: string;
  timestamp: string;
  results: {
    email?: { success: boolean; messageId?: string; error?: string; target?: string };
    sms?: { success: boolean; messageId?: string; error?: string; provider?: string; target?: string };
  };
}

export const systemHealthApi = {
  getAuthNotificationsHealth: async (): Promise<AuthNotificationsHealthResponse> => {
    return api.get<AuthNotificationsHealthResponse>('/admin/system-health/auth-notifications');
  },
  sendAuthNotificationTest: async (payload: {
    channel: 'email' | 'sms' | 'both';
    email?: string;
    phoneNumber?: string;
  }): Promise<AuthNotificationsTestResponse> => {
    return api.post<AuthNotificationsTestResponse>('/admin/system-health/auth-notifications/test', payload);
  },
};

export { ApiError };
export type { ApiResponse };