import React from 'react';
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'emergency';
type BadgeSize = 'sm' | 'md' | 'lg';
interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success-dark',
  warning: 'bg-warning/10 text-warning-dark',
  error: 'bg-error/10 text-error-dark',
  emergency: 'bg-emergency/10 text-emergency-dark'
};
const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};
const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  emergency: 'bg-emergency animate-pulse'
};
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  dot = false
}: BadgeProps) {
  return <span className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}>
      {dot && <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} aria-hidden="true" />}
      {children}
    </span>;
}