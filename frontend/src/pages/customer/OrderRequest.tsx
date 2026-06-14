import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { Send, MapPin, Plus, Trash2, ArrowLeft, PlusCircle, Clock, Check } from 'lucide-react';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
    category?: string;
  };
  quantity: number;
}

interface Address {
  _id: string;
  tag: string;
  street: string;
  city: string;
  postalCode: string;
}

const OrderRequest: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  
  // Order items state (prefilled from cart)
  const [items, setItems] = useState<any[]>([]);
  const [deliveryPreference, setDeliveryPreference] = useState<'instant' | 'scheduled'>('instant');
  const [error, setError] = useState<string | null>(null);

  // Custom Item Fields
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState(1);

  // Address Modal Fields
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressTag, setAddressTag] = useState('Home');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    // 1. Load cart items
    const savedCart = localStorage.getItem('brightstore_cart');
    if (savedCart) {
      try {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        const prefilledItems = parsedCart.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          image: item.product.imageUrl || '',
        }));
        setItems(prefilledItems);
      } catch (e) {
        console.error('Error parsing cart', e);
      }
    }

    // 2. Fetch addresses
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      setAddresses(response.data);
      if (response.data.length > 0) {
        setSelectedAddressId(response.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;

    setItems([
      ...items,
      {
        name: customItemName.trim(),
        quantity: customItemQty,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100', // standard box image placeholder for custom
      },
    ]);
    setCustomItemName('');
    setCustomItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressStreet || !addressCity || !addressPostalCode) return;

    setSavingAddress(true);
    try {
      const response = await api.post('/addresses', {
        tag: addressTag,
        street: addressStreet,
        city: addressCity,
        postalCode: addressPostalCode,
      });
      setAddresses([...addresses, response.data]);
      setSelectedAddressId(response.data._id);
      
      // Clear address inputs
      setAddressStreet('');
      setAddressCity('');
      setAddressPostalCode('');
      setAddressModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      setError('Your shopping list request is empty');
      return;
    }

    const selectedAddr = addresses.find((addr) => addr._id === selectedAddressId);
    if (!selectedAddr) {
      setError('Please select a delivery address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/orders', {
        items,
        deliveryLocation: {
          tag: selectedAddr.tag,
          street: selectedAddr.street,
          city: selectedAddr.city,
          postalCode: selectedAddr.postalCode,
        },
        deliveryPreference,
      });

      // Clear local storage cart
      localStorage.removeItem('brightstore_cart');

      // Navigate to order history / tracking
      navigate('/orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit order request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </button>

        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight mb-8">
          Request Delivery Offers
        </h2>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Items checklist */}
          <div className="md:col-span-2 space-y-6">
            <div className="card-premium">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3.5 mb-4">
                Your Shopping List Items
              </h3>

              {items.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Your request list is currently empty. Add custom items below.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-850">
                  {items.map((item, index) => (
                    <div key={index} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-400">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            item.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 mt-0.5">Quantity: {item.quantity}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Item Form */}
              <form onSubmit={handleAddCustomItem} className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Add custom item (not in catalog)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., 2 Bunches of Fresh Mint"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="input-premium py-1.5"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(Number(e.target.value))}
                    className="input-premium py-1.5 text-center"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-secondary py-2 flex items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-slate-700"
                >
                  <PlusCircle className="w-4.5 h-4.5 text-blue-500" />
                  <span className="text-xs font-semibold">Add</span>
                </button>
              </form>
            </div>
          </div>

          {/* Delivery & Settings */}
          <div className="space-y-6">
            {/* Address Selection */}
            <div className="card-premium">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Delivery Address
                </h3>
                <button
                  onClick={() => setAddressModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-500"
                >
                  + Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-450 mb-3">No saved addresses found</p>
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="btn-secondary text-xs mx-auto py-1.5"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`block p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedAddressId === addr._id
                          ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="selectedAddress"
                          value={addr._id}
                          checked={selectedAddressId === addr._id}
                          onChange={() => setSelectedAddressId(addr._id)}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{addr.tag}</span>
                          <p className="text-slate-400 mt-1 line-clamp-2 leading-relaxed">{addr.street}, {addr.city}</p>
                          <p className="text-slate-500 mt-0.5 font-mono">{addr.postalCode}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Preferences */}
            <div className="card-premium">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                Delivery Preference
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeliveryPreference('instant')}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1.5 justify-center transition-all ${
                    deliveryPreference === 'instant'
                      ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500 text-blue-600'
                      : 'border-slate-200 dark:border-slate-850 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold">Instant</span>
                  <span className="text-[9px] text-slate-400">Within 30 mins</span>
                </button>

                <button
                  onClick={() => setDeliveryPreference('scheduled')}
                  className={`p-3 border rounded-lg flex flex-col items-center gap-1.5 justify-center transition-all ${
                    deliveryPreference === 'scheduled'
                      ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-500 text-blue-600'
                      : 'border-slate-200 dark:border-slate-850 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold">Scheduled</span>
                  <span className="text-[9px] text-slate-400">Later Today</span>
                </button>
              </div>
            </div>

            {/* Submit Section */}
            <button
              onClick={handleSubmitOrder}
              disabled={loading || items.length === 0}
              className="btn-accent w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send List to Retailers</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Saved Address Modal Overlay */}
        {addressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm animate-fade-in p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium-lg overflow-hidden animate-slide-up">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Save Delivery Address</h3>
                <button
                  onClick={() => setAddressModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Label (Tag)
                  </label>
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAddressTag(tag)}
                        className={`flex-1 py-1.5 text-xs font-medium border rounded-lg transition-all ${
                          addressTag === tag
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                            : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    className="input-premium"
                    placeholder="Flat/House No, Building, Street Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      className="input-premium"
                      placeholder="Bangalore"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={addressPostalCode}
                      onChange={(e) => setAddressPostalCode(e.target.value)}
                      className="input-premium"
                      placeholder="560038"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(false)}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="btn-accent flex-1 text-xs"
                  >
                    {savingAddress ? <Spinner size="sm" color="white" /> : 'Save Address'}
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

export default OrderRequest;
