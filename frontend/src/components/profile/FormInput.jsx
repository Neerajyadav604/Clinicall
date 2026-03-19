import React from 'react';

export const FormInput = React.forwardRef(
  ({ label, error, className = '', ...props }, ref) => {
    const inputId = props.id || `input-${Math.random()}`;
    const errorId = `error-${inputId}`;
    
    return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-colors
                    text-sm sm:text-base min-h-[44px] touch-target
                    ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
  }
);
