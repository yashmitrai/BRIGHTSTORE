import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { MapPin, Plus, Trash2, Edit2, Home, Briefcase, Map, Check, Star } from 'lucide-react';
import GoogleMapPicker from '../../components/common/GoogleMapPicker';

interface Address {
  _id: string;
  tag: string;
  houseNumber: string;
  street: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  latitude: number;
  longitude: number;
}

const Addresses: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tag, setTag] = useState('Home');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [formOpen, setFormOpen] = useState(false);

  const handleMapChange = (lat: number, lng: number, details?: any) => {
    setLatitude(lat);
    setLongitude(lng);
    if (details) {
      if (details.street) setStreet(details.street);
      if (details.area) setArea(details.area);
      if (details.city) setCity(details.city);
      if (details.state) setState(details.state);
      if (details.pincode) setPincode(details.pincode);
    }
  };

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

  const openAddForm = () => {
    setEditingId(null);
    setTag('Home');
    setHouseNumber('');
    setStreet('');
    setArea('');
    setLandmark('');
    setCity('');
    setState('');
    setPincode('');
    setIsDefault(false);
    setLatitude(12.9716);
    setLongitude(77.5946);
    setFormOpen(true);
    setError(null);
  };

  const openEditForm = (addr: Address) => {
    setEditingId(addr._id);
    setTag(addr.tag);
    setHouseNumber(addr.houseNumber);
    setStreet(addr.street);
    setArea(addr.area);
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setIsDefault(addr.isDefault);
    setLatitude(addr.latitude);
    setLongitude(addr.longitude);
    setFormOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNumber || !street || !area || !city || !state || !pincode) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      tag,
      houseNumber,
      street,
      area,
      landmark,
      city,
      state,
      pincode,
      isDefault,
      latitude,
      longitude,
    };

    try {
      if (editingId) {
        // Edit mode
        const response = await api.put(`/addresses/${editingId}`, payload);
        // Map addresses to update the edited one and handle isDefault reset
        const updated = addresses.map((addr) => {
          if (addr._id === editingId) {
            return response.data;
          }
          if (payload.isDefault) {
            return { ...addr, isDefault: false };
          }
          return addr;
        });
        setAddresses(updated.sort((a, b) => (b._id === editingId && payload.isDefault ? 1 : 0) - (a._id === editingId && payload.isDefault ? 1 : 0)));
      } else {
        // Create mode
        const response = await api.post('/addresses', payload);
        const newAddress = response.data;
        if (newAddress.isDefault) {
          setAddresses([newAddress, ...addresses.map((a) => ({ ...a, isDefault: false }))]);
        } else {
          setAddresses([...addresses, newAddress]);
        }
      }
      setFormOpen(false);
      fetchAddresses(); // Re-fetch to guarantee sorting order
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses(addresses.filter((addr) => addr._id !== id));
      fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await api.put(`/addresses/${id}/default`);
      setAddresses(
        addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === id,
        })).sort((a, b) => (b._id === id ? 1 : 0) - (a._id === id ? 1 : 0))
      );
    } catch (err) {
      console.error('Failed to set default address', err);
    }
  };

  const getAddressIcon = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'home':
        return <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Map className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">
            Saved Delivery Addresses
          </h2>
          {!formOpen && (
            <button
              onClick={openAddForm}
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
                <p className="text-xs text-slate-455">No saved addresses found. Add one to set up deliveries.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`card-premium flex flex-col justify-between hover:shadow-premium-md relative ${
                      addr.isDefault ? 'border-blue-500/50 dark:border-blue-500/55' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                          {getAddressIcon(addr.tag)}
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider">
                            {addr.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditForm(addr)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors"
                            title="Edit Address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1">
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                          {addr.houseNumber}, {addr.street}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {addr.area}
                        </p>
                        {addr.landmark && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            Landmark: {addr.landmark}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                      {addr.isDefault ? (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Default Address
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(addr._id)}
                          className="text-[10px] font-bold text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" /> Set Default
                        </button>
                      )}
                      <span className="font-mono text-[9px] text-slate-400">
                        {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                      </span>
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
                  {editingId ? 'Edit Address' : 'New Address'}
                </h3>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-xs font-bold text-slate-455 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    House/Flat Number
                  </label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="input-premium"
                    placeholder="G-12, Green Apartments"
                  />
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
                    placeholder="E.g., 2nd Main Road"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Area/Locality
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="input-premium"
                    placeholder="E.g., Indiranagar"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="input-premium"
                    placeholder="E.g., Near Metro Station"
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
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input-premium"
                      placeholder="E.g., Karnataka"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="input-premium"
                      placeholder="560038"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:border-blue-500 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Default Address</span>
                    </label>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Map Location Picker
                  </label>
                  <GoogleMapPicker
                    latitude={latitude}
                    longitude={longitude}
                    onChange={handleMapChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="input-premium py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="input-premium py-1 text-xs"
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
