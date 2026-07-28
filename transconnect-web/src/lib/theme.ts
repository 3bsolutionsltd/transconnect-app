/**
 * TransConnect Design System
 * Centralized theme configuration for consistent styling across all pages
 */

export const theme = {
  // Brand Colors
  colors: {
    // Primary - TransConnect Teal
    primary: {
      DEFAULT: '#00D9A3',
      light: '#00E5B0',
      dark: '#00C28F',
      gradient: 'linear-gradient(135deg, #00D9A3 0%, #00C28F 100%)',
    },
    
    // Secondary - Navy/Blue shades
    secondary: {
      light: '#1a3a5c',  // Why Book Direct section
      DEFAULT: '#0d1b2a', // Footer
      dark: '#0a1520',
    },
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Neutral shades
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, sans-serif",
      display: "'Inter', system-ui, sans-serif",
    },
    
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing
  spacing: {
    section: {
      sm: '3rem',   // 48px - py-12
      md: '4rem',   // 64px - py-16
      lg: '5rem',   // 80px - py-20
      xl: '6rem',   // 96px - py-24
    },
    container: {
      sm: '1rem',   // 16px - px-4
      md: '1.5rem', // 24px - px-6
      lg: '2rem',   // 32px - px-8
    },
  },

  // Border Radius
  borderRadius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
} as const;

// Utility function to get Tailwind classes for consistent styling
export const tw = {
  // Section layouts
  section: {
    light: 'py-20 bg-white',
    gray: 'py-20 bg-gray-50',
    dark: 'py-20 bg-secondary-light',
  },
  
  container: 'container mx-auto px-6',
  
  // Headings
  heading: {
    h1: 'text-6xl md:text-7xl font-extrabold tracking-tight',
    h2: 'text-4xl md:text-5xl font-extrabold tracking-tight',
    h3: 'text-3xl md:text-4xl font-bold tracking-tight',
    h4: 'text-2xl font-bold',
    h5: 'text-xl font-bold',
  },
  
  // Text
  text: {
    lead: 'text-lg md:text-xl leading-relaxed font-medium',
    body: 'text-base leading-relaxed',
    small: 'text-sm leading-normal',
    xs: 'text-xs leading-normal',
  },
  
  // Buttons
  button: {
    primary: 'bg-primary text-white font-bold px-10 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all hover:bg-primary-light',
    secondary: 'border-2 border-white text-white font-bold px-10 py-6 text-base rounded-xl hover:bg-white hover:text-gray-900 transition-all',
    outline: 'border-2 border-primary text-primary font-bold px-8 py-4 text-base rounded-xl hover:bg-primary hover:text-white transition-all',
  },
  
  // Cards
  card: {
    default: 'bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-0',
    bordered: 'bg-white rounded-xl border-2 border-gray-200 hover:border-primary transition-all',
  },
  
  // Forms
  input: {
    default: 'w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-gray-900 text-base',
    label: 'block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest',
  },
  
  // Badges
  badge: {
    success: 'inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full shadow-lg',
    info: 'inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-full',
    warning: 'inline-flex items-center gap-2 bg-yellow-500 text-white px-5 py-2.5 rounded-full',
  },
} as const;

// Export individual values for convenience
export const colors = theme.colors;
export const spacing = theme.spacing;
export const typography = theme.typography;
