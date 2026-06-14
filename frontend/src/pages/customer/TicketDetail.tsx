import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layouts/Layout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, Send, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Clock, User } from 'lucide-react';

interface Reply {
  _id: string;
  sender: {
    _id: string;
    name: string;
    role: 'customer' | 'retailer' | 'admin';
  };
  message: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  category: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  replies: Reply[];
  createdAt: string;
}

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reply inputs
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket details', error);
      alert('Failed to load support ticket');
      navigate(currentUser?.role === 'admin' ? '/admin/tickets' : '/support');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;

    setSendingReply(true);
    try {
      const response = await api.post(`/tickets/${ticket._id}/reply`, { message: replyText });
      setTicket(response.data);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send reply', err);
      alert('Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Ticket['status']) => {
    if (!ticket) return;
    setStatusUpdating(true);
    try {
      const response = await api.put(`/tickets/${ticket._id}/status`, { status: newStatus });
      setTicket({ ...ticket, status: response.data.status });
    } catch (err) {
      console.error('Failed to update ticket status', err);
      alert('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-40">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center py-20 text-slate-400">Ticket not found.</div>
      </Layout>
    );
  }

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'Resolved':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50';
      case 'Closed':
        return 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200/50';
      case 'In Progress':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50';
      default:
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] animate-fade-in">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4 shrink-0">
          <button
            onClick={() => navigate(currentUser?.role === 'admin' ? '/admin/tickets' : '/support')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Support tickets
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">ID: #{ticket._id}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
        </div>

        {/* Ticket Information Panel */}
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-xl shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-850 text-[10px] font-bold text-slate-600 dark:text-slate-350">
                {ticket.category}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Filed by <span className="font-bold text-slate-700 dark:text-slate-300">{ticket.user.name}</span> ({ticket.user.email}) on {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Set Status:</span>
                <select
                  disabled={statusUpdating}
                  value={ticket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            )}
          </div>
          <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/80 rounded-lg text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            {ticket.description}
          </div>
        </div>

        {/* Chat Thread Messages */}
        <div className="flex-1 overflow-y-auto my-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-4">
          <div className="text-center py-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Conversation Start</span>
          </div>

          {ticket.replies.map((reply) => {
            const isMe = reply.sender._id === currentUser?.id;
            const isAdmin = reply.sender.role === 'admin';
            return (
              <div
                key={reply._id}
                className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-650 dark:text-slate-400">
                    {reply.sender.name}
                  </span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[8px] font-black uppercase">
                      Admin Staff
                    </span>
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-tr-none shadow-sm'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-200 rounded-tl-none border border-slate-200/30 dark:border-slate-800'
                  }`}
                >
                  {reply.message}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Reply Action Box */}
        {ticket.status === 'Closed' ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-500 font-semibold shrink-0">
            This ticket is Closed. Administrative reviews are archived. Raise a new support ticket if you have other questions.
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="flex gap-3 shrink-0">
            <input
              type="text"
              required
              disabled={sendingReply}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your message here to reply to staff..."
              className="input-premium flex-1"
            />
            <button
              type="submit"
              disabled={sendingReply || !replyText.trim()}
              className="btn-accent px-4 flex items-center justify-center shrink-0 shadow-sm"
            >
              {sendingReply ? <Spinner size="sm" color="white" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default TicketDetail;
