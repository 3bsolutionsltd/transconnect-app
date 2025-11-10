'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, X, CheckCircle, AlertCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';

export default function NotificationCenter() {
  const { state, removeNotification, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const { notifications } = state;

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Animate bell when new notifications arrive
  const prevUnreadCount = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setBellAnimating(true);
      setTimeout(() => setBellAnimating(false), 1000);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const getIcon = (type: string) => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-yellow-500" />;
      case 'info':
        return <Info {...iconProps} className="text-blue-500" />;
      default:
        return <Bell {...iconProps} className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.action) {
      notification.action.onClick();
      setIsOpen(false); // Close panel after action
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200"
      >
        <Bell 
          size={24} 
          className={bellAnimating ? 'animate-bell-ring' : ''} 
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No notifications</p>
                  <p className="text-sm">You're all caught up! 🎉</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {notification.action && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    {notification.action.label}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={() => {
                    notifications.forEach(n => markAsRead(n.id));
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}