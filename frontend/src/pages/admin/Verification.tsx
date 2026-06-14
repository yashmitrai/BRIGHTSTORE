import React, { useState, useEffect } from 'react';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { Award, CheckCircle, XCircle, Star, ShieldAlert, MapPin, Tag, User } from 'lucide-react';

interface Retailer {
  _id: string;
  storeName: string;
  storeAddress: string;
  category: string[];
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  owner: {
    name: string;
    email: string;
    phone?: string;
  };
}

const Verification: React.FC = () => {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRetailers = async () => {
    try {
      const response = await api.get('/admin/retailers');
      setRetailers(response.data);
    } catch (error) {
      console.error('Error fetching retailers list', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const handleVerifyToggle = async (retailerId: string, currentStatus: boolean) => {
    setActionId(retailerId);
    try {
      await api.post(`/admin/retailers/${retailerId}/verify`, { isVerified: !currentStatus });
      
      // Update local state
      setRetailers(
        retailers.map((r) => (r._id === retailerId ? { ...r, isVerified: !currentStatus } : r))
      );
    } catch (error) {
      console.error('Failed to change verification state', error);
      alert('Action failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
            Verify Retailer Profiles
          </h2>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Verification Queue
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : retailers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-sm text-slate-705 dark:text-slate-350">No store profiles found</h3>
            <p className="text-xs text-slate-400 mt-1">There are no registered retailer profiles in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {retailers.map((r) => (
              <div key={r._id} className="card-premium space-y-4 flex flex-col justify-between hover:shadow-premium-md relative">
                <div>
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{r.storeName}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {r._id}</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      r.isVerified
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {r.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  {/* Owner specs */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-lg space-y-2 mb-4">
                    <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Owner Account</span>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <p className="font-bold">{r.owner?.name || 'Missing Name'}</p>
                      <p className="font-mono text-[10px] text-slate-450 mt-0.5">{r.owner?.email}</p>
                      {r.owner?.phone && <p className="mt-1 text-slate-500 font-medium">Phone: {r.owner.phone}</p>}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                      <span>{r.storeAddress}</span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                      <Tag className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {r.category.map((cat, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-semibold text-slate-500 dark:text-slate-300 rounded border border-slate-150 dark:border-slate-750">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4 mt-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{r.rating} ({r.reviewsCount} reviews)</span>
                  </div>

                  <button
                    onClick={() => handleVerifyToggle(r._id, r.isVerified)}
                    disabled={actionId === r._id}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 ${
                      r.isVerified
                        ? 'bg-red-50 text-red-650 hover:bg-red-100 border border-red-200/50'
                        : 'bg-emerald-650 text-white hover:bg-emerald-550'
                    }`}
                  >
                    {actionId === r._id ? (
                      <Spinner size="sm" color={r.isVerified ? 'brand' : 'white'} />
                    ) : r.isVerified ? (
                      <>
                        <XCircle className="w-4 h-4" /> Revoke Verification
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Verify Store
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Verification;
