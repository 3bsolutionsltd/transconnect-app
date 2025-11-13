import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'OPERATOR' | 'PASSENGER';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export // Ensure API_BASE_URL includes /api path
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://transconnect-app-44ie.onrender.com/api';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token on app load
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Verify user has admin or operator role
        if (parsedUser.role === 'ADMIN' || parsedUser.role === 'OPERATOR') {
          // Test token validity by making a quick API call
          fetch(`${API_BASE_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).then(response => {
            if (response.status === 401) {
              console.log('🔧 Token invalid, clearing and forcing re-login');
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              setUser(null);
            } else if (response.ok) {
              console.log('✅ Token valid, setting user');
              setUser(parsedUser);
            }
            setLoading(false);
          }).catch(() => {
            console.log('🔧 Token validation failed, clearing tokens');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setUser(null);
            setLoading(false);
          });
          return; // Don't set loading to false here, wait for API call
        } else {
          // Clear invalid role data
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Check if user has admin or operator role
      if (data.user.role !== 'ADMIN' && data.user.role !== 'OPERATOR') {
        throw new Error('Access denied. Admin or operator privileges required.');
      }

      setUser(data.user);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
export default AuthProvider;