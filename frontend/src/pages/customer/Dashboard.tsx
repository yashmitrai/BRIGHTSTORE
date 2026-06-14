import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { Search, ShoppingCart, ShoppingBag, Plus, Minus, ArrowRight, Check, MapPin, Sparkles, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import RetailerProfileModal from '../../components/common/RetailerProfileModal';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  images?: string[];
  stock: number;
  retailer?: {
    _id: string;
    storeName: string;
    rating: number;
    storeAddress?: string;
    location?: {
      coordinates: [number, number];
    };
    description?: string;
    openingHours?: string;
    closingHours?: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Address and Distance states
  const [defaultAddress, setDefaultAddress] = useState<any | null>(null);

  // Modal states
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileRetailerId, setProfileRetailerId] = useState('');

  // Fetch customer default address
  const fetchDefaultAddress = async () => {
    try {
      const response = await api.get('/addresses');
      const def = response.data.find((a: any) => a.isDefault);
      if (def) {
        setDefaultAddress(def);
      } else if (response.data.length > 0) {
        setDefaultAddress(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching customer address', err);
    }
  };

  const getDistanceToRetailer = (product: Product) => {
    if (!defaultAddress || !product.retailer?.location?.coordinates) return null;
    const [retLng, retLat] = product.retailer.location.coordinates;
    const custLat = defaultAddress.latitude;
    const custLng = defaultAddress.longitude;

    const R = 6371; // km
    const dLat = (retLat - custLat) * Math.PI / 180;
    const dLon = (retLng - custLng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(custLat * Math.PI / 180) * Math.cos(retLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Load cart from session/local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('brightstore_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart', e);
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('brightstore_cart', JSON.stringify(newCart));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      
      // Extract unique categories
      const cats: string[] = ['All'];
      response.data.forEach((p: Product) => {
        if (p.category && !cats.includes(p.category)) {
          cats.push(p.category);
        }
      });
      setCategories(cats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDefaultAddress();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart Handlers
  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product._id === product._id);
    const newCart = [...cart];
    
    if (existingIndex > -1) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({ product, quantity: 1 });
    }
    
    saveCart(newCart);
    setCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const existingIndex = cart.findIndex((item) => item.product._id === productId);
    if (existingIndex === -1) return;

    const newCart = [...cart];
    newCart[existingIndex].quantity += delta;

    if (newCart[existingIndex].quantity <= 0) {
      newCart.splice(existingIndex, 1);
    }

    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
    setCartOpen(false);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    navigate('/order-request');
  };

  return (
    <Layout>
      <div className="relative">
        {/* Banner Hero */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-premium">
          <div className="relative z-10 max-w-lg">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-600 mb-4 inline-block">
              BrightStore Direct
            </span>
            <h2 className="text-xl md:text-3xl font-bold font-sans tracking-tight mb-2">
              Send your list. Receive bids.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Skip warehouse surcharges. Let nearby local stores bid to fulfill your order request lists directly.
            </p>
            <button
              onClick={() => navigate('/order-request')}
              className="px-4 py-2 bg-white text-slate-950 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 active:scale-95"
            >
              Request Custom Order List <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden md:flex items-center justify-center opacity-10">
            <ShoppingBag className="w-48 h-48" />
          </div>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8 sticky top-16 bg-slate-50/85 dark:bg-slate-950/85 py-3 backdrop-blur z-20">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search local products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium pl-9 py-1.5"
            />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-slate-400 font-medium animate-pulse">Scanning local store shelves...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-sm text-red-500">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-premium">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-350">No products found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Try altering your query or create a custom list request to ask local merchants directly.</p>
            <button
              onClick={() => navigate('/order-request')}
              className="btn-primary text-xs mt-4 mx-auto"
            >
              Request Custom Order
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.product._id === product._id);
              return (
                <div key={product._id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-premium hover:shadow-premium-md transition-all group flex flex-col justify-between">
                  <div>
                    <div
                      onClick={() => {
                        setDetailsProduct(product);
                        setActiveImageIdx(0);
                      }}
                      className="h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden relative cursor-pointer"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-350">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-white dark:bg-white/90 dark:text-slate-900 text-[10px] font-bold uppercase">
                        {product.category}
                      </span>
                    </div>

                    <div className="p-4">
                      {product.retailer && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileRetailerId(product.retailer!._id);
                            setProfileModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1 hover:underline hover:text-blue-500 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>{product.retailer.storeName}</span>
                          {getDistanceToRetailer(product) && (
                            <span className="text-slate-400 font-normal">({getDistanceToRetailer(product)} km)</span>
                          )}
                        </div>
                      )}
                      <h3
                        onClick={() => {
                          setDetailsProduct(product);
                          setActiveImageIdx(0);
                        }}
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-blue-500"
                      >
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 min-h-8 leading-relaxed">{product.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-50 dark:border-slate-850 mt-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">₹{product.price}</span>
                    
                    {cartItem ? (
                      <div className="flex items-center gap-2.5 bg-blue-600 text-white px-2 py-1 rounded-lg shadow-sm">
                        <button
                          onClick={() => updateQuantity(product._id, -1)}
                          className="hover:text-blue-200 transition-colors p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold font-mono">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product._id, 1)}
                          className="hover:text-blue-200 transition-colors p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-950 dark:hover:border-slate-200 text-slate-700 dark:text-slate-250 hover:text-slate-950 dark:hover:text-white transition-all active:scale-95 flex items-center gap-1 text-[11px]"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Cart Button */}
        {getCartItemsCount() > 0 && !cartOpen && (
          <button
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-full shadow-premium-lg flex items-center gap-2 font-semibold text-xs transition-all animate-bounce"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            <span>View Cart ({getCartItemsCount()})</span>
            <span className="font-mono bg-blue-700 px-2 py-0.5 rounded-full">₹{getCartTotal()}</span>
          </button>
        )}

        {/* Shopping Cart Slider Drawer */}
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 shadow-premium-lg">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span>Your Shopping Cart</span>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100 dark:divide-slate-800">
                {cart.map((item) => (
                  <div key={item.product._id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        {item.product.imageUrl && (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-850 dark:text-slate-200 truncate">{item.product.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">₹{item.product.price} each</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5 bg-slate-50 dark:bg-slate-900">
                        <button onClick={() => updateQuantity(item.product._id, -1)} className="text-slate-500 hover:text-slate-900"><Minus className="w-3 h-3" /></button>
                        <span className="text-[11px] font-bold font-mono">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product._id, 1)} className="text-slate-500 hover:text-slate-900"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-xs font-bold min-w-[50px] text-right font-mono">₹{item.product.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-55/40 dark:bg-slate-900/50">
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-slate-500">Cart subtotal:</span>
                  <span className="font-bold text-sm font-mono">₹{getCartTotal()}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearCart}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="btn-accent flex-1 text-xs py-2.5 font-bold"
                  >
                    Checkout Request <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {detailsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium-lg overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Product Details</h3>
              <button
                onClick={() => setDetailsProduct(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              {/* Images view */}
              <div className="relative h-64 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 flex items-center justify-center">
                {detailsProduct.images && detailsProduct.images.length > 0 ? (
                  <>
                    <img
                      src={detailsProduct.images[activeImageIdx]}
                      alt={detailsProduct.name}
                      className="w-full h-full object-cover"
                    />
                    {detailsProduct.images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : detailsProduct.images!.length - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-slate-950/80 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx((prev) => (prev < detailsProduct.images!.length - 1 ? prev + 1 : 0))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-slate-950/80 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : detailsProduct.imageUrl ? (
                  <img src={detailsProduct.imageUrl} alt={detailsProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-slate-350" />
                )}

                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-white text-[10px] font-bold uppercase tracking-wider">
                  {detailsProduct.category}
                </span>
              </div>

              {/* Thumbnails if multiple */}
              {detailsProduct.images && detailsProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                  {detailsProduct.images.map((img, idx) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-12 h-12 rounded-lg border overflow-hidden shrink-0 transition-all ${
                        idx === activeImageIdx
                          ? 'border-blue-500 ring-2 ring-blue-500/25'
                          : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Details info */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline gap-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {detailsProduct.name}
                  </h4>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white shrink-0">
                    ₹{detailsProduct.price}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {detailsProduct.description || 'No description provided.'}
                </p>
              </div>

              {/* Retailer Card info */}
              {detailsProduct.retailer && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-3">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Sold By Merchant</span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5
                        onClick={() => {
                          setDetailsProduct(null);
                          setProfileRetailerId(detailsProduct.retailer!._id);
                          setProfileModalOpen(true);
                        }}
                        className="font-bold text-xs text-slate-800 dark:text-slate-200 hover:underline hover:text-blue-500 cursor-pointer"
                      >
                        {detailsProduct.retailer.storeName}
                      </h5>
                      <p className="text-[10px] text-slate-455 mt-0.5 leading-relaxed">
                        {detailsProduct.retailer.storeAddress || 'Local neighborhood retailer'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200/40">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{detailsProduct.retailer.rating}</span>
                      </div>
                      {getDistanceToRetailer(detailsProduct) && (
                        <span className="text-[9px] font-semibold text-slate-455">
                          {getDistanceToRetailer(detailsProduct)} km away
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex gap-3 shrink-0">
              <button
                onClick={() => setDetailsProduct(null)}
                className="btn-secondary text-xs flex-1"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addToCart(detailsProduct);
                  setDetailsProduct(null);
                }}
                className="btn-accent text-xs flex-1 font-bold shadow-sm"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retailer Profile Modal */}
      <RetailerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        retailerId={profileRetailerId}
      />
    </Layout>
  );
};

export default CustomerDashboard;
