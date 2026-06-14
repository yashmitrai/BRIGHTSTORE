import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Phone, Shield, Store, MapPin, Tag, Star, Award, TrendingDown, CreditCard, ShoppingBag, Sparkles } from 'lucide-react';

interface CustomerStats {
  kpis: {
    totalSpent: number;
    totalOrders: number;
    totalSaved: number;
  };
  categoryStats: Array<{ name: string; value: number }>;
}

const Profile: React.FC = () => {
  const { user, retailer } = useAuth();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

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
        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
          Your Account Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Details Card */}
          <div className="md:col-span-1 card-premium space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-full flex items-center justify-center font-extrabold text-2xl border border-slate-200 dark:border-slate-700">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100">{user.name}</h3>
                <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-850 text-xs">
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

          {/* Store Info Card (Retailer only) */}
          {user.role === 'retailer' && retailer && (
            <div className="md:col-span-2 card-premium space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-lg">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-100">{retailer.storeName}</h3>
                    <p className="text-xs text-slate-450 mt-0.5">Store Registration ID: {retailer._id}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  retailer.isVerified
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {retailer.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>

              {/* Store Analytics Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="text-amber-500"><Star className="w-4 h-4 fill-amber-500" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Store Rating</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{retailer.rating} ({retailer.reviewsCount} reviews)</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="text-blue-500"><Award className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Store Verification</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{retailer.isVerified ? 'Active Seller' : 'Review Phase'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</span>
                  <p className="text-slate-650 dark:text-slate-355 font-medium mt-1 leading-relaxed">{retailer.storeAddress}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Product Categories</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {retailer.category.map((cat, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 rounded border border-slate-150 dark:border-slate-750">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {retailer.description && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Store Description</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{retailer.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spend Analytics & Profile Description (Customer only) */}
          {user.role === 'customer' && (
            <div className="md:col-span-2 space-y-6">
              <div className="card-premium space-y-4 text-xs">
                <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">Customer Access Account</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Welcome to BrightStore! You are logged in with a Customer profile. You can browse local inventories, select delivery configurations, submit shopping checklist request orders, and verify incoming bidding quotes from local merchants in real-time.
                </p>
              </div>

              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="card-premium flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold">Total Spent</p>
                      <p className="text-sm font-black font-mono text-slate-850 dark:text-slate-100 mt-0.5">₹{stats.kpis.totalSpent}</p>
                    </div>
                  </div>

                  <div className="card-premium flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-xl">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold">Orders Fulfilled</p>
                      <p className="text-sm font-black font-mono text-slate-850 dark:text-slate-100 mt-0.5">{stats.kpis.totalOrders} requests</p>
                    </div>
                  </div>

                  <div className="card-premium flex items-center gap-3 border border-emerald-100 dark:border-emerald-950/45 bg-emerald-50/20 dark:bg-emerald-950/5">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 rounded-xl">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold">Saved (Competition)</p>
                      <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">₹{stats.kpis.totalSaved}</p>
                    </div>
                  </div>
                </div>
              )}

              {stats && stats.categoryStats && stats.categoryStats.length > 0 && (
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
              )}
            </div>
          )}

          {/* Fallback description card for admins */}
          {user.role === 'admin' && (
            <div className="md:col-span-2 card-premium space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-805 dark:text-slate-200">System Administrator Account</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Welcome to the BrightStore Administrator platform. You have elevated authorization to audit platform details, confirm retailer registrations, monitor deliveries, manage user accounts, and resolve client disputes.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
