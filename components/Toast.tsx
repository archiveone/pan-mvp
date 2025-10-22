'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-500 dark:bg-green-600';
      case 'error': return 'bg-red-500 dark:bg-red-600';
      case 'warning': return 'bg-orange-500 dark:bg-orange-600';
      default: return 'bg-blue-500 dark:bg-blue-600';
    }
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom duration-300">
      <div className={`${getColors()} text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
        {getIcon()}
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Toast Container for managing multiple toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex flex-col items-center justify-end pb-20 gap-2">
      {children}
    </div>
  );
}
