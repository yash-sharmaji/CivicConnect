import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverable = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`
        glass-panel rounded-2xl p-5 overflow-hidden relative z-10
        ${hoverable ? 'glass-panel-hover' : ''}
        ${glow ? 'shadow-[0_0_50px_-12px_rgba(99,102,241,0.15)]' : ''}
        ${className}
      `}
      {...props}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-50 pointer-events-none -z-10" />
      )}
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 flex flex-col space-y-1.5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold tracking-tight text-white ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-400 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-5 pt-4 border-t border-white/5 flex items-center ${className}`} {...props}>
    {children}
  </div>
);
