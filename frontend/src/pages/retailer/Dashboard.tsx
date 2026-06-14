import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { DollarSign, ShoppingBag, Award, BarChart3, Package, Truck, CheckCircle, Clock, Star, Phone, MapPin } from 'lucide-react';

interface KPI {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  inventoryCount: number;
  rating: number;
  reviewsCount: number;
}

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  status: 'accepted' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryLocation: { street: string; city: string; postalCode: string };
  deliveryPreference: string;
  totalAmount: number;
  updatedAt: string;
}

const RetailerDashboard: React.FC = () => {
  const { retailer } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch KPIs
      const kpiRes = await api.get('/analytics/retailer');
      setKpis(kpiRes.data.kpis);

      // 2. Fetch Retailer Orders
      const orderRes = await api.get('/orders/retailer');
      // Filter only active orders (not delivered or cancelled)
      const active = orderRes.data.filter((o: Order) =>
        ['accepted', 'packed', 'out_for_delivery'].includes(o.status)
      );
      setActiveOrders(active);
    } catch (error) {
      console.error('Error fetching retailer stats', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time socket events for retailer dashboard updates
  useSocket({
    bid_accepted: () => {
      fetchDashboardData();
    },
  });

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'accepted') nextStatus = 'packed';
    else if (currentStatus === 'packed') nextStatus = 'out_for_delivery';
    else if (currentStatus === 'out_for_delivery') nextStatus = 'delivered';

    if (!nextStatus) return;

    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status: nextStatus });
      await fetchDashboardData();
    } catch (err) {
      console.error('Error updating order status', err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusActionLabel = (status: string) => {
    if (status === 'accepted') return 'Mark Packed';
    if (status === 'packed') return 'Ship Order';
    if (status === 'out_for_delivery') return 'Mark Delivered';
    return '';
  };

  const getStatusStepperColor = (status: string) => {
    if (status === 'accepted') return 'bg-yellow-500 text-white';
    if (status === 'packed') return 'bg-indigo-500 text-white';
    if (status === 'out_for_delivery') return 'bg-purple-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Verification banner if not verified */}
        {retailer && !retailer.isVerified && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Award className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Your Store is Awaiting Verification</p>
              <p className="mt-1 leading-relaxed text-amber-600/90 dark:text-amber-400">
                An administrator must verify your retailer profile before you can submit quotes on customer orders. You can configure your product inventory in the meantime.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Dashboard Overview
          </h2>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Live Feed
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-slate-450 font-medium">Aggregating store telemetry...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="card-premium flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Sales</p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">₹{kpis?.totalRevenue}</p>
                </div>
              </div>

              <div className="card-premium flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Orders</p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">{kpis?.totalOrders}</p>
                </div>
              </div>

              <div className="card-premium flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Products Catalog</p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">{kpis?.inventoryCount}</p>
                </div>
              </div>

              <div className="card-premium flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rating</p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">{kpis?.rating} ({kpis?.reviewsCount})</p>
                </div>
              </div>
            </div>

            {/* Active Orders Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Active Fulfillments ({activeOrders.length})
              </h3>

              {activeOrders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  All orders packed and shipped. Go to Marketplace to bid on new requests!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeOrders.map((order) => (
                    <div key={order._id} className="card-premium space-y-4 hover:shadow-premium-md flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-3">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400">Order ID: #{order._id.substring(18)}</span>
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5">Customer: {order.customer.name}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusStepperColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-2 text-xs">
                          {order.customer.phone && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{order.customer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{order.deliveryLocation.street}, {order.deliveryLocation.city}</span>
                          </div>
                        </div>

                        {/* Items Checklist */}
                        <div className="mt-4">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Items Checklist</span>
                          <div className="mt-1.5 space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50/50 dark:border-slate-850/50">
                                <span className="text-slate-650 dark:text-slate-350 font-medium">{item.name}</span>
                                <span className="font-bold font-mono text-slate-500">Qty: {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 mt-4">
                        <div className="font-mono text-xs">
                          <span className="text-[10px] text-slate-400 block">Total Value</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">₹{order.totalAmount}</span>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus(order._id, order.status)}
                          disabled={updatingId === order._id}
                          className="btn-accent text-xs font-bold px-3 py-1.5 shadow-sm"
                        >
                          {updatingId === order._id ? (
                            <Spinner size="sm" color="white" />
                          ) : (
                            getStatusActionLabel(order.status)
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default RetailerDashboard;
