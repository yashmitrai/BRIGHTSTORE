import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import {
  LayoutDashboard,
  ShoppingBag,
  Send,
  MapPin,
  User,
  Store,
  Package,
  BarChart3,
  ShieldCheck,
  Users,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, retailer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const notifRef = useRef<HTMLDivElement>(null);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode-active');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode-active');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: NotificationItem) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Real-time socket notifications
  useSocket({
    notification: (notif: NotificationItem) => {
      // Prepend to notifications list if not already present
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    },
  });

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markNotifRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read', error);
    }
  };

  const markAllNotifRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read', error);
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  // Sidebar Links based on Role
  const customerLinks = [
    { name: 'Browse Products', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Request Delivery', path: '/order-request', icon: Send },
    { name: 'My Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Saved Addresses', path: '/addresses', icon: MapPin },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const retailerLinks = [
    { name: 'Retailer Dashboard', path: '/retailer/dashboard', icon: LayoutDashboard },
    { name: 'Order Marketplace', path: '/retailer/marketplace', icon: Store },
    { name: 'Product Inventory', path: '/retailer/inventory', icon: Package },
    { name: 'Store Analytics', path: '/retailer/analytics', icon: BarChart3 },
    { name: 'Profile / Address', path: '/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Verify Retailers', path: '/admin/verification', icon: ShieldCheck },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const sidebarLinks =
    user.role === 'admin'
      ? adminLinks
      : user.role === 'retailer'
      ? retailerLinks
      : customerLinks;

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'retailer':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg">B</span>
            <span>BrightStore</span>
          </Link>
        </div>
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? '' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-350'}`} />
                  <span>{link.name}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'text-white/70 dark:text-slate-950/70' : 'text-slate-400'}`} />
              </Link>
            );
          })}
        </div>

        {/* Desktop User Footer Card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-200">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${getRoleBadgeColor()}`}>
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          {user.role === 'retailer' && retailer && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Store</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">{retailer.storeName}</p>
              <span className={`inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded-full ${
                retailer.isVerified 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {retailer.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 font-sans capitalize hidden md:block">
              {location.pathname === '/' || location.pathname === '/dashboard'
                ? 'Product Catalog'
                : location.pathname.substring(1).split('/')[0].replace('-', ' ')}
            </h1>
            {/* Mobile Logo */}
            <Link to="/" className="md:hidden text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-bold text-sm">B</span>
              <span>BrightStore</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Center */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Box */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-premium-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotifRead}
                        className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            markNotifRead(notif._id);
                            if (notif.type === 'new_offer' || notif.type === 'order_status') {
                              navigate('/orders');
                            } else if (notif.type === 'new_request') {
                              navigate('/retailer/marketplace');
                            }
                            setNotificationsOpen(false);
                          }}
                          className={`p-3.5 text-left text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors ${
                            !notif.read ? 'bg-blue-50/20 dark:bg-blue-950/10 font-medium border-l-2 border-blue-600' : 'border-l-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{notif.title}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-900">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/notifications');
                      }}
                      className="text-[11px] text-blue-650 hover:text-blue-500 font-bold hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-premium-lg animate-fade-in">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg">B</span>
                <span>BrightStore</span>
              </Link>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
            {/* Mobile Sidebar Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-200">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                    <span className="text-[9px] uppercase font-bold text-slate-400">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
