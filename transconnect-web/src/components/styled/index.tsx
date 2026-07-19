/**
 * Reusable styled components following TransConnect design system
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ==================== Sections ====================
interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'light' | 'gray' | 'dark';
  children: React.ReactNode;
}

export function Section({ variant = 'light', className, children, ...props }: SectionProps) {
  const baseClass = 'py-20';
  const variants = {
    light: 'bg-white',
    gray: 'bg-gray-50',
    dark: 'bg-[#1a3a5c] text-white',
  };
  
  return (
    <section className={cn(baseClass, variants[variant], className)} {...props}>
      {children}
    </section>
  );
}

export function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('container mx-auto px-6', className)} {...props}>
      {children}
    </div>
  );
}

// ==================== Typography ====================
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

export function Heading({ as = 'h2', className, children, ...props }: HeadingProps) {
  const Component = as;
  const sizes = {
    h1: 'text-6xl md:text-7xl font-extrabold tracking-tight',
    h2: 'text-4xl md:text-5xl font-extrabold tracking-tight',
    h3: 'text-3xl md:text-4xl font-bold tracking-tight',
    h4: 'text-2xl font-bold',
    h5: 'text-xl font-bold',
    h6: 'text-lg font-bold',
  };
  
  return (
    <Component className={cn(sizes[as], className)} {...props}>
      {children}
    </Component>
  );
}

export function Lead({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-lg md:text-xl leading-relaxed font-medium', className)} {...props}>
      {children}
    </p>
  );
}

// ==================== Cards ====================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'gradient' | 'elevated';
  hover?: boolean;
}

export function StyledCard({ variant = 'default', hover = true, className, children, ...props }: CardProps) {
  const baseClass = 'rounded-xl p-6';
  const variants = {
    default: 'bg-white shadow-lg border-0',
    bordered: 'bg-white border-2 border-gray-200',
    gradient: 'bg-gradient-to-r from-[#00D9A3] to-[#00C28F] text-white shadow-lg',
    elevated: 'bg-white shadow-xl border border-gray-100',
  };
  const hoverClass = hover ? 'hover:shadow-2xl transition-all duration-300' : '';
  
  return (
    <div className={cn(baseClass, variants[variant], hoverClass, className)} {...props}>
      {children}
    </div>
  );
}

// ==================== Buttons ====================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function StyledButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-[#00D9A3] hover:bg-[#00E5B0] text-white',
    secondary: 'border-2 border-white text-white hover:bg-white hover:text-gray-900',
    outline: 'border-2 border-[#00D9A3] text-[#00D9A3] hover:bg-[#00D9A3] hover:text-white',
  };
  
  const sizes = {
    sm: 'px-6 py-2.5 text-sm',
    md: 'px-8 py-4 text-base',
    lg: 'px-10 py-6 text-base',
  };
  
  return (
    <button 
      className={cn(
        'font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
}

// ==================== Badges ====================
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

export function Badge({ variant = 'primary', icon, className, children, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-[#00D9A3] text-white shadow-lg',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest',
        variants[variant],
        className
      )} 
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

// ==================== Form Elements ====================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function StyledInput({ label, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-5 py-4 border-2 border-gray-200 rounded-xl',
          'focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent',
          'font-medium text-gray-900 text-base',
          'transition-all',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function StyledSelect({ label, className, id, children, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-5 py-4 border-2 border-gray-200 rounded-xl',
          'focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent',
          'bg-white font-medium text-gray-900 text-base',
          'transition-all',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ==================== Navigation ====================
interface NavBarProps {
  children: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

export function NavBar({ children, sticky = true, className }: NavBarProps) {
  return (
    <nav 
      className={cn(
        'bg-white shadow-md z-50',
        sticky && 'sticky top-0',
        className
      )}
    >
      <Container>
        <div className="flex items-center justify-between py-4">
          {children}
        </div>
      </Container>
    </nav>
  );
}
