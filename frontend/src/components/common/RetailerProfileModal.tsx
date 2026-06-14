import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import api from '../../services/api';
import { X, Star, MapPin, Phone, Mail, Clock, Trash2, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RetailerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailerId: string;
}

interface RetailerDetails {
  _id: string;
  storeName: string;
  storeAddress: string;
  category: string[];
  description?: string;
  rating: number;
  reviewsCount: number;
  openingHours: string;
  closingHours: string;
  storeLogo?: string;
  storeBanner?: string;
  contactPhone?: string;
  contactEmail?: string;
  isVerified: boolean;
}

interface Review {
  _id: string;
  customer: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    [key: number]: number;
  };
}

const RetailerProfileModal: React.FC<RetailerProfileModalProps> = ({ isOpen, onClose, retailerId }) => {
  const { user: currentUser } = useAuth();
  const [retailer, setRetailer] = useState<RetailerDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retailerRes, reviewsRes] = await Promise.all([
        api.get(`/retailers/${retailerId}`),
        api.get(`/reviews/retailer/${retailerId}`),
      ]);
      setRetailer(retailerRes.data);
      setReviews(reviewsRes.data.reviews);
      setStats(reviewsRes.data.stats);
    } catch (err) {
      console.error('Error fetching retailer details/reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && retailerId) {
      fetchData();
    }
  }, [isOpen, retailerId]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeletingId(reviewId);
    try {
      await api.delete(`/reviews/${reviewId}`);
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Failed to delete review', err);
      alert('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-premium-lg overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-600" />
            Store Info & Reviews
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24 flex-1">
            <Spinner size="lg" />
          </div>
        ) : retailer ? (
          <div className="overflow-y-auto flex-1 p-5 space-y-6">
            
            {/* Store Header Banner & Logo */}
            <div className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-850 h-32 border border-slate-200/40 dark:border-slate-800 shrink-0">
              {retailer.storeBanner ? (
                <img src={retailer.storeBanner} alt="Store Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-750 opacity-80" />
              )}

              {/* Logo Overlay */}
              <div className="absolute bottom-3 left-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-md overflow-hidden flex items-center justify-center font-bold text-slate-700 text-lg">
                  {retailer.storeLogo ? (
                    <img src={retailer.storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    retailer.storeName.charAt(0)
                  )}
                </div>
                <div className="text-white drop-shadow-md">
                  <h4 className="font-black text-sm">{retailer.storeName}</h4>
                  <p className="text-[10px] opacity-90 font-medium">{retailer.category?.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Description and metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 dark:border-slate-850 pb-5">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">About Store</span>
                  <p className="text-xs text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">
                    {retailer.description || 'This merchant is a verified supplier on the BrightStore marketplace network, offering express packaging and instant deliveries.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{retailer.storeAddress}</span>
                </div>
              </div>

              {/* Operation details */}
              <div className="bg-slate-50 dark:bg-slate-950/20 p-3.5 border border-slate-100 dark:border-slate-850/80 rounded-xl space-y-2.5 text-xs text-slate-600 dark:text-slate-350">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Hours: <strong className="font-semibold text-slate-750 dark:text-slate-200">{retailer.openingHours} - {retailer.closingHours}</strong></span>
                </div>
                {retailer.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-mono">{retailer.contactPhone}</span>
                  </div>
                )}
                {retailer.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{retailer.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ratings Summary & Breakdowns */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 border-b border-slate-100 dark:border-slate-850 pb-6 items-center">
                {/* Left score box */}
                <div className="sm:col-span-2 text-center border-r border-slate-100 dark:border-slate-850 pr-4 space-y-1">
                  <div className="text-4xl font-black font-mono text-slate-900 dark:text-white">
                    {stats.averageRating}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(stats.averageRating) ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {stats.totalReviews} Total Reviews
                  </span>
                </div>

                {/* Right score bars */}
                <div className="sm:col-span-3 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.breakdown[star] || 0;
                    const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2.5 text-xs text-slate-500">
                        <span className="font-semibold w-3 text-right">{star}</span>
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-7 text-right font-mono text-[10px]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews Comments list */}
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase text-slate-450 dark:text-slate-500 tracking-wider">Customer Feedback Comments</h5>
              
              {reviews.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 italic">No feedback reviews submitted yet for this merchant.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-850 space-y-4">
                  {reviews.map((review) => {
                    const isOwnReview = review.customer._id === currentUser?.id;
                    return (
                      <div key={review._id} className="pt-4 flex items-start justify-between gap-4">
                        <div className="flex gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-350">
                            {review.customer.profilePhoto ? (
                              <img src={review.customer.profilePhoto} alt={review.customer.name} className="w-full h-full object-cover" />
                            ) : (
                              review.customer.name.charAt(0)
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h6 className="font-bold text-xs text-slate-805 dark:text-slate-200 truncate">{review.customer.name}</h6>
                              <span className="text-[9px] text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-0.5 text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-0.5">
                              {review.comment}
                            </p>
                          </div>
                        </div>

                        {isOwnReview && (
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            disabled={deletingId === review._id}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors shrink-0"
                            title="Delete My Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">Merchant profile not found.</div>
        )}
      </div>
    </div>
  );
};

export default RetailerProfileModal;
