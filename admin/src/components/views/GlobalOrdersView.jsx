import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone,
  FileSpreadsheet,
  Download,
  Trash2
} from 'lucide-react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

export default function GlobalOrdersView({ orders = [], pages = [], onDeleteOrder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getPageName = (pageId) => {
    const found = pages.find(p => p.page_id === pageId);
    return found ? found.page_name : pageId || 'Direct Messenger';
  };

  const totalBDT = orders.reduce((sum, o) => sum + (Number(o.total_amount_bdt) || 0), 0);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.phone_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.selected_package || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (o.order_status || 'Confirmed').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Global Orders &amp; Inbound Leads</h2>
          <p className="text-xs text-slate-400 mt-1">
            Master audit trail of every automated sale and qualification generated across the platform.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            Total Sales: ৳{totalBDT.toLocaleString()} ({orders.length} Orders)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, order ID, or package..."
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
            <option value="all">All Order Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Order Reference</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Origin Business Page</th>
                <th className="py-3.5 px-4">Selected Package</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No customer orders found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => (
                  <tr key={order.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                      {order.order_id || `ORD-${String(idx + 1).padStart(4, '0')}`}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{order.customer_name || 'Guest Customer'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {order.phone_number || 'No phone provided'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-300">{getPageName(order.page_id)}</p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {order.page_id || 'N/A'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{order.selected_package || 'Consultation'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-black text-emerald-400">
                        {order.total_amount_bdt ? `৳${Number(order.total_amount_bdt).toLocaleString()}` : '৳0'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{order.order_status || 'Confirmed'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {onDeleteOrder && (
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
                      )}
                    </td>
                  </tr>
                ))
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

