import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { BarChart3, TrendingUp, ShoppingBag, Star, Package, ArrowUpRight, DollarSign, Calendar } from 'lucide-react';

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    activeOrders: number;
    inventoryCount: number;
    rating: number;
    reviewsCount: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  topProducts: Array<{ name: string; sales: number; revenue?: number }>;
  revenueTrend: Array<{ date: string; revenue: number }>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/retailer');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching retailer analytics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getMaxRevenue = () => {
    if (!data) return 1;
    return Math.max(...data.revenueTrend.map((t) => t.revenue));
  };

  const getMaxSales = () => {
    if (!data || data.topProducts.length === 0) return 1;
    return Math.max(...data.topProducts.map((p) => p.sales));
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Store Performance Analytics
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last 7 Days</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            
            {/* Detailed Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Revenue Weekly Trend Chart (Pure CSS) */}
              <div className="lg:col-span-2 card-premium space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">Daily Sales Growth</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Total transaction values logged per day</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-250/20">
                    <TrendingUp className="w-3.5 h-3.5" /> +14.2%
                  </span>
                </div>

                {/* Graph bars container */}
                <div className="h-64 flex items-end justify-between gap-4 pt-8 border-b border-slate-100 dark:border-slate-800 px-2 pb-2">
                  {data.revenueTrend.map((day, idx) => {
                    const heightPercent = (day.revenue / getMaxRevenue()) * 85 + 5; // offset for minimum height visual
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        {/* Tooltip value */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute transform -translate-y-16 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-mono text-[9px] font-bold px-2 py-1 rounded shadow-premium z-10">
                          ₹{day.revenue}
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-500 rounded-t-lg transition-all duration-500 shadow-sm"
                          style={{ height: `${heightPercent}%` }}
                        />
                        {/* Date Label */}
                        <span className="text-[10px] font-semibold text-slate-400 mt-1">{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Best Selling Products */}
              <div className="lg:col-span-1 card-premium space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">Best Sellers</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Top performing products by units shipped</p>
                </div>

                <div className="space-y-4">
                  {data.topProducts.map((p, idx) => {
                    const progressPercent = (p.sales / getMaxSales()) * 100;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[150px]">{p.name}</span>
                          <span className="font-bold font-mono text-slate-500">{p.sales} orders</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-700"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card-premium space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gross Revenue</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">₹{data.kpis.totalRevenue}</span>
                  <span className="text-xs text-slate-450">INR</span>
                </div>
                <div className="text-[10px] text-slate-450 leading-relaxed">
                  Reflects final delivered orders. Excluding pending marketplace offers.
                </div>
              </div>

              <div className="card-premium space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg Order Value</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">₹{data.kpis.avgOrderValue || 0}</span>
                  <span className="text-xs text-slate-450">INR</span>
                </div>
                <div className="text-[10px] text-slate-450 leading-relaxed">
                  Average transaction amount across all your fulfilled orders.
                </div>
              </div>

              <div className="card-premium space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bids Conversion</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{data.kpis.conversionRate || 0}%</span>
                  <span className="text-xs text-slate-455">accepted</span>
                </div>
                <div className="text-[10px] text-slate-455 leading-relaxed">
                  Percentage of bid proposals accepted by marketplace customers.
                </div>
              </div>

              <div className="card-premium space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Satisfaction</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{data.kpis.rating}</span>
                  <div className="flex text-amber-500"><Star className="w-4 h-4 fill-amber-500 animate-pulse" /></div>
                  <span className="text-xs text-slate-455">({data.kpis.reviewsCount} reviews)</span>
                </div>
                <div className="text-[10px] text-slate-455 leading-relaxed">
                  Reflects store performance evaluated by neighboring buyers.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">Failed to render stats.</div>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
