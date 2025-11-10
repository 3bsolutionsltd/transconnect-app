import React, { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';

export default function NotificationToast() {
  const { state, removeNotification, markAsRead } = useNotifications();
  const { notifications } = state;

  // Get only unread notifications for toast display
  const toastNotifications = notifications.filter(n => !n.read).slice(0, 3); // Show max 3 toasts

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleClose = (id: string) => {
    markAsRead(id);
    setTimeout(() => removeNotification(id), 300); // Small delay for better UX
  };

  const handleAction = (notification: any) => {
    if (notification.action) {
      notification.action.onClick();
      markAsRead(notification.id);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toastNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            transform transition-all duration-300 ease-in-out
            bg-white border-l-4 rounded-lg shadow-lg p-4
            ${getBorderColor(notification.type)}
            animate-slide-in-right
          `}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {notification.action && (
                    <button
                      onClick={() => handleAction(notification)}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => handleClose(notification.id)}
                  className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}