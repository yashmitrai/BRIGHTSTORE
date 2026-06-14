import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import { UserPlus, AlertCircle, ShoppingBag, Store } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // States
  const [role, setRole] = useState<'customer' | 'retailer'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Retailer specific states
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [latitude, setLatitude] = useState('12.9716'); // Indiranagar, Bangalore default
  const [longitude, setLongitude] = useState('77.6413');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Set default role from query param if present
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'retailer') {
      setRole('retailer');
    } else {
      setRole('customer');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !phone) {
      setError('Please fill in all general fields');
      return;
    }

    const registrationData: any = {
      name,
      email,
      password,
      phone,
      role,
    };

    if (role === 'retailer') {
      if (!storeName || !storeAddress || !category) {
        setError('Please fill in all store fields');
        return;
      }
      registrationData.storeName = storeName;
      registrationData.storeAddress = storeAddress;
      registrationData.latitude = Number(latitude);
      registrationData.longitude = Number(longitude);
      registrationData.category = category;
      registrationData.description = description;
    }

    setLoading(true);
    try {
      await register(registrationData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
          <span className="w-9 h-9 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg">B</span>
          <span>BrightStore</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 border border-slate-200/80 dark:border-slate-800/80 shadow-premium sm:rounded-xl sm:px-10">
          
          {/* Role Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-lg mb-8">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                role === 'customer'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole('retailer')}
              className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                role === 'retailer'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Retailer Store
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-premium"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-premium"
                placeholder="•••••••• (Min 6 chars)"
              />
            </div>

            {/* Retailer Specific Fields */}
            {role === 'retailer' && (
              <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-slide-up">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Store Information</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    required={role === 'retailer'}
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="input-premium"
                    placeholder="E.g., Sunrise Grocery Shop"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Store Address
                  </label>
                  <input
                    type="text"
                    required={role === 'retailer'}
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="input-premium"
                    placeholder="Full street address, city, state"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      required={role === 'retailer'}
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="input-premium text-mono"
                      placeholder="12.9716"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      required={role === 'retailer'}
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="input-premium text-mono"
                      placeholder="77.6413"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Store Categories
                  </label>
                  <input
                    type="text"
                    required={role === 'retailer'}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-premium"
                    placeholder="E.g., Groceries, Dairy, Beverages (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Store Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="input-premium"
                    placeholder="Tell customer what products you carry..."
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
