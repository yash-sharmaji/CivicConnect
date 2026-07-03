import React from 'react';

export const Select = React.forwardRef(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-4 py-2.5 bg-[#0f0f13] border border-white/10 rounded-xl text-white text-sm
              appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
              transition-all duration-200 backdrop-blur-md disabled:opacity-50 disabled:pointer-events-none
              cursor-pointer
              ${error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0f0f13] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        {error && (
          <span className="text-xs text-red-400 font-medium mt-0.5">{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
