import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, className = '', ...props }, ref) => {
    const borderColor = error 
      ? 'border-error focus:ring-error' 
      : success 
      ? 'border-success focus:ring-success' 
      : 'border-border focus:ring-primary';
    
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border-2 bg-input-background
            ${borderColor}
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
        {success && (
          <p className="mt-1.5 text-sm text-success">{success}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
