import React from 'react';
import { Loader2Icon } from 'lucide-react';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'emergency';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
  secondary: 'bg-secondary text-white hover:bg-secondary-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
  outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-[0.98]',
  ghost: 'text-secondary bg-transparent hover:bg-secondary-50 active:bg-secondary-100',
  danger: 'bg-error text-white hover:bg-error-dark hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
  emergency: 'bg-emergency text-white hover:bg-emergency-dark hover:shadow-emergency hover:scale-[1.02] active:scale-[0.98] emergency-pulse'
};
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg'
};
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  return <button className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg
        transition-all duration-200 ease-out
        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `} disabled={isDisabled} {...props}>
      {isLoading ? <Loader2Icon className="w-5 h-5 animate-spin" aria-hidden="true" /> : leftIcon ? <span className="flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span> : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0" aria-hidden="true">
          {rightIcon}
        </span>}
    </button>;
}