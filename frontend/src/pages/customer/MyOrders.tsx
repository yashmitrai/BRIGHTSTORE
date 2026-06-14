import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import Skeleton from '../../components/common/Skeleton';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { ShoppingBag, Clock, ShieldCheck, MapPin, Truck, CheckCircle2, ChevronRight, DollarSign, RefreshCw, Star, Info } from 'lucide-react';
import RetailerProfileModal from '../../components/common/RetailerProfileModal';
import WriteReviewModal from '../../components/common/WriteReviewModal';

interface Order {
  _id: string;
  items: Array<{ name: string; quantity: number; image?: string }>;
  status: 'pending' | 'offered' | 'accepted' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryLocation: { street: string; city: string; postalCode: string };
  deliveryPreference: string;
  totalAmount?: number;
  retailer?: {
    _id: string;
    storeName: string;
    storeAddress: string;
    rating: number;
    reviewsCount: number;
  };
  createdAt: string;
}

interface Offer {
  _id: string;
  retailer: {
    _id: string;
    storeName: string;
    storeAddress: string;
    rating: number;
    reviewsCount: number;
    description?: string;
  };
  itemsPrice: number;
  deliveryFee: number;
  totalCost: number;
  deliveryEstimate: string;
  distance: number;
  notes?: string;
  itemsList?: Array<{
    name: string;
    quantity: number;
    price: number;
    inStock: boolean;
    alternativeName?: string;
  }>;
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // Profile & Review Modal states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileRetailerId, setProfileRetailerId] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRetailerId, setReviewRetailerId] = useState('');
  const [reviewRetailerName, setReviewRetailerName] = useState('');

  const fetchOrders = async (selectFirst = false) => {
    try {
      const response = await api.get('/orders/customer');
      setOrders(response.data);
      if (response.data.length > 0) {
        if (selectFirst || !selectedOrder) {
          setSelectedOrder(response.data[0]);
        } else {
          // Keep current selected order updated with fresh data
          const updated = response.data.find((o: Order) => o._id === selectedOrder._id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching customer orders', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async (orderId: string) => {
    setOffersLoading(true);
    try {
      const response = await api.get(`/orders/${orderId}/offers`);
      setOffers(response.data);
    } catch (err) {
      console.error('Error fetching offers', err);
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
  }, []);

  // Fetch offers whenever the selected order changes and its status is pending or offered
  useEffect(() => {
    if (selectedOrder && (selectedOrder.status === 'pending' || selectedOrder.status === 'offered')) {
      fetchOffers(selectedOrder._id);
    } else {
      setOffers([]);
    }
  }, [selectedOrder]);

  // Real-time socket events for customer order tracking
  useSocket({
    new_bid: (data: any) => {
      if (selectedOrder && data.orderId === selectedOrder._id) {
        fetchOffers(selectedOrder._id);
      }
      fetchOrders();
    },
    status_updated: (updatedOrder: any) => {
      if (selectedOrder && updatedOrder._id === selectedOrder._id) {
        setSelectedOrder(updatedOrder);
      }
      fetchOrders();
    },
  });

  const handleSelectOffer = async (offerId: string) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await api.post(`/orders/${selectedOrder._id}/accept-offer`, { offerId });
      // Refresh order list and current detail
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept offer');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: any = {
      pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      offered: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse',
      accepted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
      packed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      out_for_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    };

    const labelMap: any = {
      pending: 'Awaiting offers',
      offered: 'Offers received!',
      accepted: 'Preparing order',
      packed: 'Packed & ready',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${classes[status] || ''}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  // Live order progress bar stepper
  const renderLiveProgress = (status: string) => {
    const steps = ['accepted', 'packed', 'out_for_delivery', 'delivered'];
    const currentIdx = steps.indexOf(status);

    if (currentIdx === -1 && status !== 'cancelled') return null;

    const stepLabel = (step: string) => {
      switch (step) {
        case 'accepted': return 'Accepted';
        case 'packed': return 'Packed';
        case 'out_for_delivery': return 'Out For Delivery';
        case 'delivered': return 'Delivered';
        default: return '';
      }
    };

    const stepIcon = (step: string, index: number) => {
      const active = index <= currentIdx;
      const pulse = index === currentIdx;

      let Icon = Clock;
      if (step === 'packed') Icon = ShieldCheck;
      if (step === 'out_for_delivery') Icon = Truck;
      if (step === 'delivered') Icon = CheckCircle2;

      return (
        <div className="flex flex-col items-center relative z-10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
            active
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
          } ${pulse ? 'ring-4 ring-blue-500/20' : ''}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={`text-[10px] font-bold mt-2 whitespace-nowrap ${active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
            {stepLabel(step)}
          </span>
        </div>
      );
    };

    return (
      <div className="py-6 border-b border-slate-100 dark:border-slate-850">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-6">Live Delivery Status</h4>
        <div className="relative flex items-center justify-between max-w-md mx-auto">
          {/* Connector Line */}
          <div className="absolute left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 top-4 -z-0">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step, i) => (
            <React.Fragment key={step}>
              {stepIcon(step, i)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
          Your Delivery Requests
        </h2>
        <button
          onClick={() => fetchOrders()}
          className="p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="lg:col-span-2 card-premium space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
              <div className="space-y-2 w-1/3">
                <Skeleton variant="text" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
              <Skeleton className="w-20 h-5" />
            </div>
            <div className="space-y-3">
              <Skeleton variant="text" className="w-1/4" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-premium">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-350 mb-3" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350">No delivery requests yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Create your first shopping list request to receive bids from nearby retailers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Orders List */}
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedOrder?._id === order._id
                    ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-slate-900 dark:text-white shadow-premium-md'
                    : 'border-slate-200/80 bg-white dark:border-slate-850 dark:bg-slate-900 dark:text-slate-150 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono opacity-80">
                    ID: #{order._id.substring(18)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <p className="text-xs font-bold line-clamp-1">
                  {order.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                </p>

                <div className="flex items-center justify-between mt-4 text-[10px] opacity-70 border-t border-slate-100/10 pt-2.5">
                  <span>
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {order.totalAmount && (
                    <span className="font-bold font-mono">₹{order.totalAmount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Selected Order Detail */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="card-premium space-y-6">
                {/* Detail Header */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">
                      Order #{selectedOrder._id}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted on {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {/* Live Delivery Progress Tracker */}
                {renderLiveProgress(selectedOrder.status)}

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2 border-b border-slate-100 dark:border-slate-850">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Shipping To</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                      {selectedOrder.deliveryLocation.street}, {selectedOrder.deliveryLocation.city}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedOrder.deliveryLocation.postalCode}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Delivery Speed</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold capitalize mt-1">
                      {selectedOrder.deliveryPreference} delivery
                    </p>
                  </div>
                </div>                {/* Assigned Retailer Card */}
                {selectedOrder.retailer && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-xl">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Assigned Retailer</span>
                    <div className="flex items-start justify-between mt-2">
                      <div>
                        <h4
                          onClick={() => {
                            setProfileRetailerId(selectedOrder.retailer!._id);
                            setProfileModalOpen(true);
                          }}
                          className="font-bold text-xs text-slate-850 dark:text-slate-200 hover:underline hover:text-blue-500 cursor-pointer"
                        >
                          {selectedOrder.retailer.storeName}
                        </h4>
                        <p className="text-[11px] text-slate-455 leading-relaxed mt-0.5">{selectedOrder.retailer.storeAddress}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200/40">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{selectedOrder.retailer.rating}</span>
                        </div>
                      </div>
                    </div>
                    {selectedOrder.status === 'delivered' && (
                      <button
                        onClick={() => {
                          setReviewRetailerId(selectedOrder.retailer!._id);
                          setReviewRetailerName(selectedOrder.retailer!.storeName);
                          setReviewModalOpen(true);
                        }}
                        className="btn-accent text-[10px] py-1.5 px-3 font-bold mt-3.5 shadow-sm"
                      >
                        Write Store Review
                      </button>
                    )}
                  </div>
                )}

                {/* Items requested */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-3.5">Requested Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-slate-50/50 dark:border-slate-850/50">
                        <span className="text-slate-700 dark:text-slate-350 font-medium">{item.name}</span>
                        <span className="font-bold font-mono text-slate-500">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OFFERS BIDDING COMPARISON SYSTEM */}
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'offered') && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 flex items-center justify-between">
                      <span>Retailer Bids & Offers</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                        {offers.length} bid(s) received
                      </span>
                    </h4>

                    {offersLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="md" />
                      </div>
                    ) : offers.length === 0 ? (
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl text-center text-xs text-slate-450">
                        <Info className="w-4 h-4 mx-auto mb-2 text-slate-350" />
                        Awaiting proposals. Nearby retailers have been notified and will submit quotes shortly.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {offers.map((offer) => (
                          <div
                            key={offer._id}
                            className="p-5 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:shadow-premium-md transition-all flex flex-col gap-3 bg-white dark:bg-slate-900"
                          >
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                              <div className="space-y-1 max-w-sm">
                                <div className="flex items-center gap-2">
                                  <h5
                                    onClick={() => {
                                      setProfileRetailerId(offer.retailer._id);
                                      setProfileModalOpen(true);
                                    }}
                                    className="font-bold text-xs text-slate-850 dark:text-slate-100 hover:underline hover:text-blue-500 cursor-pointer"
                                  >
                                    {offer.retailer.storeName}
                                  </h5>
                                  <div className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span>{offer.retailer.rating}</span>
                                  </div>
                                </div>
                                {offer.retailer.description && (
                                  <p className="text-[10px] text-slate-450 line-clamp-1 leading-relaxed">{offer.retailer.description}</p>
                                )}
                                <div className="flex gap-4 pt-1.5 text-[10px] text-slate-400 font-semibold">
                                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-500" /> {offer.deliveryEstimate}</span>
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-red-500" /> {offer.distance.toFixed(1)} km away</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 border-slate-150">
                                <div className="text-right">
                                  <div className="text-[10px] text-slate-400">Total Quote</div>
                                  <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">₹{offer.totalCost}</div>
                                  <div className="text-[9px] text-slate-450 mt-0.5">₹{offer.itemsPrice} items + ₹{offer.deliveryFee} fee</div>
                                </div>

                                <button
                                  onClick={() => handleSelectOffer(offer._id)}
                                  disabled={actionLoading}
                                  className="btn-accent text-xs font-bold px-4 py-2 shrink-0 shadow-sm"
                                >
                                  {actionLoading ? <Spinner size="sm" color="white" /> : 'Accept & Pay'}
                                </button>
                              </div>
                            </div>

                            {offer.notes && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-850/40 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 italic">
                                &ldquo;{offer.notes}&rdquo;
                              </div>
                            )}

                            {offer.itemsList && offer.itemsList.length > 0 && (
                              <div className="border-t border-slate-100 dark:border-slate-850/60 pt-2.5">
                                <button
                                  type="button"
                                  onClick={() => setExpandedOfferId(expandedOfferId === offer._id ? null : offer._id)}
                                  className="text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-1"
                                >
                                  {expandedOfferId === offer._id ? 'Hide Itemized Breakdown' : 'View Itemized Breakdown'}
                                </button>

                                {expandedOfferId === offer._id && (
                                  <div className="mt-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60">
                                    <h6 className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Item Details & Substitution Quote</h6>
                                    <div className="space-y-2 divide-y divide-slate-100/50 dark:divide-slate-850/50">
                                      {offer.itemsList.map((item, idx) => (
                                        <div key={idx} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
                                          <div className="flex flex-col flex-1">
                                            <span className="font-bold text-slate-750 dark:text-slate-300">
                                              {item.name} <span className="text-slate-400 font-normal">x {item.quantity}</span>
                                            </span>
                                            {!item.inStock && (
                                              <span className="text-[10px] text-red-500 font-semibold mt-0.5">
                                                Out of Stock {item.alternativeName ? `(Substitution: ${item.alternativeName})` : ''}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-right">
                                            {item.inStock ? (
                                              <span className="font-mono text-slate-600 dark:text-slate-400 font-bold">
                                                ₹{item.price * item.quantity} (₹{item.price} each)
                                              </span>
                                            ) : (
                                              <span className="text-red-500 font-bold font-mono">Unavailable</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                Select an order from the list to track live delivery status or review bids.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Retailer Profile Modal */}
      <RetailerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        retailerId={profileRetailerId}
      />

      {/* Review Submission Modal */}
      <WriteReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        retailerId={reviewRetailerId}
        retailerName={reviewRetailerName}
        onSuccess={async () => {
          alert('Thank you for submitting your store review!');
          await fetchOrders();
        }}
      />
    </Layout>
  );
};

export default MyOrders;
