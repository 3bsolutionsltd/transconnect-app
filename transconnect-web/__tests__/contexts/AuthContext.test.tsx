import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import * as authApi from '../../src/lib/api';

// Mock the API module
jest.mock('../../src/lib/api');
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Test component to access auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <button data-testid="login-btn" onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button data-testid="register-btn" onClick={() => register({ 
        email: 'test@example.com', 
        password: 'password',
        firstName: 'Test',
        lastName: 'User'
      })}>
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+256700000000',
    role: 'PASSENGER'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock authApi methods
    mockAuthApi.authApi = {
      getCurrentUser: jest.fn(),
      getToken: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn()
    } as any;
  });

  it('should initialize with no user when no token exists', async () => {
    mockAuthApi.authApi.getCurrentUser.mockReturnValue(null);
    mockAuthApi.authApi.getToken.mockReturnValue(null);

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('should initialize with user when valid token exists', async () => {
    mockAuthApi.authApi.getCurrentUser.mockReturnValue(mockUser);
    mockAuthApi.authApi.getToken.mockReturnValue('valid-token');

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
  });

  it('should handle login successfully', async () => {
    const user = userEvent.setup();
    mockAuthApi.authApi.getCurrentUser.mockReturnValue(null);
    mockAuthApi.authApi.getToken.mockReturnValue(null);
    mockAuthApi.authApi.login.mockResolvedValue({ user: mockUser, token: 'new-token' });

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const loginBtn = screen.getByTestId('login-btn');
    await user.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });

    expect(mockAuthApi.authApi.login).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle registration successfully', async () => {
    const user = userEvent.setup();
    mockAuthApi.authApi.getCurrentUser.mockReturnValue(null);
    mockAuthApi.authApi.getToken.mockReturnValue(null);
    mockAuthApi.authApi.register.mockResolvedValue({ user: mockUser, token: 'new-token' });

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    const registerBtn = screen.getByTestId('register-btn');
    await user.click(registerBtn);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });

    expect(mockAuthApi.authApi.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User'
    });
  });

  it('should handle logout successfully', async () => {
    const user = userEvent.setup();
    mockAuthApi.authApi.getCurrentUser.mockReturnValue(mockUser);
    mockAuthApi.authApi.getToken.mockReturnValue('valid-token');

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    const logoutBtn = screen.getByTestId('logout-btn');
    await user.click(logoutBtn);

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(mockAuthApi.authApi.logout).toHaveBeenCalled();
  });

  it('should handle initialization errors gracefully', async () => {
    mockAuthApi.authApi.getCurrentUser.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    mockAuthApi.authApi.getToken.mockReturnValue('invalid-token');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(mockAuthApi.authApi.logout).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Error initializing auth:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const TestComponentOutsideProvider = () => {
      useAuth();
      return <div>Test</div>;
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});