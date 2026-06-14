import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { MessageSquare, Plus, CheckCircle, Clock, AlertCircle, HelpCircle, ArrowRight, ShieldQuestion } from 'lucide-react';

interface Ticket {
  _id: string;
  category: 'Order Issue' | 'Delivery Issue' | 'Payment Issue' | 'Product Issue' | 'Other';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

const SupportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create ticket states
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<'Order Issue' | 'Delivery Issue' | 'Payment Issue' | 'Product Issue' | 'Other'>('Order Issue');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets/my');
      setTickets(response.data);
    } catch (err) {
      console.error('Error fetching tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe your issue in detail.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/tickets', { category, description });
      setTickets([response.data, ...tickets]);
      setFormOpen(false);
      setDescription('');
      // Redirect to the detail page of the new ticket
      navigate(`/support/ticket/${response.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Closed':
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <ShieldQuestion className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadgeClass = (status: Ticket['status']) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-350 border-emerald-200/40';
      case 'Closed':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/40';
      case 'In Progress':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-350 border-blue-200/40';
      default:
        return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-350 border-amber-200/40';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
              Customer Support Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Have issues with your delivery bids or order items? Raise a ticket and get help.
            </p>
          </div>
          
          <button
            onClick={() => setFormOpen(true)}
            className="btn-primary text-xs shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Raise a Ticket
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium">
            <HelpCircle className="w-10 h-10 mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No support tickets found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              You haven't filed any support cases yet. If you need support with a retailer bid, click "Raise a Ticket" above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/support/ticket/${ticket._id}`)}
                className="card-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-premium-md transition-all cursor-pointer group"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/60">
                      {ticket.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: #{ticket._id.substring(18)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {ticket.description}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Created on {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    <span>{ticket.status}</span>
                  </span>
                  
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Raise Ticket Modal */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl shadow-premium-lg overflow-hidden animate-slide-up">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-850 dark:text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Raise Support Case
                </h3>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg"
                >
                  &times;
                </button>
              </div>

              {error && (
                <div className="px-5 pt-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-250 text-xs text-red-650 rounded-lg">
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Issue Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="input-premium"
                  >
                    <option value="Order Issue">Order Issue</option>
                    <option value="Delivery Issue">Delivery Issue</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Product Issue">Product Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Describe your issue
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="input-premium"
                    placeholder="Tell us what went wrong. Include details like product names, prices, or store issues..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-accent flex-1 text-xs font-bold"
                  >
                    {submitting ? <Spinner size="sm" color="white" /> : 'Submit Case'}
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

export default SupportDashboard;
