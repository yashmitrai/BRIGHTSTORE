import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { MapPin, Plus, Trash2, Home, Briefcase, Map, PlusCircle } from 'lucide-react';

interface Address {
  _id: string;
  tag: string;
  street: string;
  city: string;
  postalCode: string;
}

const Addresses: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [tag, setTag] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      setAddresses(response.data);
    } catch (err) {
      console.error('Failed to load addresses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !postalCode) return;

    setSaving(true);
    setError(null);
    try {
      const response = await api.post('/addresses', {
        tag,
        street,
        city,
        postalCode,
      });
      setAddresses([...addresses, response.data]);
      
      // Clear forms
      setStreet('');
      setCity('');
      setPostalCode('');
      setFormOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(addresses.filter((addr) => addr._id !== id));
    } catch (err) {
      console.error('Failed to delete address', err);
    }
  };

  const getAddressIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'home':
        return <Home className="w-4 h-4 text-blue-600" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <Map className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Saved Delivery Addresses
          </h2>
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Address
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-250 text-xs text-red-650 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* List of Addresses */}
          <div className="md:col-span-2 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <MapPin className="w-8 h-8 mx-auto text-slate-350 mb-2" />
                <p className="text-xs text-slate-450">No saved addresses found. Add one on the right or above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr._id} className="card-premium flex flex-col justify-between hover:shadow-premium-md relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                        {getAddressIcon(addr.tag)}
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider">{addr.tag}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                        {addr.street}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{addr.city}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{addr.postalCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Address Form Sidebar */}
          {formOpen && (
            <div className="card-premium space-y-5 animate-slide-up">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200">
                  New Address
                </h3>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-xs font-bold text-slate-450 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Address Label
                  </label>
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTag(t)}
                        className={`flex-1 py-1 text-xs font-semibold border rounded-lg transition-all ${
                          tag === t
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                            : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="input-premium"
                    placeholder="Flat/House No, Building, Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-premium"
                      placeholder="E.g., Bangalore"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="input-premium"
                      placeholder="E.g., 560038"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-accent w-full py-2.5 text-xs font-bold"
                >
                  {saving ? <Spinner size="sm" color="white" /> : 'Save Address'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Addresses;
