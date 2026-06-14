import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import Skeleton from '../../components/common/Skeleton';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { Store, Send, MapPin, Clock, ShoppingBag, Info, ShieldAlert } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  customer: {
    name: string;
  };
  items: OrderItem[];
  status: string;
  deliveryLocation: { street: string; city: string; postalCode: string };
  deliveryPreference: string;
  createdAt: string;
}

const Marketplace: React.FC = () => {
  const { retailer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bid Proposal Form States
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [itemsPrice, setItemsPrice] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [deliveryEstimate, setDeliveryEstimate] = useState('15-20 mins');
  const [distance, setDistance] = useState('1.5');
  const [notes, setNotes] = useState('');
  const [bidItemsList, setBidItemsList] = useState<{
    name: string;
    quantity: number;
    price: number;
    inStock: boolean;
    alternativeName: string;
  }[]>([]);
  const [submittingBid, setSubmittingBid] = useState(false);

  // Auto-sum prices
  useEffect(() => {
    const total = bidItemsList.reduce((sum, item) => sum + (item.inStock ? item.price * item.quantity : 0), 0);
    setItemsPrice(total > 0 ? total.toString() : '');
  }, [bidItemsList]);

  // Real-time socket updates for new incoming customer requests
  useSocket({
    new_request: () => {
      fetchMarketplace();
    },
  });

  const fetchMarketplace = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/marketplace');
      setOrders(response.data);
      if (response.data.length > 0) {
        setSelectedOrder(response.data[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('Are you sure you want to ignore this order request? It will be permanently removed from your feed.')) {
      return;
    }
    try {
      await api.post(`/orders/${selectedOrder._id}/reject`);
      await fetchMarketplace();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to ignore request');
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !itemsPrice || !deliveryFee || !deliveryEstimate || !distance) return;

    setSubmittingBid(true);
    try {
      await api.post(`/orders/${selectedOrder._id}/offers`, {
        itemsPrice: Number(itemsPrice),
        deliveryFee: Number(deliveryFee),
        deliveryEstimate,
        distance: Number(distance),
        notes,
        itemsList: bidItemsList,
      });

      // Clear form & close modal
      setItemsPrice('');
      setNotes('');
      setBidItemsList([]);
      setBidModalOpen(false);
      
      // Refresh list
      await fetchMarketplace();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit offer');
    } finally {
      setSubmittingBid(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Order Marketplace
          </h2>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Client Bids Feed
          </span>
        </div>

        {/* Verification Alert Guard */}
        {retailer && !retailer.isVerified ? (
          <div className="p-8 bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900 rounded-xl text-center max-w-xl mx-auto space-y-3">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-250">Verification Required</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your retailer profile is currently unverified. Only verified stores are authorized to submit price quotes and bidding proposals to customers on the marketplace.
            </p>
          </div>
        ) : loading ? (
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
                <Skeleton className="w-28 h-9" />
              </div>
              <div className="space-y-3">
                <Skeleton variant="text" className="w-1/4" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
              </div>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Store className="w-10 h-10 mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350">Marketplace is quiet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">No pending customer delivery requests right now. Check back shortly for new requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Orders Feed List */}
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
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {order.deliveryPreference}
                    </span>
                  </div>

                  <p className="text-xs font-bold truncate">
                    List of {order.items.length} item(s)
                  </p>

                  <div className="flex items-center justify-between mt-3 text-[10px] opacity-70 border-t border-slate-100/10 pt-2">
                    <span>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-blue-500">View checklist &rarr;</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Order Request Details */}
            <div className="lg:col-span-2">
              {selectedOrder ? (
                <div className="card-premium space-y-6">
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
                    <div>
                      <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">
                        Order Request Checklist
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Posted {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRejectOrder}
                        className="px-3 py-1.5 border border-red-200 hover:border-red-500 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-500 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Ignore
                      </button>
                      <button
                        onClick={() => {
                          const initialItems = selectedOrder.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: 0,
                            inStock: true,
                            alternativeName: ''
                          }));
                          setBidItemsList(initialItems);
                          setNotes('');
                          setBidModalOpen(true);
                        }}
                        className="btn-primary text-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit Bid Offer
                      </button>
                    </div>
                  </div>

                  {/* Delivery Location Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs py-2 border-b border-slate-50 dark:border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Delivery Target</span>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-start gap-1">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{selectedOrder.deliveryLocation.street}, {selectedOrder.deliveryLocation.city}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 ml-5">{selectedOrder.deliveryLocation.postalCode}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Speed Requirement</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="capitalize">{selectedOrder.deliveryPreference} delivery</span>
                      </p>
                    </div>
                  </div>

                  {/* Items checklist */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4">Customer checklist</h4>
                    <div className="space-y-3.5">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs py-2 border-b border-slate-50/50 dark:border-slate-850/50">
                          <span className="text-slate-700 dark:text-slate-350 font-bold">{item.name}</span>
                          <span className="font-bold font-mono text-slate-500">Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                  Select a marketplace customer request list to create proposal quotes.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bid Proposal Modal Overlay */}
        {bidModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium-lg overflow-hidden animate-slide-up">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Submit Bidding Quote</h3>
                <button
                  onClick={() => setBidModalOpen(false)}
                  className="text-slate-400 hover:text-slate-755 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitBid} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Items Pricing Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Adjust Items Price & Stock
                  </h4>
                  <div className="border border-slate-100 dark:border-slate-850 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                    {bidItemsList.map((item, index) => (
                      <div key={index} className="p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.name} (Qty: {item.quantity})
                          </span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.inStock}
                              onChange={(e) => {
                                const newList = [...bidItemsList];
                                newList[index].inStock = e.target.checked;
                                if (!e.target.checked) {
                                  newList[index].price = 0;
                                }
                                setBidItemsList(newList);
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span className="text-[10px] text-slate-500 font-semibold select-none">In Stock</span>
                          </label>
                        </div>

                        {item.inStock ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-450 font-medium">Unit Price (₹):</span>
                            <input
                              type="number"
                              required
                              min="0"
                              value={item.price || ''}
                              onChange={(e) => {
                                const newList = [...bidItemsList];
                                newList[index].price = Number(e.target.value);
                                setBidItemsList(newList);
                              }}
                              className="w-24 px-2 py-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                              placeholder="Price"
                            />
                            <span className="text-[10px] text-slate-450 ml-auto font-mono">
                              Subtotal: ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <label className="block text-[9px] text-slate-400 uppercase font-bold">
                              Suggest Alternative / Reason
                            </label>
                            <input
                              type="text"
                              value={item.alternativeName}
                              onChange={(e) => {
                                const newList = [...bidItemsList];
                                newList[index].alternativeName = e.target.value;
                                setBidItemsList(newList);
                              }}
                              className="w-full px-2.5 py-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                              placeholder="e.g. Out of stock. Suggest alternative."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Items Cost Total (INR)
                  </label>
                  <input
                    type="number"
                    required
                    readOnly
                    value={itemsPrice}
                    className="input-premium font-mono bg-slate-50 dark:bg-slate-950/40 text-slate-500"
                    placeholder="Total items quote price"
                  />
                  <p className="text-[9px] text-slate-450 mt-1">Calculated automatically from item pricing breakdown above.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Delivery Fee (INR)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="input-premium font-mono"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Distance (KM)
                    </label>
                    <input
                      type="text"
                      required
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      className="input-premium font-mono"
                      placeholder="1.2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Delivery Time Estimate
                  </label>
                  <select
                    value={deliveryEstimate}
                    onChange={(e) => setDeliveryEstimate(e.target.value)}
                    className="input-premium"
                  >
                    <option value="10-15 mins">10-15 mins (Lightning)</option>
                    <option value="15-20 mins">15-20 mins (Fast)</option>
                    <option value="25-30 mins">25-30 mins (Standard)</option>
                    <option value="45 mins">45 mins</option>
                    <option value="1 hour">1 hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Notes for Customer (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-premium py-2 resize-none h-20 text-slate-800 dark:text-slate-100"
                    placeholder="Add notes about fresh produce, substitutions, or delivery updates..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setBidModalOpen(false)}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBid}
                    className="btn-accent flex-1 text-xs"
                  >
                    {submittingBid ? <Spinner size="sm" color="white" /> : 'Send Bid Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Marketplace;
