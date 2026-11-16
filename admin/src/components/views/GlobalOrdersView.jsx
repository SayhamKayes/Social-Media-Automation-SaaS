import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone,
  Trash2,
  Crown,
  Facebook,
  Instagram,
  MessageCircle
} from 'lucide-react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

const PLAN_DETAILS = {
  free: { name: 'Free Trial (1 Month)', amount: 0, status: 'Free Trial Active' },
  starter: { name: 'Starter Growth Plan', amount: 1499, status: 'Confirmed' },
  business: { name: 'Business Pro Plan', amount: 3999, status: 'Confirmed' },
  agency: { name: 'Agency Enterprise Plan', amount: 9999, status: 'Confirmed' }
};

export default function GlobalOrdersView({ orders = [], users = [], pages = [], onDeleteOrder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); /* 'all' | 'signups' | 'chatbot' */
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getPageName = (pageId) => {
    if (!pageId) return 'SaaS Platform Signup';
    const found = pages.find(p => p.page_id === pageId);
    return found ? found.page_name : pageId;
  };

  /* Build unified list combining orders + any registered user (including Free Trial) not yet in orders */
  const existingSignupUserIds = new Set(
    orders
      .filter(o => {
        const oid = String(o.order_id || '').toUpperCase();
        return oid.startsWith('SIGNUP-') || oid.startsWith('SUB-') || !o.page_id;
      })
      .map(o => o.user_id)
      .filter(Boolean)
  );

  const synthesizedUserEntries = users
    .filter(u => !existingSignupUserIds.has(u.id))
    .map(u => {
      const tierKey = String(u.plan_tier || 'free').toLowerCase();
      const planInfo = PLAN_DETAILS[tierKey] || PLAN_DETAILS.free;
      const shortId = String(u.id || '0000').slice(0, 6).toUpperCase();
      return {
        id: `user_signup_${u.id}`,
        isSynthesizedUser: true,
        user_id: u.id,
        order_id: `SIGNUP-${tierKey.toUpperCase()}-${shortId}`,
        customer_name: u.full_name || (u.email ? u.email.split('@')[0] : 'Registered User'),
        phone_number: u.email || 'No email',
        email: u.email,
        page_id: null,
        selected_package: planInfo.name,
        total_amount_bdt: planInfo.amount,
        order_status: u.status === 'suspended' ? 'Suspended' : planInfo.status,
        record_source: 'signup',
        created_at: u.created_at || new Date().toISOString()
      };
    });

  const normalizedOrders = orders.map(o => {
    const oid = String(o.order_id || '').toUpperCase();
    const isSignupOrSub = oid.startsWith('SIGNUP-') || oid.startsWith('SUB-') || !o.page_id;
    return {
      ...o,
      record_source: isSignupOrSub ? 'signup' : 'chatbot'
    };
  });

  const combinedRecords = [...normalizedOrders, ...synthesizedUserEntries].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const totalBDT = combinedRecords.reduce((sum, o) => sum + (Number(o.total_amount_bdt) || 0), 0);
  const signupCount = combinedRecords.filter(r => r.record_source === 'signup').length;
  const chatbotCount = combinedRecords.filter(r => r.record_source === 'chatbot').length;

  const filteredRecords = combinedRecords.filter((o) => {
    const matchesSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'signups' && o.record_source === 'signup') ||
      (sourceFilter === 'chatbot' && o.record_source === 'chatbot');

    const matchesSearch = 
      (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.phone_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.selected_package || '').toLowerCase().includes(searchQuery.toLowerCase());

    const statusLower = (o.order_status || 'Confirmed').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'free_trial' && statusLower.includes('free')) ||
      statusLower === statusFilter.toLowerCase();

    return matchesSource && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Global Orders &amp; Inbound Leads</h2>
          <p className="text-xs text-slate-400 mt-1">
            Master audit trail of all user signups (Free Trial &amp; Paid Subscriptions) and automated AI Chatbot customer orders.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            Total Volume: ৳{totalBDT.toLocaleString()} ({combinedRecords.length} Records)
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSourceFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            sourceFilter === 'all'
              ? 'bg-purple-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Records ({combinedRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setSourceFilter('signups')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            sourceFilter === 'signups'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>User Signups &amp; Free Trials ({signupCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSourceFilter('chatbot')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            sourceFilter === 'chatbot'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
          <span>Chatbot Customer Orders ({chatbotCount})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by user email, customer name, phone, order ID, or package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 transition"
          >
            <option value="all">All Statuses</option>
            <option value="free_trial">Free Trial Active</option>
            <option value="pending">Pending Verification</option>
            <option value="under review">Under Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="confirmed & delivered">Confirmed &amp; Delivered</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders & Signups Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Reference ID</th>
                <th className="py-3.5 px-4">User / Customer Details</th>
                <th className="py-3.5 px-4">Origin Source / App</th>
                <th className="py-3.5 px-4">Selected Package / Item</th>
                <th className="py-3.5 px-4">Amount (BDT)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No records found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((order, idx) => {
                  const stLower = String(order.order_status || 'Confirmed').toLowerCase();
                  const isFree = stLower.includes('free') || Number(order.total_amount_bdt) === 0;
                  const isPending = stLower.includes('pending') || stLower.includes('review');
                  const isRejected = stLower.includes('reject') || stLower.includes('refund') || stLower.includes('suspend');

                  return (
                    <tr key={order.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                        {order.order_id || `ORD-${String(idx + 1).padStart(4, '0')}`}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{order.customer_name || 'Guest Customer'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {order.phone_number || order.email || 'No contact provided'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        {order.record_source === 'signup' ? (
                          <div>
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                              <Crown className="w-3 h-3" />
                              <span>Platform Account / Subscription</span>
                            </span>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-300">{getPageName(order.page_id)}</p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: {order.page_id || 'Chatbot'}</p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200">{order.selected_package || 'Free Trial'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`font-black ${Number(order.total_amount_bdt) > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {order.total_amount_bdt ? `৳${Number(order.total_amount_bdt).toLocaleString()}` : '৳0 (Free)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isRejected
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : isPending
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : isFree
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{order.order_status || 'Confirmed'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!order.isSynthesizedUser && onDeleteOrder ? (
                          <button
                            onClick={() => {
                              setOrderToDelete(order);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Permanently Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Synced User</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Permanently Delete Order Record"
        message={`Are you sure you want to permanently delete order "${orderToDelete?.order_id || 'this order'}" placed by "${orderToDelete?.customer_name || 'Guest'}"? This record will be deleted from the database across all tenant dashboards.`}
        confirmText="Yes, Delete Order"
        onConfirm={async () => {
          if (orderToDelete && onDeleteOrder) {
            await onDeleteOrder(orderToDelete.id || orderToDelete.order_id);
          }
          setIsDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
      />
    </div>
  );
}
