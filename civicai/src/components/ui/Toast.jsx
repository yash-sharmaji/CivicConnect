import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((type, title, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    danger: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  };

  const borderColors = {
    success: 'border-emerald-500/20 shadow-emerald-950/20 bg-emerald-950/20',
    warning: 'border-amber-500/20 shadow-amber-950/20 bg-amber-950/20',
    danger: 'border-red-500/20 shadow-red-950/20 bg-red-950/20',
    info: 'border-blue-500/20 shadow-blue-950/20 bg-blue-950/20'
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
              layout
              className={`
                pointer-events-auto flex gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg
                ${borderColors[t.type]} bg-[#0a0a0d]/90
              `}
            >
              <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white tracking-wide">{t.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 p-1 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all self-start"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
