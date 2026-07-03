import React from 'react';

export const Textarea = React.forwardRef(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm
            placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
            transition-all duration-200 backdrop-blur-md disabled:opacity-50 disabled:pointer-events-none
            min-h-[100px] resize-y
            ${error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400 font-medium mt-0.5">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
