'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export function SimpleNotification({ id, type, title, message, duration = 5000 }: NotificationData) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        const event = new CustomEvent('removeNotification', { detail: { id } });
        window.dispatchEvent(event);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const Icon = icons[type];

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      const event = new CustomEvent('removeNotification', { detail: { id } });
      window.dispatchEvent(event);
    }, 300);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${colors[type]}`}>
        <div className="flex items-start">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-medium">{title}</h4>
            {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
          </div>
          <button
            onClick={handleClose}
            className="ml-2 flex-shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationContainer() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const addNotification = (notification: Omit<NotificationData, 'id'>) => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { ...notification, id }]);
    };

    const removeNotification = (event: CustomEvent) => {
      const { id } = event.detail;
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Expose addNotification globally
    (window as any).addNotification = addNotification;

    // Listen for remove events
    window.addEventListener('removeNotification', removeNotification as EventListener);

    return () => {
      delete (window as any).addNotification;
      window.removeEventListener('removeNotification', removeNotification as EventListener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <SimpleNotification key={notification.id} {...notification} />
      ))}
    </div>
  );
}
