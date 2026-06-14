import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import {
  DollarSign,
  ShoppingBag,
  Award,
  Package,
  CheckCircle,
  Star,
  Phone,
  MapPin,
  Settings,
  LayoutDashboard,
  Clock,
  Mail,
  Tag,
  FileText,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';

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
  const { retailer, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form states for retailer settings
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [closingHours, setClosingHours] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeBanner, setStoreBanner] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch KPIs
      const kpiRes = await api.get('/analytics/retailer');
      setKpis(kpiRes.data.kpis);

      // 2. Fetch Retailer Orders
      const orderRes = await api.get('/orders/retailer');
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
    if (retailer) {
      setStoreName(retailer.storeName || '');
      setStoreAddress(retailer.storeAddress || '');
      setCategory(retailer.category ? retailer.category.join(', ') : '');
      setDescription(retailer.description || '');
      setOpeningHours(retailer.openingHours || '09:00');
      setClosingHours(retailer.closingHours || '21:00');
      setStoreLogo(retailer.storeLogo || '');
      setStoreBanner(retailer.storeBanner || '');
      setContactPhone(retailer.contactPhone || '');
      setContactEmail(retailer.contactEmail || '');
      if (retailer.location && retailer.location.coordinates) {
        setLongitude(retailer.location.coordinates[0]);
        setLatitude(retailer.location.coordinates[1]);
      }
    }
  }, [retailer]);

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    const payload = {
      storeName,
      storeAddress,
      category,
      description,
      openingHours,
      closingHours,
      storeLogo,
      storeBanner,
      contactPhone,
      contactEmail,
      latitude,
      longitude
    };

    try {
      const response = await api.put('/retailers/profile', payload);
      setSettingsSuccess(response.data.message || 'Store settings saved successfully!');
      await refreshProfile();
    } catch (err: any) {
      setSettingsError(err.response?.data?.message || 'Failed to update store settings');
    } finally {
      setSettingsSaving(false);
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
                An administrator must verify your retailer profile before you can submit quotes on customer orders. You can configure your product inventory and shop settings in the meantime.
              </p>
            </div>
          </div>
        )}

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Settings</span>
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
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
                                    <span className="text-slate-650 dark:text-slate-355 font-medium">{item.name}</span>
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
        ) : (
          /* Store Settings Tab */
          <div className="card-premium space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Store Profile & Settings</h3>
              <p className="text-xs text-slate-455 mt-1">Configure your storefront details, logo, banner, and hours of operations.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              {settingsSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {settingsError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{settingsError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="input-premium"
                    placeholder="E.g., Bright Mart"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Categories (comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-premium"
                    placeholder="Groceries, Dairy, Pharmacy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Shop Address
                </label>
                <input
                  type="text"
                  required
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="input-premium"
                  placeholder="Complete physical address of the store"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Store Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-premium py-2 h-20 resize-none"
                  placeholder="Tell customers about your store..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Opening Hours
                  </label>
                  <input
                    type="text"
                    required
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    className="input-premium"
                    placeholder="E.g., 09:00 AM"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Closing Hours
                  </label>
                  <input
                    type="text"
                    required
                    value={closingHours}
                    onChange={(e) => setClosingHours(e.target.value)}
                    className="input-premium"
                    placeholder="E.g., 09:00 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Phone
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="input-premium"
                    placeholder="Store phone number"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="input-premium"
                    placeholder="Store email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    Store Logo URL
                  </label>
                  <input
                    type="text"
                    value={storeLogo}
                    onChange={(e) => setStoreLogo(e.target.value)}
                    className="input-premium"
                    placeholder="https://example.com/logo.jpg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    Store Banner URL
                  </label>
                  <input
                    type="text"
                    value={storeBanner}
                    onChange={(e) => setStoreBanner(e.target.value)}
                    className="input-premium"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Store Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="input-premium py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Store Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="input-premium py-1"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="btn-accent py-2.5 px-4 justify-center text-xs font-bold w-full"
              >
                {settingsSaving ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Store Profile</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RetailerDashboard;
