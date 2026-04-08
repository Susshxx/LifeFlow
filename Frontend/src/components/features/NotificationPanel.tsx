import React from 'react';
import { BellIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '../ui/Button';
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'emergency';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  action?: {
    label: string;
    href: string;
  };
}
interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
  className?: string;
}
const typeConfig = {
  info: {
    icon: InfoIcon,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  success: {
    icon: CheckCircleIcon,
    color: 'text-success',
    bg: 'bg-success/10'
  },
  warning: {
    icon: AlertTriangleIcon,
    color: 'text-warning',
    bg: 'bg-warning/10'
  },
  emergency: {
    icon: AlertTriangleIcon,
    color: 'text-emergency',
    bg: 'bg-emergency/10'
  }
};
export function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  className = ''
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  return <div className={`bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full">
              {unreadCount}
            </span>}
        </div>
        {unreadCount > 0 && onMarkAllAsRead && <button onClick={onMarkAllAsRead} className="text-sm text-primary hover:underline">
            Mark all as read
          </button>}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? <div className="p-8 text-center text-gray-500">
            <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications yet</p>
          </div> : <div className="divide-y divide-gray-100">
            {notifications.map(notification => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;
          return <div key={notification.id} className={`
                    p-4 relative
                    ${!notification.isRead ? 'bg-gray-50/50' : ''}
                    ${notification.type === 'emergency' ? 'border-l-4 border-emergency' : ''}
                  `} onClick={() => !notification.isRead && onMarkAsRead?.(notification.id)}>
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        {onDismiss && <button onClick={e => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                  }} className="p-1 text-gray-400 hover:text-gray-600 rounded" aria-label="Dismiss notification">
                            <XIcon className="w-4 h-4" />
                          </button>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {notification.time}
                        </span>
                        {notification.action && <a href={notification.action.href} className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
                            {notification.action.label}
                            <ChevronRightIcon className="w-4 h-4" />
                          </a>}
                      </div>
                    </div>
                  </div>
                  {!notification.isRead && <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />}
                </div>;
        })}
          </div>}
      </div>
    </div>;
}