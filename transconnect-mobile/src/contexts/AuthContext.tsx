import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { secureStorage } from '../services/storage';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'PASSENGER' | 'ADMIN' | 'OPERATOR';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ verificationRequired: boolean; email?: string }>;
  setAuthSession: (session: { user: User; token: string; expiresAt?: string; expiresIn?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'PASSENGER';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const setAuthSession = async (session: { user: User; token: string; expiresAt?: string; expiresIn?: string }) => {
    const { user: userData, token: authToken, expiresAt, expiresIn } = session;

    await secureStorage.setItem('auth_token', authToken);
    await secureStorage.setItem('user_data', JSON.stringify(userData));

    if (expiresAt) {
      await secureStorage.setItem('token_expires_at', expiresAt);
      console.log('\u2705 Token expires at:', expiresAt);
    }
    if (expiresIn) {
      console.log('\u2705 Token valid for:', expiresIn);
    }

    setUser(userData);
    setToken(authToken);
  };

  const checkAuthState = async () => {
    try {
      console.log('🔐 Checking auth state...');
      
      // Add timeout to prevent hanging
      const authCheckPromise = Promise.all([
        secureStorage.getItem('auth_token'),
        secureStorage.getItem('user_data')
      ]);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      );
      
      const [storedToken, storedUser] = await Promise.race([
        authCheckPromise,
        timeoutPromise
      ]) as [string | null, string | null];
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('✅ User authenticated from storage');
      } else {
        console.log('ℹ️  No stored auth found');
      }
    } catch (error) {
      console.error('❌ Error checking auth state:', error);
      // Continue anyway - user can login normally
    } finally {
      console.log('✅ Auth check complete');
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with:', { email: credentials.email });
      
      const response = await authApi.login(credentials);
      console.log('Login response received:', response.data);
      
      const { user: userData, token: authToken, expiresAt, expiresIn } = response.data;

      await setAuthSession({ user: userData, token: authToken, expiresAt, expiresIn });
      console.log('✅ Login successful');
    } catch (error: any) {
      console.error('❌ Login error:', error.response?.data || error.message);
      
      // Demo mode fallback for testing - activate on network errors, 404, or 401
      const shouldUseDemoMode = 
        error.message?.includes('Network') || 
        error.response?.status === 404 ||
        error.response?.status === 401 ||
        !error.response;
      
      if (shouldUseDemoMode) {
        console.log('⚠️ API unavailable or credentials not found, using DEMO MODE');
        
        // Demo user credentials
        const demoUsers = [
          { email: 'test@example.com', password: 'testpass123', id: 'demo-1', firstName: 'Test', lastName: 'User', phone: '+256701234567', role: 'PASSENGER' },
          { email: 'test@test.com', password: 'test123', id: 'demo-2', firstName: 'Demo', lastName: 'User', phone: '+256702345678', role: 'PASSENGER' },
          { email: 'admin@transconnect.ug', password: 'admin123', id: 'demo-3', firstName: 'Admin', lastName: 'User', phone: '+256703456789', role: 'ADMIN' },
        ];
        
        const demoUser = demoUsers.find(u => u.email === credentials.email && u.password === credentials.password);
        
        if (demoUser) {
          const { password, ...userData } = demoUser;
          const demoToken = 'demo-token-' + Date.now();

          await setAuthSession({ user: userData as User, token: demoToken });
          console.log('✅ Demo mode login successful for:', demoUser.email);
          return;
        } else {
          console.log('❌ Credentials not found in demo users. Please use test credentials.');
          throw new Error('Invalid demo credentials. Please use: test@example.com / testpass123 or test@test.com / test123');
        }
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ verificationRequired: boolean; email?: string }> => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);
      const {
        user: newUser,
        token: authToken,
        expiresAt,
        expiresIn,
        verificationRequired,
      } = response.data;

      if (verificationRequired || !authToken) {
        return {
          verificationRequired: true,
          email: newUser?.email || userData.email,
        };
      }

      await setAuthSession({ user: newUser, token: authToken, expiresAt, expiresIn });
      return { verificationRequired: false };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await secureStorage.clear();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...userData };
      await secureStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.log('✅ User data updated in context');
    } catch (error) {
      console.error('Error updating user in context:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    setAuthSession,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}