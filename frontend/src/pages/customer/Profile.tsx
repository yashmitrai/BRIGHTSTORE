import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import {
  User,
  Mail,
  Phone,
  Shield,
  Store,
  MapPin,
  Tag,
  Star,
  Award,
  TrendingDown,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Lock,
  Settings,
  Key,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface CustomerStats {
  kpis: {
    totalSpent: number;
    totalOrders: number;
    totalSaved: number;
  };
  categoryStats: Array<{ name: string; value: number }>;
}

const Profile: React.FC = () => {
  const { user, retailer, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'stats'>('profile');
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setProfilePhoto(user.profilePhoto || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'customer') {
      const fetchCustomerStats = async () => {
        setStatsLoading(true);
        try {
          const response = await api.get('/analytics/customer');
          setStats(response.data);
        } catch (error) {
          console.error('Error fetching customer stats', error);
        } finally {
          setStatsLoading(false);
        }
      };
      fetchCustomerStats();
    }
  }, [user]);

  if (!user) return null;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const response = await api.put('/auth/profile', { name, phone, profilePhoto });
      setProfileSuccess(response.data.message || 'Profile updated successfully!');
      await refreshProfile();
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityLoading(true);
    setSecuritySuccess(null);
    setSecurityError(null);

    if (newPassword !== confirmNewPassword) {
      setSecurityError('New passwords do not match');
      setSecurityLoading(false);
      return;
    }

    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      setSecuritySuccess(response.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setSecurityError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSecurityLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
      case 'retailer':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
          Your Account Profile
        </h2>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Password & Security</span>
          </button>
          {user.role === 'customer' && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Purchase Stats</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Static Info Card */}
          <div className="md:col-span-1 card-premium space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-full flex items-center justify-center font-extrabold text-3xl border border-slate-200 dark:border-slate-700 mx-auto overflow-hidden shadow-sm">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100">{user.name}</h3>
                <span className={`inline-block px-2.5 py-0.5 mt-1.5 rounded text-[10px] font-bold uppercase ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-150 dark:border-slate-850 text-xs">
              <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-350">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-350">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{user.phone || 'No phone added'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-350">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Permissions: Full {user.role} access</span>
              </div>
            </div>
          </div>

          {/* Dynamic Content Panel */}
          <div className="md:col-span-2 space-y-6">
            {activeTab === 'profile' && (
              <div className="card-premium">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-6">
                  <Settings className="w-4 h-4 text-blue-500" />
                  Update Profile Details
                </h3>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {profileSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-premium"
                      placeholder="Your Full Name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-premium"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Profile Photo URL
                    </label>
                    <input
                      type="text"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      className="input-premium"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="btn-primary py-2 px-4 justify-center text-xs"
                  >
                    {profileLoading ? <Spinner size="sm" color="white" /> : 'Save Profile Details'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="card-premium">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-6">
                  <Key className="w-4 h-4 text-blue-500" />
                  Change Account Password
                </h3>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  {securitySuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{securitySuccess}</span>
                    </div>
                  )}

                  {securityError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{securityError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-premium"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-premium"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="input-premium"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={securityLoading}
                    className="btn-primary py-2 px-4 justify-center text-xs"
                  >
                    {securityLoading ? <Spinner size="sm" color="white" /> : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'stats' && user.role === 'customer' && (
              <div className="space-y-6">
                {statsLoading ? (
                  <div className="card-premium flex justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="card-premium flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-455 uppercase tracking-wider font-semibold">Total Spent</p>
                          <p className="text-sm font-black font-mono text-slate-850 dark:text-slate-100 mt-0.5">₹{stats.kpis.totalSpent}</p>
                        </div>
                      </div>

                      <div className="card-premium flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-xl">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-455 uppercase tracking-wider font-semibold">Orders Fulfilled</p>
                          <p className="text-sm font-black font-mono text-slate-850 dark:text-slate-100 mt-0.5">{stats.kpis.totalOrders} requests</p>
                        </div>
                      </div>

                      <div className="card-premium flex items-center gap-3 border border-emerald-100 dark:border-emerald-950/45 bg-emerald-50/20 dark:bg-emerald-950/5">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 rounded-xl">
                          <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-455 uppercase tracking-wider font-semibold">Saved (Competition)</p>
                          <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">₹{stats.kpis.totalSaved}</p>
                        </div>
                      </div>
                    </div>

                    {stats.categoryStats && stats.categoryStats.length > 0 ? (
                      <div className="card-premium space-y-4 text-xs">
                        <h4 className="font-bold text-xs text-slate-805 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          Purchased Categories Distribution
                        </h4>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {stats.categoryStats.map((cat, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-650 dark:text-slate-350 rounded border border-slate-150 dark:border-slate-750 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {cat.name} ({cat.value} items)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="card-premium text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                        No purchased categories recorded yet.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="card-premium text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                    Failed to load analytics summaries.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
