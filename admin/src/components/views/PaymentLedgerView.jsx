import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  X
} from 'lucide-react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

import bkashLogo from '../../assets/bkash.png';
import nagadLogo from '../../assets/nagad.png';
import rocketLogo from '../../assets/rocket.png';
import sslcommerzLogo from '../../assets/sslcommerz.svg';

export const TRANSACTION_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending Verification', orderLabel: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review (Checking TrxID)', orderLabel: 'Under Review' },
  { value: 'CONFIRMED', label: 'Confirmed & Plan Activated', orderLabel: 'Confirmed' },
  { value: 'CONFIRMED_DELIVERED', label: 'Confirmed & Delivered', orderLabel: 'Confirmed & Delivered' },
  { value: 'REJECTED', label: 'Rejected (Invalid TrxID)', orderLabel: 'Rejected' },
  { value: 'REFUNDED', label: 'Refunded', orderLabel: 'Refunded' }
];

export const extractPlanFromTransaction = (txn) => {
  const oid = String(txn?.order_id || '').toUpperCase();
  const notes = String(txn?.notes || '').toLowerCase();
  const amt = Number(txn?.amount) || 0;

  if (oid.includes('AGENCY') || notes.includes('agency') || amt >= 9000) {
    return { planId: 'agency', planName: 'Agency Enterprise', maxPages: 9999 };
  }
  if (oid.includes('BUSINESS') || notes.includes('business') || amt >= 3500) {
    return { planId: 'business', planName: 'Business Pro', maxPages: 10 };
  }
  if (oid.includes('STARTER') || notes.includes('starter') || amt >= 1000) {
    return { planId: 'starter', planName: 'Starter Growth', maxPages: 3 };
  }
  return { planId: 'starter', planName: 'Starter Growth', maxPages: 3 };
};

export default function PaymentLedgerView({
  transactions = [],
  users = [],
  onUpdateTransactionStatus,
  onAddManualTransaction,
  onDeleteTransaction
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [copiedTrxId, setCopiedTrxId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  /* Manual Entry Modal */
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualPlan, setManualPlan] = useState('starter');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMethod, setManualMethod] = useState('bkash');
  const [manualTrxId, setManualTrxId] = useState('');
  const [manualAmount, setManualAmount] = useState('1499');
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualStatus, setManualStatus] = useState('CONFIRMED_DELIVERED');

  /* Delete Modal */
  const [txnToDelete, setTxnToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getMethodLogo = (methodStr = '') => {
    const m = methodStr.toLowerCase();
    if (m.includes('bkash')) return bkashLogo;
    if (m.includes('nagad')) return nagadLogo;
    if (m.includes('rocket')) return rocketLogo;
    if (m.includes('ssl')) return sslcommerzLogo;
    return null;
  };

  const getUserEmail = (userId) => {
    const found = users.find(u => u.id === userId);
    return found ? found.email : null;
  };

  const isVerifiedStatus = (status = '') => {
    const s = String(status).toUpperCase();
    return s === 'CONFIRMED' || s === 'CONFIRMED_DELIVERED' || s === 'PAID';
  };

  const pendingCount = transactions.filter(t => String(t.status || 'PENDING').toUpperCase() === 'PENDING').length;
  const verifiedCount = transactions.filter(t => isVerifiedStatus(t.status)).length;
  const verifiedRevenueBDT = transactions
    .filter(t => isVerifiedStatus(t.status))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const filteredTransactions = transactions.filter((t) => {
    const methodMatch = filterMethod === 'ALL' || String(t.payment_method || '').toUpperCase() === filterMethod;
    const statusUpper = String(t.status || 'PENDING').toUpperCase();
    const statusMatch =
      filterStatus === 'ALL' ||
      (filterStatus === 'VERIFIED' && isVerifiedStatus(statusUpper)) ||
      statusUpper === filterStatus;

    const ownerEmail = getUserEmail(t.user_id) || '';
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      (t.transaction_id || '').toLowerCase().includes(searchLower) ||
      (t.customer_name || '').toLowerCase().includes(searchLower) ||
      (t.customer_phone || '').toLowerCase().includes(searchLower) ||
      (t.order_id || '').toLowerCase().includes(searchLower) ||
      ownerEmail.toLowerCase().includes(searchLower);

    return methodMatch && statusMatch && searchMatch;
  });

  const handleStatusChange = async (txn, nextStatus) => {
    if (!onUpdateTransactionStatus) return;
    setUpdatingId(txn.id);
    try {
      await onUpdateTransactionStatus(txn, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!manualTrxId.trim() || !manualAmount) return;

    const planNames = {
      starter: 'Starter Growth (3 Pages)',
      business: 'Business Pro (10 Pages)',
      agency: 'Agency Enterprise (Unlimited)'
    };

    if (onAddManualTransaction) {
      await onAddManualTransaction({
        order_id: `SUB-${manualPlan.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: manualCustomer.trim() || 'Direct Client Subscriber',
        customer_phone: manualPhone.trim() || 'N/A',
        payment_method: manualMethod.toUpperCase(),
        transaction_id: manualTrxId.trim().toUpperCase(),
        amount: Number(manualAmount) || 0,
        currency: 'BDT',
        status: manualStatus,
        notes: `Plan: ${manualPlan} | ${planNames[manualPlan] || 'Package'}`
      });
    }

    setShowAddModal(false);
    setManualCustomer('');
    setManualPhone('');
    setManualTrxId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Package Payments &amp; TrxID Verification Ledger
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                {pendingCount} Pending Verification
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manually verify bKash, Nagad, and Rocket Transaction IDs. Updating status to Confirmed / Confirmed &amp; Delivered automatically activates the user's package in CRM and Global Orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Manual Payment</span>
        </button>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Awaiting Verification</p>
            <p className="text-2xl font-black text-white mt-1">{pendingCount} Payments</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Requires manual TrxID check</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Confirmed &amp; Delivered</p>
            <p className="text-2xl font-black text-white mt-1">{verifiedCount} Subscriptions</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active verified packages</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Verified Package Revenue</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">৳{verifiedRevenueBDT.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Synced to Overview Gross Sales</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by TrxID, customer name, phone, email, or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Payment Gateways</option>
            <option value="BKASH">bKash MFS</option>
            <option value="NAGAD">Nagad MFS</option>
            <option value="ROCKET">Rocket MFS</option>
            <option value="SSLCOMMERZ">SSLCommerz</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="PENDING">Pending Verification</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CONFIRMED">Confirmed &amp; Activated</option>
            <option value="CONFIRMED_DELIVERED">Confirmed &amp; Delivered</option>
            <option value="REJECTED">Rejected</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Verification Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Order ID &amp; Package</th>
                <th className="py-3.5 px-4">Subscriber / Tenant</th>
                <th className="py-3.5 px-4">Gateway</th>
                <th className="py-3.5 px-4">Submitted TrxID</th>
                <th className="py-3.5 px-4">Amount (BDT)</th>
                <th className="py-3.5 px-4">Verification Status (Update)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-slate-500">
                    No package payment transactions found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const planMeta = extractPlanFromTransaction(txn);
                  const logo = getMethodLogo(txn.payment_method);
                  const currentStatus = String(txn.status || 'PENDING').toUpperCase();
                  const normalizedStatus = currentStatus === 'PAID' ? 'CONFIRMED_DELIVERED' : currentStatus;
                  const userEmail = getUserEmail(txn.user_id);

                  return (
                    <tr key={txn.id || txn.order_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4">
                        <p className="font-mono font-bold text-purple-300">{txn.order_id}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30 text-[10px] font-bold">
                          {planMeta.planName} ({planMeta.maxPages >= 999 ? 'Unlimited' : `${planMeta.maxPages} Pages`})
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-white">{txn.customer_name || 'Subscriber'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{txn.customer_phone || 'N/A'}</p>
                        {userEmail && (
                          <p className="text-[10px] text-purple-300 font-mono">{userEmail}</p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {logo && (
                            <img src={logo} alt={txn.payment_method} className="w-6 h-6 object-contain rounded bg-white p-0.5" />
                          )}
                          <span className="font-bold text-slate-200 uppercase">{txn.payment_method}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-amber-300">
                          <span>{txn.transaction_id}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(txn.transaction_id || '');
                              setCopiedTrxId(txn.id);
                              setTimeout(() => setCopiedTrxId(null), 2000);
                            }}
                            className="text-slate-400 hover:text-white"
                            title="Copy TrxID"
                          >
                            {copiedTrxId === txn.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-black text-emerald-400 text-sm">
                        ৳{Number(txn.amount || 0).toLocaleString()}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          disabled={updatingId === txn.id}
                          value={normalizedStatus}
                          onChange={(e) => handleStatusChange(txn, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none transition ${
                            normalizedStatus === 'PENDING'
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : normalizedStatus === 'UNDER_REVIEW'
                                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                                : normalizedStatus === 'REJECTED' || normalizedStatus === 'REFUNDED'
                                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {TRANSACTION_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {normalizedStatus === 'PENDING' && (
                            <button
                              type="button"
                              disabled={updatingId === txn.id}
                              onClick={() => handleStatusChange(txn, 'CONFIRMED_DELIVERED')}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm"
                              title="Approve TrxID & Activate Plan"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Delivery</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setTxnToDelete(txn);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Manual Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Log Manual Package Payment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subscriber Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="01712345678"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Package Tier</label>
                  <select
                    value={manualPlan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualPlan(val);
                      setManualAmount(val === 'agency' ? '9999' : val === 'business' ? '3999' : '1499');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="starter">Starter Growth (৳1,499)</option>
                    <option value="business">Business Pro (৳3,999)</option>
                    <option value="agency">Agency Enterprise (৳9,999)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="sslcommerz">SSLCommerz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (BDT ৳)</label>
                  <input
                    type="number"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction ID (TrxID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK9X82M1"
                    value={manualTrxId}
                    onChange={(e) => setManualTrxId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  >
                    {TRANSACTION_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                >
                  Save Payment Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Payment Transaction"
        message={`Are you sure you want to delete transaction "${txnToDelete?.transaction_id}" (${txnToDelete?.order_id})?`}
        confirmText="Yes, Delete"
        onConfirm={async () => {
          if (txnToDelete && onDeleteTransaction) {
            await onDeleteTransaction(txnToDelete.id);
          }
          setIsDeleteModalOpen(false);
          setTxnToDelete(null);
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setTxnToDelete(null);
        }}
      />
    </div>
  );
}

