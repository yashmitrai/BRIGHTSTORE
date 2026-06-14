import React, { useState } from 'react';
import Spinner from './Spinner';
import api from '../../services/api';
import { X, Star, MessageSquare } from 'lucide-react';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  retailerId: string;
  retailerName: string;
  onSuccess: () => void;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  retailerId,
  retailerName,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStarLabel = (r: number) => {
    switch (r) {
      case 1: return '1 - Poor';
      case 2: return '2 - Fair';
      case 3: return '3 - Good';
      case 4: return '4 - Very Good';
      case 5: return '5 - Excellent!';
      default: return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post('/reviews', {
        retailerId,
        rating,
        comment,
      });
      onSuccess();
      onClose();
      setComment('');
      setRating(5);
    } catch (err: any) {
      console.error('Failed to submit review', err);
      setError(err.response?.data?.message || 'Failed to submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-premium-lg overflow-hidden animate-slide-up">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Review {retailerName}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="px-5 pt-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-250 text-xs text-red-650 rounded-lg">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Star selector */}
          <div className="text-center space-y-2">
            <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
              Tap stars to rate
            </label>
            
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const fill = hoverRating !== null ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 hover:scale-110 active:scale-95 transition-all text-slate-200"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        fill ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-800'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-bold text-slate-650 dark:text-slate-350 min-h-[16px] transition-all">
              {getStarLabel(hoverRating || rating)}
            </div>
          </div>

          {/* Comment text box */}
          <div>
            <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
              Review Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="input-premium text-xs"
              placeholder="Share your experience about packaging, speed, quality of substitutes or merchant courtesy..."
            />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-accent flex-1 text-xs font-bold"
            >
              {submitting ? <Spinner size="sm" color="white" /> : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
