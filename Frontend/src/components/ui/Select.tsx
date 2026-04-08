import React, { forwardRef } from 'react';
import { ChevronDownIcon, AlertCircleIcon } from 'lucide-react';
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}
const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3.5 text-lg'
};
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  placeholder,
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  return <div className="w-full">
        {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>}
        <div className="relative">
          <select ref={ref} id={selectId} className={`
              w-full rounded-lg border bg-white appearance-none cursor-pointer
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-error focus:ring-error' : 'border-gray-300'}
              ${sizeStyles[size]}
              pr-10
              ${className}
            `} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined} {...props}>
            {placeholder && <option value="" disabled>
                {placeholder}
              </option>}
            {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>)}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
        </div>
        {error && <p id={`${selectId}-error`} className="mt-1.5 text-sm text-error flex items-center gap-1" role="alert">
            <AlertCircleIcon className="w-4 h-4" aria-hidden="true" />
            {error}
          </p>}
        {hint && !error && <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-gray-500">
            {hint}
          </p>}
      </div>;
});
Select.displayName = 'Select';