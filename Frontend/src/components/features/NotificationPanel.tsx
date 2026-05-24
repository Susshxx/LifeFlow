import React, { useState, useEffect } from 'react';
import { BellIcon, XIcon, CheckIcon } from 'lucide-react';
import { Button } from '../ui/Button';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Notification {
  _id: string;
  title: string;
  message: string;
  recipients: 'users' | 'hospitals' | 'all';
  createdAt: string;
  isReadByUser: boolean;
  createdBy: {
    name: string;
    role: string;
  };
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('[NotificationPanel] Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, isReadByUser: true } : notif
          )
        );
      }
    } catch (err) {
      console.error('[NotificationPanel] Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('lf_token');
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isReadByUser: true }))
        );
      }
    } catch (err) {
      console.error('[NotificationPanel] Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isReadByUser).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              leftIcon={<CheckIcon className="w-4 h-4" />}
              className="text-primary hover:bg-primary/10"
            >
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <BellIcon className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">
                You'll see notifications from admin here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isReadByUser ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.isReadByUser && markAsRead(notification._id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">
                      {notification.title}
                    </h3>
                    {!notification.isReadByUser && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      From: {notification.createdBy?.name || 'Admin'}
                    </span>
                    <span>
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
