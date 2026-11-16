import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Globe,
  Trash2,
  Plus,
  X,
  Bot
} from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

/* Detect order channel from order record */
export const detectOrderChannel = (ord) => {
  if (!ord) return 'facebook';
  const raw = String(ord.channel || ord.social_channel || '').toLowerCase();
  if (raw.includes('instagram') || raw === 'ig') return 'instagram';
  if (raw.includes('whatsapp') || raw === 'wa') return 'whatsapp';
  if (raw.includes('web')) return 'web';
  if (raw.includes('facebook') || raw.includes('messenger') || raw === 'fb') return 'facebook';
  const req = String(ord.customer_requirements || ord.selected_addons || '').toLowerCase();
  if (req.includes('[instagram]') || req.includes('channel:instagram')) return 'instagram';
  if (req.includes('[whatsapp]') || req.includes('channel:whatsapp')) return 'whatsapp';
  const oid = String(ord.order_id || '').toUpperCase();
  if (oid.startsWith('IG-')) return 'instagram';
  if (oid.startsWith('WA-')) return 'whatsapp';
  return 'facebook';
};

export default function OrdersManager({ 
  orders = [], 
  pages = [],
  onAddOrder,
  onUpdateOrderStatus,
  onDeleteOrder 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* Add New Order Modal States */
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [newOrderChannel, setNewOrderChannel] = useState('facebook');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const [newAmountBdt, setNewAmountBdt] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newStatus, setNewStatus] = useState('Confirmed');
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.page_id || '');

  const getChannelBadge = (ord) => {
    const ch = detectOrderChannel(ord);
    if (ch === 'instagram') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
          <Instagram className="w-3 h-3" />
          <span>Instagram Order</span>
        </span>
      );
    }
    if (ch === 'whatsapp') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <MessageCircle className="w-3 h-3" />
          <span>WhatsApp Order</span>
        </span>
      );
    }
    if (ch === 'web') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Globe className="w-3 h-3" />
          <span>Website Chat</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Facebook className="w-3 h-3" />
        <span>Messenger Order</span>
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const orderChannel = detectOrderChannel(order);
    const matchesChannel = selectedChannel === 'ALL' || orderChannel === selectedChannel.toLowerCase();

    const matchesSearch =
      (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.phone_number || '').includes(searchQuery) ||
      (order.order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.selected_package || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (order.order_status || 'Confirmed').toUpperCase() === statusFilter;

    return matchesChannel && matchesSearch && matchesStatus;
  });

  const fbCount = orders.filter(o => detectOrderChannel(o) === 'facebook').length;
  const igCount = orders.filter(o => detectOrderChannel(o) === 'instagram').length;
  const waCount = orders.filter(o => detectOrderChannel(o) === 'whatsapp').length;
  const totalRevenueBDT = filteredOrders.reduce((sum, o) => sum + (Number(o.total_amount_bdt) || 0), 0);

  const handleCreateManualOrder = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newPhone.trim() || !newPackage.trim()) return;

    setSavingOrder(true);
    const prefix = newOrderChannel === 'instagram' ? 'IG' : newOrderChannel === 'whatsapp' ? 'WA' : 'FB';
    const generatedOrderId = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderPayload = {
      order_id: generatedOrderId,
      page_id: selectedPageId || pages[0]?.page_id || null,
      customer_name: newCustomerName.trim(),
      phone_number: newPhone.trim(),
      email: newEmail.trim() || null,
      selected_package: newPackage.trim(),
      selected_addons: `Channel: ${newOrderChannel.toUpperCase()}`,
      total_amount_bdt: Number(newAmountBdt) || 0,
      order_status: newStatus,
      customer_requirements: newRequirements.trim() 
        ? `[${newOrderChannel.toUpperCase()}] ${newRequirements.trim()}`
        : `[${newOrderChannel.toUpperCase()}] Direct social order`,
      channel: newOrderChannel,
      created_at: new Date().toISOString()
    };

    try {
      if (onAddOrder) {
        await onAddOrder(orderPayload);
      }
      setShowAddModal(false);
      setNewCustomerName('');
      setNewPhone('');
      setNewEmail('');
      setNewPackage('');
      setNewAmountBdt('');
      setNewRequirements('');
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-bold text-white tracking-tight">Orders &amp; Confirmed Leads</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Revenue: ৳{totalRevenueBDT.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Confirmed customer orders and qualified sales leads captured by your AI Chatbot across Messenger, Instagram, and WhatsApp.
          </p>
        </div>

        {/* Search, Filter & Add Order Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, phone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
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

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Social Order</span>
          </button>
        </div>
      </div>

      {/* Info Notice: How Orders Arrive Here */}
      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center space-x-2.5">
          <Bot className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>How Orders Populate:</strong> When a customer confirms a purchase in <strong>Messenger</strong>, <strong>Instagram DM</strong>, or <strong>WhatsApp</strong>, your n8n AI Agent automatically extracts their Name, Phone, and Package and logs the confirmed order here. You can also log orders manually.
          </span>
        </div>
      </div>

      {/* Social Media Channel Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setSelectedChannel('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            selectedChannel === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          All Orders ({orders.length})
        </button>

        <button
          onClick={() => setSelectedChannel('facebook')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            selectedChannel === 'facebook'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Facebook className="w-3.5 h-3.5 text-blue-300" />
          <span>Messenger Orders ({fbCount})</span>
        </button>

        <button
          onClick={() => setSelectedChannel('instagram')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            selectedChannel === 'instagram'
              ? 'bg-pink-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Instagram className="w-3.5 h-3.5 text-pink-300" />
          <span>Instagram Orders ({igCount})</span>
        </button>

        <button
          onClick={() => setSelectedChannel('whatsapp')}
          className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            selectedChannel === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
          <span>WhatsApp Orders ({waCount})</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <p className="text-base font-semibold text-slate-300">No Orders Found in This Channel View</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Confirmed customer orders from Messenger, Instagram DM, and WhatsApp will appear here automatically, or click "Add Social Order" to log one manually.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Messenger / IG / WhatsApp Order</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order Channel</th>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Product / Package</th>
                  <th className="py-3.5 px-4">Amount (BDT)</th>
                  <th className="py-3.5 px-4">Order Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id || ord.order_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4">
                      {getChannelBadge(ord)}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {ord.order_id || 'ORD-AUTO'}
                    </td>
                    <td className="py-4 px-4 space-y-0.5">
                      <p className="font-bold text-white text-sm">{ord.customer_name || 'Customer'}</p>
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
                      <p className="font-semibold text-indigo-300">{ord.selected_package || 'Standard Order'}</p>
                      {ord.customer_requirements && (
                        <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-1">
                          "{ord.customer_requirements.replace(/^\[(FACEBOOK|INSTAGRAM|WHATSAPP)\]\s*/i, '')}"
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-400">
                      {ord.total_amount_bdt ? `৳${Number(ord.total_amount_bdt).toLocaleString()}` : '৳0'}
                    </td>
                    <td className="py-4 px-4">
                      {onUpdateOrderStatus ? (
                        <select
                          value={ord.order_status || 'Confirmed'}
                          onChange={(e) => onUpdateOrderStatus(ord.id || ord.order_id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{ord.order_status || 'Confirmed'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Today'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {onDeleteOrder && (
                        <button
                          onClick={() => {
                            setOrderToDelete(ord);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete Order Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD SOCIAL ORDER MODAL (Messenger, Instagram, WhatsApp) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-400">
                <ShoppingBag className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Add Social Order (Messenger / IG / WhatsApp)</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4">
              {/* Platform Channel Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Select Order Source Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'facebook', label: 'Messenger', icon: Facebook, color: 'text-blue-400' },
                    { id: 'instagram', label: 'Instagram DM', icon: Instagram, color: 'text-pink-400' },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-400' }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const active = newOrderChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setNewOrderChannel(ch.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${ch.color}`} />
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahmudul Hasan"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01712345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product or Package Ordered</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium Hoodie / Web Package"
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Amount (BDT ৳)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500"
                    value={newAmountBdt}
                    onChange={(e) => setNewAmountBdt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Address / Order Notes</label>
                <textarea
                  rows={2}
                  placeholder="Delivery address, size, color, or special instructions..."
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOrder}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {savingOrder ? 'Saving Order...' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Order Record"
        message={`Are you sure you want to permanently delete order "${orderToDelete?.order_id || 'this order'}" for customer "${orderToDelete?.customer_name || 'Guest'}"? This record will be removed from your store logs.`}
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
