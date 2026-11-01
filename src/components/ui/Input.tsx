import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-forest-800">
            {label}
          </label>
        )}
        <input
          type={type}
          id={id}
          className={cn(
            'flex h-11 w-full rounded-xl border border-earth-200 bg-white px-4 py-2 text-sm text-forest-900 shadow-sm transition-colors',
            'placeholder:text-earth-400',
            'focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-earth-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
