import React from 'react';

export const Progress = ({
  value,
  className = '',
  color = 'primary'
}) => {
  const colorClasses = {
    primary: 'bg-indigo-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500'
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full bg-white/10 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
