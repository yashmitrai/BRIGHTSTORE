import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { MessageSquare, CheckCircle, Clock, AlertCircle, HelpCircle, ChevronRight, Inbox } from 'lucide-react';

interface UserInfo {
  _id: string;
  name: string;
  email: string;
}

interface Ticket {
  _id: string;
  user: UserInfo;
  category: 'Order Issue' | 'Delivery Issue' | 'Payment Issue' | 'Product Issue' | 'Other';
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

const AdminTickets: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (err) {
      console.error('Error fetching admin tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Closed':
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <HelpCircle className="w-4 h-4 text-amber-500" />;
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesSearch =
      ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket._id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">
              Support Case Manager
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Admin panel for auditing user disputes, order substitutions, and payment delivery queries.
            </p>
          </div>
          
          <div className="flex gap-2">
            {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === status
                    ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search by username, email, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium py-2 pl-4 pr-10 text-xs w-full"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium">
            <Inbox className="w-10 h-10 mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-sm text-slate-705 dark:text-slate-350">No tickets matching criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              All support issues are resolved and closed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/support/ticket/${ticket._id}`)}
                className="card-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-premium-md transition-all cursor-pointer group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/60">
                      {ticket.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      User: {ticket.user.name} ({ticket.user.email})
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
      </div>
    </Layout>
  );
};

export default AdminTickets;
