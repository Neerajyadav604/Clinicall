import React from 'react';

export const FormTextarea = React.forwardRef(
  ({ label, error, className = '', ...props }, ref) => {
    const textareaId = props.id || `textarea-${Math.random()}`;
    const errorId = `error-${textareaId}`;
    
    return (
    <div className={className}>
      {label && (
        <label htmlFor={textareaId} className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg focus:outline-none
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-colors resize-none
                    text-sm sm:text-base min-h-[100px]
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
