import React from 'react';
import { AlertCircleIcon, CheckCircleIcon, InfoIcon, AlertTriangleIcon, XIcon, SirenIcon } from 'lucide-react';
type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'emergency';
interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}
const variantConfig: Record<AlertVariant, {
  icon: React.ReactNode;
  styles: string;
}> = {
  info: {
    icon: <InfoIcon className="w-5 h-5" />,
    styles: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  success: {
    icon: <CheckCircleIcon className="w-5 h-5" />,
    styles: 'bg-success/10 border-success/30 text-success-dark'
  },
  warning: {
    icon: <AlertTriangleIcon className="w-5 h-5" />,
    styles: 'bg-warning/10 border-warning/30 text-warning-dark'
  },
  error: {
    icon: <AlertCircleIcon className="w-5 h-5" />,
    styles: 'bg-error/10 border-error/30 text-error-dark'
  },
  emergency: {
    icon: <SirenIcon className="w-5 h-5" />,
    styles: 'bg-emergency/10 border-emergency/30 text-emergency-dark emergency-pulse'
  }
};
export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}: AlertProps) {
  const config = variantConfig[variant];
  return <div className={`
        flex gap-3 p-4 rounded-lg border
        ${config.styles}
        ${className}
      `} role="alert">
      <div className="flex-shrink-0" aria-hidden="true">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && <button onClick={onClose} className="flex-shrink-0 p-1 -m-1 rounded hover:bg-black/10 transition-colors" aria-label="Dismiss alert">
          <XIcon className="w-4 h-4" />
        </button>}
    </div>;
}