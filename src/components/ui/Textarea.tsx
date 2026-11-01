import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-forest-800">
            {label}
          </label>
        )}
        <textarea
          id={id}
          className={cn(
            'flex min-h-[100px] w-full rounded-xl border border-earth-200 bg-white px-4 py-3 text-sm text-forest-900 shadow-sm transition-colors',
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
Textarea.displayName = 'Textarea';

export { Textarea };
