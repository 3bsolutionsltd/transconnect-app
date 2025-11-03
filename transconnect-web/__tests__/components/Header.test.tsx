import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '../../src/components/Header';
import { AuthContext } from '../../src/contexts/AuthContext';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock the Button component
jest.mock('../../src/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  )
}));

const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+256700000000',
  role: 'PASSENGER'
};

const mockAdminUser = {
  ...mockUser,
  role: 'ADMIN'
};

const renderWithAuth = (user: any = null, loading: boolean = false) => {
  const mockAuthValue = {
    user,
    loading,
    isAuthenticated: !!user,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  };

  return render(
    <AuthContext.Provider value={mockAuthValue}>
      <Header />
    </AuthContext.Provider>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logo and Branding', () => {
    it('should display TransConnect logo and brand name', () => {
      renderWithAuth();
      
      expect(screen.getByText('TransConnect')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /transconnect/i })).toHaveAttribute('href', '/');
    });
  });

  describe('Navigation - Unauthenticated User', () => {
    it('should show login and signup buttons when not authenticated', () => {
      renderWithAuth();
      
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByText('Search Routes')).toBeInTheDocument();
    });

    it('should not show authenticated-only navigation items', () => {
      renderWithAuth();
      
      expect(screen.queryByText('My Bookings')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Navigation - Authenticated Passenger', () => {
    it('should show passenger navigation items', () => {
      renderWithAuth(mockUser);
      
      expect(screen.getByText('Search Routes')).toBeInTheDocument();
      expect(screen.getByText('My Bookings')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should not show admin navigation items for passengers', () => {
      renderWithAuth(mockUser);
      
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Routes')).not.toBeInTheDocument();
      expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
    });

    it('should not show role badge for regular users', () => {
      renderWithAuth(mockUser);
      
      expect(screen.queryByText('PASSENGER')).not.toBeInTheDocument();
    });
  });

  describe('Navigation - Authenticated Admin', () => {
    it('should show admin navigation items', () => {
      renderWithAuth(mockAdminUser);
      
      expect(screen.getByText('Search Routes')).toBeInTheDocument();
      expect(screen.getByText('My Bookings')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getAllByText('Routes')).toHaveLength(1); // Admin routes link
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should show role badge for admin users', () => {
      renderWithAuth(mockAdminUser);
      
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    it('should display admin user info correctly', () => {
      renderWithAuth(mockAdminUser);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    it('should toggle mobile menu when menu button is clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth();
      
      // Mobile menu should be hidden initially
      expect(screen.queryByRole('button', { name: /sign up/i })).not.toBeInTheDocument();
      
      // Click hamburger menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);
      
      // Mobile menu should now be visible
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should close mobile menu when navigation link is clicked', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockUser);
      
      // Open mobile menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);
      
      // Click a navigation link
      const searchLink = screen.getAllByText('Search Routes')[1]; // Mobile version
      await user.click(searchLink);
      
      // Mobile menu should be closed
      expect(screen.queryByText('My Bookings')).toBeInTheDocument(); // Desktop version still visible
    });

    it('should show logout button in mobile menu for authenticated users', async () => {
      const user = userEvent.setup();
      renderWithAuth(mockUser);
      
      // Open mobile menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);
      
      // Should see logout button in mobile menu
      expect(screen.getAllByText(/logout/i)).toHaveLength(2); // Desktop and mobile versions
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout function when logout button is clicked', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn();
      
      const mockAuthValue = {
        user: mockUser,
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <Header />
        </AuthContext.Provider>
      );
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should call logout and close mobile menu when mobile logout is clicked', async () => {
      const user = userEvent.setup();
      const mockLogout = jest.fn();
      
      const mockAuthValue = {
        user: mockUser,
        loading: false,
        isAuthenticated: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <Header />
        </AuthContext.Provider>
      );
      
      // Open mobile menu
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);
      
      // Click mobile logout
      const mobileLogoutButtons = screen.getAllByText(/logout/i);
      const mobileLogoutButton = mobileLogoutButtons[1]; // Mobile version
      await user.click(mobileLogoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should show desktop navigation on larger screens', () => {
      renderWithAuth();
      
      // Desktop navigation should be visible (not hidden by md:hidden)
      const searchRoutes = screen.getByText('Search Routes');
      expect(searchRoutes.closest('.hidden.md\\:flex')).toBeNull();
    });

    it('should show mobile menu button', () => {
      renderWithAuth();
      
      // Mobile menu button should be present
      const menuButton = screen.getByRole('button');
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Links and Navigation', () => {
    it('should have correct href attributes for navigation links', () => {
      renderWithAuth(mockAdminUser);
      
      expect(screen.getByRole('link', { name: /transconnect/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /search routes/i })).toHaveAttribute('href', '/search');
      expect(screen.getByRole('link', { name: /my bookings/i })).toHaveAttribute('href', '/bookings');
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/admin');
    });

    it('should have correct admin navigation links', () => {
      renderWithAuth(mockAdminUser);
      
      const routesLinks = screen.getAllByText('Routes');
      expect(routesLinks[0].closest('a')).toHaveAttribute('href', '/admin/routes');
      
      expect(screen.getByRole('link', { name: /analytics/i })).toHaveAttribute('href', '/admin/analytics');
    });
  });

  describe('User Display', () => {
    it('should display user full name correctly', () => {
      renderWithAuth(mockUser);
      
      expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    });

    it('should show role badge for admin users', () => {
      renderWithAuth(mockAdminUser);
      
      const roleBadge = screen.getByText('ADMIN');
      expect(roleBadge).toBeInTheDocument();
      expect(roleBadge.closest('.bg-blue-100')).toBeInTheDocument();
    });

    it('should show role badge for operator users', () => {
      const operatorUser = { ...mockUser, role: 'OPERATOR' };
      renderWithAuth(operatorUser);
      
      expect(screen.getByText('OPERATOR')).toBeInTheDocument();
    });
  });
});