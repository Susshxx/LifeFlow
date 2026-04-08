import React from 'react';
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}
const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4'
};
export function Spinner({
  size = 'md',
  className = '',
  label = 'Loading'
}: SpinnerProps) {
  return <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <div className={`
          rounded-full border-primary/30 border-t-primary
          animate-spin
          ${sizeStyles[size]}
        `} />
      <span className="sr-only">{label}</span>
    </div>;
}
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  label?: string;
}
export function LoadingOverlay({
  isLoading,
  children,
  label = 'Loading...'
}: LoadingOverlayProps) {
  return <div className="relative">
      {children}
      {isLoading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-sm text-gray-500">{label}</span>
          </div>
        </div>}
    </div>;
}