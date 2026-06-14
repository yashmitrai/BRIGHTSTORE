import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { ShieldAlert, Users, Store, ShoppingBag, ShieldCheck, DollarSign, Award } from 'lucide-react';

interface OverviewData {
  kpis: {
    totalGMV: number;
    totalOrders: number;
    totalUsers: number;
    totalRetailers: number;
    unverifiedRetailers: number;
  };
  orderTrend: Array<{ month: string; gmv: number; orders: number }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const response = await api.get('/analytics/admin');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching admin analytics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const getTrendData = () => {
    if (!data || !data.orderTrend || data.orderTrend.length === 0) {
      return [
        { month: 'Jan', gmv: 4500, orders: 15 },
        { month: 'Feb', gmv: 8900, orders: 32 },
        { month: 'Mar', gmv: 15400, orders: 54 },
        { month: 'Apr', gmv: 21000, orders: 75 },
        { month: 'May', gmv: 34000, orders: 110 },
        { month: 'Jun', gmv: data?.kpis.totalGMV || 45000, orders: data?.kpis.totalOrders || 142 },
      ];
    }
    return data.orderTrend;
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Platform Admin Overview
          </h2>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded">
            Superuser scope
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="card-premium space-y-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Gross GMV</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">₹{data.kpis.totalGMV}</span>
                  <span className="text-[10px] text-slate-400">INR</span>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed">Platform-wide total value of delivered orders.</p>
              </div>

              <div className="card-premium space-y-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{data.kpis.totalOrders}</span>
                  <span className="text-[10px] text-slate-400">orders</span>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed">Sum total of matching requests submitted.</p>
              </div>

              <div className="card-premium space-y-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Retailer Stores</span>
                  <Store className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{data.kpis.totalRetailers}</span>
                  <span className="text-[10px] text-slate-400">stores</span>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed">{data.kpis.totalRetailers - data.kpis.unverifiedRetailers} verified, {data.kpis.unverifiedRetailers} awaiting.</p>
              </div>

              <div className="card-premium space-y-4">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Platform Registries</span>
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{data.kpis.totalUsers}</span>
                  <span className="text-[10px] text-slate-400">users</span>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed">Includes customers, retailers, and administrators.</p>
              </div>

            </div>

            {/* Platform Revenue Trend Chart */}
            <div className="card-premium space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">Monthly GMV Growth</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total transaction values logged per month</p>
              </div>
              <div className="h-64 flex items-end justify-between gap-6 pt-8 border-b border-slate-100 dark:border-slate-800 px-4 pb-2">
                {getTrendData().map((trend, idx) => {
                  const maxGMV = Math.max(...getTrendData().map(t => t.gmv), 1);
                  const heightPercent = (trend.gmv / maxGMV) * 80 + 10;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute transform -translate-y-16 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-mono text-[9px] font-bold px-2 py-1 rounded shadow-premium z-10 whitespace-nowrap">
                        ₹{trend.gmv} ({trend.orders} orders)
                      </div>
                      <div
                        className="w-full max-w-[50px] bg-slate-100 dark:bg-slate-800 hover:bg-purple-650 dark:hover:bg-purple-500 rounded-t-lg transition-all duration-500 shadow-sm"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] font-semibold text-slate-400 mt-1">{trend.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="card-premium space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Retailer Verification Actions</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  There are <span className="font-bold text-slate-700 dark:text-slate-300">{data.kpis.unverifiedRetailers} unverified store profiles</span> awaiting admin review. Merchants cannot place bids on the marketplace until verified.
                </p>
                <button
                  onClick={() => navigate('/admin/verification')}
                  className="btn-accent text-xs py-2 w-full mt-2 font-bold shadow-sm"
                >
                  Go to Verification Panel
                </button>
              </div>

              <div className="card-premium space-y-4">
                <h3 className="font-bold text-sm text-slate-855 dark:text-slate-200">User Directory Management</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Monitor all registered customer, retailer, and staff logins. Modify credentials, inspect phone registry fields, or audit database document entries.
                </p>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="btn-secondary text-xs py-2 w-full mt-2 font-bold"
                >
                  Manage User Directory
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">Failed to render administrative overview.</div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
