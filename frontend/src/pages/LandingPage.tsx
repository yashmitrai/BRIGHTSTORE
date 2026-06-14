import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Zap, Truck, ShoppingCart, ArrowRight, Star, Heart, ChevronDown, HelpCircle, Store, Award } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [zipcode, setZipcode] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

  const faqs = [
    {
      q: "How does BrightStore help local retailers?",
      a: "BrightStore provides small neighborhood shops with a direct software connection to local customers. Instead of users buying from dark warehouses, they submit their shopping list, and local merchants submit direct bids to fulfill the delivery in minutes."
    },
    {
      q: "What are dark stores, and why compete?",
      a: "Dark stores are closed-door warehouse hubs run by conglomerates that charge high markups and shut down traditional retail. BrightStore democratizes instant commerce for small store owners, keeping local money within the local community."
    },
    {
      q: "Are there any service charges or commissions?",
      a: "No. BrightStore does not charge high platform markups on products. Bids are transparent, and all checkout revenue goes directly to your selected neighborhood partner."
    },
    {
      q: "How fast is the delivery?",
      a: "Because stores are already in your local community (often within 1-2 kilometers), deliveries typically arrive in 15 to 30 minutes, delivered by the store's own delivery staff."
    }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans antialiased selection:bg-blue-500 selection:text-white transition-colors duration-300">
      {/* Header Nav */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-extrabold text-lg">B</span>
            <span>BrightStore</span>
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <Link
                to={user.role === 'retailer' ? '/retailer/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="btn-primary text-xs flex items-center gap-1"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs px-3.5 py-1.5 shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Ambient Gradient Background Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 dark:from-blue-950/20 dark:to-purple-950/20 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 mb-6 animate-fade-in shadow-sm">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> Support your neighborhood retailers
          </span>
          <h1 className="text-4xl sm:text-6xl font-black font-sans tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.1] mb-6">
            Get dark store speeds from <span className="underline decoration-blue-600 decoration-wavy underline-offset-4">your local retailers</span>.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            BrightStore connects you with nearby stores instantly. Send your shopping list, compare offers on price & time, and support local community shops.
          </p>

          {/* Location Code Finder Form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-premium-lg mb-12 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <input
              type="text"
              placeholder="Enter Delivery Postal Code"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value)}
              className="flex-1 bg-transparent border-0 ring-0 outline-none px-3 text-xs focus:ring-0 placeholder-slate-400 text-slate-900 dark:text-white"
              required
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm active:scale-95">
              Find Stores <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto border-t border-slate-200 dark:border-slate-800 pt-8 text-center font-sans">
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono">100+</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Local Retailers</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono">15 min</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Delivery</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono">₹0</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Platform Fee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Stores Display */}
      <section className="py-20 border-t border-slate-200/50 dark:border-slate-900 bg-white/50 dark:bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">Delivering Near You</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Verified neighborhood partners providing instant shipping on fresh produce, groceries, and medical supplies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {nearbyStoresMock.map((store, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl overflow-hidden shadow-premium hover:shadow-premium-md transition-all group flex flex-col justify-between">
                <div className="h-44 overflow-hidden relative">
                  <img src={store.image} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-slate-950/80 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {store.rating}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-950 dark:text-white leading-tight">{store.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">{store.category}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{store.distance} away</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Explore Store <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Highlight Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">Why BrightStore?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Traditional store partnerships, modernized delivery logistics, transparent customer billing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="card-premium space-y-4">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white">Request Lists</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Create and post your customized shopping lists containing exact item names, notes, and photos in seconds.
            </p>
          </div>

          <div className="card-premium space-y-4">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white">Merchant Bidding</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Compare direct offers, price quotes, delivery speed, and substitutes from multiple neighborhood stores.
            </p>
          </div>

          <div className="card-premium space-y-4">
            <div className="w-9 h-9 bg-purple-100 dark:bg-purple-950/40 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white">Express Delivery</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Real-time packing and live dispatch tracking as the local store personnel bring orders straight to your doorstep.
            </p>
          </div>

          <div className="card-premium space-y-4">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950/40 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white">Local Empowerment</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Boost your local community ecosystem. Zero heavy corporate markups, 100% of order value goes directly to merchants.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions FAQ */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-850">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Clear answers about how we compare against dark stores and corporate grocery apps.</p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => {
              const active = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950/30 transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(active ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left font-semibold text-slate-850 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <span className="text-xs sm:text-sm flex items-center gap-2">
                      <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${active ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      active ? 'max-h-40 border-t border-slate-200/50 dark:border-slate-850/80 p-4' : 'max-h-0'
                    }`}
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call To Action Retailer/Customer Portal */}
      <section className="bg-slate-950 dark:bg-slate-900 py-20 text-white text-center border-t border-slate-900 relative">
        <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-8">
          <h2 className="text-3xl font-black tracking-tight font-sans">Are you a Retailer Store owner?</h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed font-medium">
            Empower your store, receive customer order lists, offer custom price quotes, manage your catalog, and compete directly with automated warehouse networks.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register?role=retailer" className="px-5 py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm active:scale-95">
              <Store className="w-4 h-4 text-blue-600" /> Register as Retailer Store
            </Link>
            <Link to="/register?role=customer" className="px-5 py-3 bg-slate-800 text-white hover:bg-slate-750 border border-slate-700 rounded-xl font-bold text-xs transition-colors active:scale-95">
              Sign Up as Customer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
