import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}
const variantStyles = {
  default: 'bg-gray-50 text-gray-600',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error'
};
export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className = ''
}: StatsCardProps) {
  return <div className={`bg-white rounded-xl border border-gray-100 p-6 shadow-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && <span className={`
                  inline-flex items-center gap-0.5 text-sm font-medium
                  ${trend.isPositive ? 'text-success' : 'text-error'}
                `}>
                {trend.isPositive ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                {Math.abs(trend.value)}%
              </span>}
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${variantStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>;
}