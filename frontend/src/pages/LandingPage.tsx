import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Zap, Truck, ShoppingCart, ArrowRight, Star, Heart } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [zipcode, setZipcode] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate(`/register?role=customer&zip=${zipcode}`);
    }
  };

  const nearbyStoresMock = [
    { name: 'QuickMart Local Express', distance: '0.4 km', rating: 4.8, category: 'Groceries, Fresh Produce', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' },
    { name: 'Sunrise Daily Needs', distance: '1.2 km', rating: 4.2, category: 'Dairy, Bakery, Snacks', image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600' },
    { name: 'Aone Supermarket', distance: '1.8 km', rating: 4.6, category: 'Household, Beverages', image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=600' }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 font-sans">
            <span className="w-8 h-8 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg">B</span>
            <span>BrightStore</span>
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <Link
                to={user.role === 'retailer' ? '/retailer/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="btn-primary text-xs"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs px-3.5 py-1.5">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-350 mb-6">
            <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> Support your neighborhood retailers
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold font-sans tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.1] mb-6">
            Get dark store speeds from <span className="underline decoration-blue-500 decoration-wavy underline-offset-4">your local retailers</span>.
          </h1>
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            BrightStore connects you with nearby stores instantly. Send your shopping list, compare offers on price & time, and support local community shops.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-premium mb-12">
            <input
              type="text"
              placeholder="Enter your Delivery Postal Code"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              className="flex-1 bg-transparent border-0 ring-0 outline-none px-3 text-sm focus:ring-0 placeholder-slate-400 text-slate-900 dark:text-white"
              required
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm">
              Find Stores <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto border-t border-slate-200 dark:border-slate-800 pt-8 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">100+</p>
              <p className="text-xs text-slate-400">Local Retailers</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">15 min</p>
              <p className="text-xs text-slate-400">Avg Delivery Time</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">₹0</p>
              <p className="text-xs text-slate-400">Platform Markup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Stores Section */}
      <section className="py-16 border-t border-slate-250/50 dark:border-slate-900/50 bg-white/50 dark:bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-sans text-slate-950 dark:text-white">Stores Delivering Near You</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Verified partners providing instant shipping on groceries, organic items, and household goods.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {nearbyStoresMock.map((store, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden shadow-premium hover:shadow-premium-md transition-all group">
                <div className="h-44 overflow-hidden relative">
                  <img src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {store.rating}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-sm text-slate-950 dark:text-white">{store.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{store.category}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{store.distance} away</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Order Now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Why BrightStore?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">We bypass dark store warehouse hubs and buy straight from local grocery partners.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="card-premium">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-950 dark:text-white mb-2">Shopping List Request</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create and post your grocery request list containing customized items, photos, and volume counts in seconds.
            </p>
          </div>

          <div className="card-premium">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-950 dark:text-white mb-2">Bidding & Offers</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Get price bids and delivery estimates from multiple verified local stores. Select the offer that fits you best.
            </p>
          </div>

          <div className="card-premium">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-950 dark:text-white mb-2">Live Order Tracking</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track the dispatch state of your delivery in real-time as local store personnel pack and deliver your parcel.
            </p>
          </div>

          <div className="card-premium">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-950 dark:text-white mb-2">Empowering Local Stores</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Keep small stores thriving. 100% of the transactions go straight into your neighborhood retailer's account.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-950 dark:bg-slate-900 py-16 text-white text-center border-t border-slate-900 relative">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Are you a Retailer?</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8">
            Empower your store, receive customer order lists, offer custom quotes, manage your inventory, and compete with dark warehouses.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register?role=retailer" className="px-5 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm">
              Register as Store <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register?role=customer" className="px-5 py-2.5 bg-slate-800 text-white hover:bg-slate-750 border border-slate-700 rounded-lg font-semibold text-xs transition-colors">
              Sign Up as Customer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
