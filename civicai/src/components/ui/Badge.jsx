import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  pulse = false,
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border transition-colors";
  
  const variants = {
    default: "bg-white/5 border-white/10 text-gray-300",
    glass: "bg-white/5 border-white/5 text-white backdrop-blur-md",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.05)]",
    danger: "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.05)]",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.05)]"
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {pulse && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'danger' ? 'bg-red-400 animate-marker-pulse' :
          variant === 'success' ? 'bg-emerald-400 animate-marker-pulse' :
          variant === 'warning' ? 'bg-amber-400 animate-marker-pulse' :
          'bg-indigo-400 animate-marker-pulse'
        }`} />
      )}
      {children}
    </span>
  );
};
