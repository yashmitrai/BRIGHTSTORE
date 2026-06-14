import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import Spinner from '../components/common/Spinner';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { Bell, Check, Trash2, Calendar, ShoppingBag, Award, Store, RefreshCw } from 'lucide-react';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen to socket notifications in real-time
  useSocket({
    notification: (notif: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
    },
  });

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications read', error);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification', error);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markRead(notif._id);
    if (notif.type === 'new_offer' || notif.type === 'order_status') {
      navigate('/orders');
    } else if (notif.type === 'new_request') {
      navigate('/retailer/marketplace');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_offer':
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case 'order_status':
        return <ShoppingBag className="w-5 h-5 text-purple-500" />;
      case 'new_request':
        return <Store className="w-5 h-5 text-amber-500" />;
      case 'verification_status':
        return <Award className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
              Notification Center
            </h2>
            <p className="text-xs text-slate-450 mt-1">
              You have {unreadCount} unread notification(s)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-100 dark:border-slate-850 pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              filter === 'all'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              filter === 'unread'
                ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350">Clear inbox</h3>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'unread' ? 'No unread notifications right now.' : 'You have no alerts or notifications in your history.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 border rounded-xl hover:shadow-premium-md cursor-pointer transition-all flex items-start gap-4 bg-white dark:bg-slate-900 ${
                  !notif.read
                    ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/10 dark:bg-blue-950/5'
                    : 'border-slate-200/80 dark:border-slate-850'
                }`}
              >
                <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between text-xs gap-4">
                    <h4 className={`text-xs text-slate-850 dark:text-slate-100 truncate ${!notif.read ? 'font-bold' : 'font-semibold'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                <div className="flex items-center self-center gap-1">
                  {!notif.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(notif._id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-500 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteNotification(notif._id, e)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
