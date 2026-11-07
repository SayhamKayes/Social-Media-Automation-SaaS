import React, { useState } from 'react';
import { ShoppingBag, Search, Filter, Phone, Mail, CheckCircle2, Clock } from 'lucide-react';

export default function OrdersManager({ orders = [], onUpdateOrderStatus }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.phone_number || '').includes(searchQuery) ||
      (order.order_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (order.order_status || 'Confirmed').toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Orders & Confirmed Leads</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time orders secured by your Gemini AI chatbot across Messenger.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52 sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No Orders Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Confirmed customer orders captured by the AI agent will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Package & Add-ons</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id || ord.order_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {ord.order_id || 'ORD-AUTO'}
                    </td>
                    <td className="py-4 px-4 space-y-0.5">
                      <p className="font-bold text-white text-sm">{ord.customer_name || 'Anonymous Client'}</p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{ord.phone_number || 'N/A'}</span>
                        </span>
                        {ord.email && (
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{ord.email}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-semibold text-indigo-300">{ord.selected_package || 'Base Package'}</p>
                      {ord.selected_addons && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{ord.selected_addons}</p>
                      )}
                      {ord.customer_requirements && (
                        <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">
                          "{ord.customer_requirements}"
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      {ord.total_amount_bdt ? `৳${Number(ord.total_amount_bdt).toLocaleString()}` : ''}
                      {ord.total_amount_usd ? ` ($${ord.total_amount_usd})` : ''}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{ord.order_status || 'Confirmed'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

