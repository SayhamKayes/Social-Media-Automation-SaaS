import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Sliders, 
  X, 
  Check, 
  Lock, 
  ArrowRight,
  DollarSign,
  HelpCircle,
  Copy,
  Layers,
  Globe
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseAdminClient';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

import bkashLogo from '../../assets/bkash.png';
import nagadLogo from '../../assets/nagad.png';
import rocketLogo from '../../assets/rocket.png';
import sslcommerzLogo from '../../assets/sslcommerz.svg';

export default function PaymentGatewayManager() {
  const [activeSubTab, setActiveSubTab] = useState('methods'); /* 'methods' | 'ledger' | 'simulator' */
  const [loading, setLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  /* Payment Methods State (COD Removed, MFS + SSLCommerz) */
  const [methods, setMethods] = useState({
    bkash: {
      method_id: 'bkash',
      name: 'bKash Mobile Financial Service',
      is_active: true,
      account_type: 'MERCHANT',
      number: '01892-019281',
      counter: '1',
      instructions: "Select 'Payment' in your bKash app, pay to 01892-019281, and enter your TrxID below."
    },
    nagad: {
      method_id: 'nagad',
      name: 'Nagad Postal MFS',
      is_active: true,
      account_type: 'MERCHANT',
      number: '01918-293810',
      counter: '1',
      instructions: "Select 'Payment' in your Nagad app, pay to 01918-293810, and enter your TrxID below."
    },
    rocket: {
      method_id: 'rocket',
      name: 'Rocket (Dutch-Bangla Bank)',
      is_active: true,
      account_type: 'MERCHANT',
      number: '01712-3456789',
      counter: '1',
      instructions: "Select 'Merchant Pay' in your Rocket app, enter 01712-3456789, and provide TrxID."
    },
    sslcommerz: {
      method_id: 'sslcommerz',
      name: 'SSLCOMMERZ Multi-Card Gateway',
      is_active: true,
      store_id: 'socialsaas_live',
      store_password: '••••••••',
      is_sandbox: true,
      instructions: 'Complete instant payment with Visa, Mastercard, Amex, Net Banking, or MFS via SSLCOMMERZ.'
    }
  });

  /* Transactions Ledger State */
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  /* Manual Entry Modal */
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMethod, setManualMethod] = useState('bkash');
  const [manualTrxId, setManualTrxId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCustomer, setManualCustomer] = useState('');

  /* Delete Modal */
  const [txnToDelete, setTxnToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* Simulator State */
  const [simMethod, setSimMethod] = useState('bkash');
  const [simAmount, setSimAmount] = useState('1499');
  const [simPhone, setSimPhone] = useState('+8801712345678');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  /* Load Payment Settings & Ledger on Mount */
  useEffect(() => {
    fetchPaymentSettings();
    fetchTransactions();
  }, []);

  const fetchPaymentSettings = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*');

      if (!error && data && data.length > 0) {
        setMethods(prev => {
          const updated = { ...prev };
          data.forEach(item => {
            if (updated[item.method_id]) {
              updated[item.method_id] = {
                ...updated[item.method_id],
                ...item
              };
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.warn('Notice: using master cached payment settings:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
    } catch (err) {
      console.warn('Notice: using local transactions cache:', err);
    }
  };

  /* Save Payment Methods Settings */
  const handleSaveMethods = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      if (isSupabaseConfigured()) {
        const rows = Object.values(methods).map((m, index) => ({
          method_id: m.method_id,
          name: m.name,
          is_active: Boolean(m.is_active),
          account_type: m.account_type || 'MERCHANT',
          number: m.number || '',
          counter: m.counter || '',
          instructions: m.instructions || '',
          store_id: m.store_id || '',
          store_password: m.store_password || '',
          is_sandbox: Boolean(m.is_sandbox),
          display_order: index + 1,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('payment_settings')
          .upsert(rows, { onConflict: 'method_id' });

        if (error) throw error;
      }

      setSaveSuccessMsg('Platform Master Payment Configuration successfully updated and live across client checkouts!');
      setTimeout(() => setSaveSuccessMsg(''), 4500);
    } catch (err) {
      setSaveErrorMsg(err.message || 'Failed to persist master payment settings.');
    } finally {
      setLoading(false);
    }
  };

  /* Verify / Approve Transaction */
  const handleVerifyTransaction = async (txnId) => {
    setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, status: 'PAID' } : t));
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('payment_transactions')
          .update({ status: 'PAID', updated_at: new Date().toISOString() })
          .eq('id', txnId);
      } catch (err) {
        console.error('Error verifying transaction:', err);
      }
    }
  };

  /* Delete Transaction */
  const handleConfirmDeleteTxn = async () => {
    if (!txnToDelete) return;
    setTransactions(prev => prev.filter(t => t.id !== txnToDelete.id));

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('payment_transactions')
          .delete()
          .eq('id', txnToDelete.id);
      } catch (err) {
        console.error('Error deleting transaction:', err);
      }
    }
    setIsDeleteModalOpen(false);
    setTxnToDelete(null);
  };

  /* Add Manual Transaction */
  const handleAddManualTransaction = async (e) => {
    e.preventDefault();
    if (!manualAmount || !manualTrxId) return;

    const newTxn = {
      order_id: manualOrderId.trim() || `ORD-MFS-${Date.now().toString().slice(-4)}`,
      customer_name: manualCustomer.trim() || 'Direct Client Subscriber',
      customer_phone: manualPhone.trim() || '+8801700000000',
      payment_method: manualMethod.toUpperCase(),
      transaction_id: manualTrxId.trim().toUpperCase(),
      amount: Number(manualAmount) || 0,
      currency: 'BDT',
      status: 'PAID',
      notes: 'Logged directly by Super Admin',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .insert(newTxn)
          .select();

        if (!error && data && data.length > 0) {
          setTransactions(prev => [data[0], ...prev]);
        } else {
          setTransactions(prev => [{ ...newTxn, id: String(Date.now()) }, ...prev]);
        }
      } catch (err) {
        setTransactions(prev => [{ ...newTxn, id: String(Date.now()) }, ...prev]);
      }
    } else {
      setTransactions(prev => [{ ...newTxn, id: String(Date.now()) }, ...prev]);
    }

    setShowAddModal(false);
    setManualOrderId('');
    setManualPhone('');
    setManualTrxId('');
    setManualAmount('');
    setManualCustomer('');
  };

  /* Run Live Payment Simulator */
  const handleRunSimulator = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    setSimResult(null);

    await new Promise(r => setTimeout(r, 700));

    const methodUpper = simMethod.toUpperCase();
    const prefix = methodUpper === 'BKASH' ? 'BK' : methodUpper === 'NAGAD' ? 'NGD' : methodUpper === 'ROCKET' ? 'RKT' : 'SSL';
    const fakeTrxId = `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const simRecord = {
      order_id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: 'Super Admin Test Buyer',
      customer_phone: simPhone,
      payment_method: methodUpper,
      transaction_id: fakeTrxId,
      amount: Number(simAmount) || 1499,
      currency: 'BDT',
      status: 'PAID',
      notes: 'Executed via Super Admin Live Simulator',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .insert(simRecord)
          .select();

        if (!error && data && data.length > 0) {
          setTransactions(prev => [data[0], ...prev]);
        } else {
          setTransactions(prev => [{ ...simRecord, id: String(Date.now()) }, ...prev]);
        }
      } catch (err) {
        setTransactions(prev => [{ ...simRecord, id: String(Date.now()) }, ...prev]);
      }
    } else {
      setTransactions(prev => [{ ...simRecord, id: String(Date.now()) }, ...prev]);
    }

    setSimResult({
      success: true,
      trxId: fakeTrxId,
      method: methodUpper,
      amount: simAmount,
      timestamp: new Date().toLocaleTimeString()
    });
    setSimLoading(false);
  };

  /* Filtered transactions */
  const filteredTxns = transactions.filter(t => {
    const matchesSearch = 
      (t.transaction_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer_phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.order_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = filterMethod === 'ALL' || (t.payment_method || '').toUpperCase() === filterMethod.toUpperCase();
    const matchesStatus = filterStatus === 'ALL' || (t.status || '').toUpperCase() === filterStatus.toUpperCase();
    return matchesSearch && matchesMethod && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <span>Master Payment Gateway &amp; MFS Channels</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Centrally manage bKash, Nagad, Rocket, and SSLCOMMERZ gateway credentials for all subscription purchases.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-purple-500/30 shadow-lg">
          <button
            onClick={() => setActiveSubTab('methods')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'methods'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Payment Channels
          </button>
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeSubTab === 'ledger'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>TrxID Ledger</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/30 text-purple-200">
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'simulator'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Test Simulator
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* TAB 1: PAYMENT METHODS */}
      {activeSubTab === 'methods' && (
        <form onSubmit={handleSaveMethods} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* BKASH CARD */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/20 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <img src={bkashLogo} alt="bKash" className="h-8 w-auto rounded object-contain bg-white/5 p-1" />
                  <div>
                    <h3 className="text-sm font-bold text-white">bKash Mobile Financial Service</h3>
                    <p className="text-[10px] text-pink-400 font-semibold">Instant Personal &amp; Merchant Gateway</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methods.bkash.is_active}
                    onChange={(e) => setMethods({
                      ...methods,
                      bkash: { ...methods.bkash, is_active: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    bKash Account Type
                  </label>
                  <select
                    value={methods.bkash.account_type}
                    onChange={(e) => setMethods({
                      ...methods,
                      bkash: { ...methods.bkash, account_type: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="MERCHANT">Merchant Payment (0% Fee to User)</option>
                    <option value="PERSONAL">Personal Send Money</option>
                    <option value="AGENT">Agent Cash Out</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Wallet / Merchant Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 01892-019281"
                      value={methods.bkash.number}
                      onChange={(e) => setMethods({
                        ...methods,
                        bkash: { ...methods.bkash, number: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Counter No.
                    </label>
                    <input
                      type="text"
                      placeholder="1"
                      value={methods.bkash.counter}
                      onChange={(e) => setMethods({
                        ...methods,
                        bkash: { ...methods.bkash, counter: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subscriber Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={methods.bkash.instructions}
                    onChange={(e) => setMethods({
                      ...methods,
                      bkash: { ...methods.bkash, instructions: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* NAGAD CARD */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/20 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <img src={nagadLogo} alt="Nagad" className="h-8 w-auto rounded object-contain bg-white/5 p-1" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Nagad Postal MFS</h3>
                    <p className="text-[10px] text-orange-400 font-semibold">Postal Financial Service</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methods.nagad.is_active}
                    onChange={(e) => setMethods({
                      ...methods,
                      nagad: { ...methods.nagad, is_active: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nagad Account Type
                  </label>
                  <select
                    value={methods.nagad.account_type}
                    onChange={(e) => setMethods({
                      ...methods,
                      nagad: { ...methods.nagad, account_type: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="MERCHANT">Merchant Payment</option>
                    <option value="PERSONAL">Personal Send Money</option>
                    <option value="AGENT">Agent Cash Out</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Nagad Wallet Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 01918-293810"
                      value={methods.nagad.number}
                      onChange={(e) => setMethods({
                        ...methods,
                        nagad: { ...methods.nagad, number: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Counter No.
                    </label>
                    <input
                      type="text"
                      placeholder="1"
                      value={methods.nagad.counter}
                      onChange={(e) => setMethods({
                        ...methods,
                        nagad: { ...methods.nagad, counter: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subscriber Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={methods.nagad.instructions}
                    onChange={(e) => setMethods({
                      ...methods,
                      nagad: { ...methods.nagad, instructions: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* ROCKET CARD */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/20 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <img src={rocketLogo} alt="Rocket" className="h-8 w-auto rounded object-contain bg-white/5 p-1" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Rocket (Dutch-Bangla Bank)</h3>
                    <p className="text-[10px] text-purple-400 font-semibold">DBBL Core Banking MFS</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methods.rocket.is_active}
                    onChange={(e) => setMethods({
                      ...methods,
                      rocket: { ...methods.rocket, is_active: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Rocket Account Type
                  </label>
                  <select
                    value={methods.rocket.account_type}
                    onChange={(e) => setMethods({
                      ...methods,
                      rocket: { ...methods.rocket, account_type: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="MERCHANT">Merchant Pay</option>
                    <option value="PERSONAL">Personal Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Rocket 12-Digit Wallet Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01712-3456789"
                    value={methods.rocket.number}
                    onChange={(e) => setMethods({
                      ...methods,
                      rocket: { ...methods.rocket, number: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Subscriber Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={methods.rocket.instructions}
                    onChange={(e) => setMethods({
                      ...methods,
                      rocket: { ...methods.rocket, instructions: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* SSLCOMMERZ GATEWAY CARD */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/20 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <img src={sslcommerzLogo} alt="SSLCOMMERZ" className="h-8 w-auto rounded object-contain bg-white/5 p-1" />
                  <div>
                    <h3 className="text-sm font-bold text-white">SSLCOMMERZ Online Multi-Card Gateway</h3>
                    <p className="text-[10px] text-blue-400 font-semibold">Visa, Mastercard, Amex &amp; Net Banking</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={methods.sslcommerz.is_active}
                    onChange={(e) => setMethods({
                      ...methods,
                      sslcommerz: { ...methods.sslcommerz, is_active: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Store ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. testbox"
                      value={methods.sslcommerz.store_id}
                      onChange={(e) => setMethods({
                        ...methods,
                        sslcommerz: { ...methods.sslcommerz, store_id: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Store Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={methods.sslcommerz.store_password}
                      onChange={(e) => setMethods({
                        ...methods,
                        sslcommerz: { ...methods.sslcommerz, store_password: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Environment Mode
                  </label>
                  <select
                    value={methods.sslcommerz.is_sandbox ? 'sandbox' : 'live'}
                    onChange={(e) => setMethods({
                      ...methods,
                      sslcommerz: { ...methods.sslcommerz, is_sandbox: e.target.value === 'sandbox' }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="sandbox">Sandbox Test Mode</option>
                    <option value="live">Live Production</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Master Settings...' : 'Save Master Gateway Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TRANSACTIONS & TRXID LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by TrxID, phone, name, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Methods</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="SSLCOMMERZ">SSLCommerz</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-purple-600/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Payment</span>
            </button>
          </div>

          {/* Transactions Table */}
          <div className="rounded-2xl bg-slate-900 border border-purple-500/20 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">TrxID / Reference</th>
                    <th className="py-3 px-4">Order / Plan</th>
                    <th className="py-3 px-4">Subscriber Name &amp; Phone</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500">
                        No subscription payment records found. Log a manual TrxID or simulate a test purchase.
                      </td>
                    </tr>
                  ) : (
                    filteredTxns.map((txn) => {
                      const m = (txn.payment_method || '').toUpperCase();
                      return (
                        <tr key={txn.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              m === 'BKASH' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' :
                              m === 'NAGAD' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                              m === 'ROCKET' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}>
                              {m}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">
                            {txn.transaction_id || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-purple-300">
                            {txn.order_id || 'DIRECT'}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-white">{txn.customer_name || 'Subscriber'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{txn.customer_phone || 'N/A'}</p>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">
                            ৳{Number(txn.amount).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              txn.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{txn.status || 'PENDING'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {txn.created_at ? new Date(txn.created_at).toLocaleDateString() : 'Today'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {txn.status !== 'PAID' && (
                                <button
                                  onClick={() => handleVerifyTransaction(txn.id)}
                                  className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white text-[10px] font-bold transition"
                                  title="Approve & Mark as Paid"
                                >
                                  Verify
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setTxnToDelete(txn);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                                title="Delete Record"
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
        </div>
      )}

      {/* TAB 3: SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-5 shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <span>Live Subscription Payment Simulator</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an end-to-end subscriber checkout across bKash, Nagad, Rocket, or SSLCOMMERZ Sandbox.
            </p>
          </div>

          <form onSubmit={handleRunSimulator} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={simMethod}
                  onChange={(e) => setSimMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 font-semibold"
                >
                  <option value="bkash">bKash Payment</option>
                  <option value="nagad">Nagad Payment</option>
                  <option value="rocket">Rocket (DBBL)</option>
                  <option value="sslcommerz">SSLCommerz Sandbox</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Subscription Amount (BDT)
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Subscriber Phone Number
              </label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={simLoading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {simLoading ? (
                <span>Simulating Payment Gateway...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Test Payment &amp; Verify TrxID</span>
                </>
              )}
            </button>
          </form>

          {simResult && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment Successfully Simulated &amp; Recorded</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{simResult.timestamp}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/20 text-slate-300 font-mono space-y-1">
                <p>Method: <strong className="text-white">{simResult.method}</strong></p>
                <p>Generated TrxID: <strong className="text-emerald-400 font-bold">{simResult.trxId}</strong></p>
                <p>Amount: <strong className="text-white">৳{Number(simResult.amount).toLocaleString()}</strong></p>
                <p className="text-[11px] text-slate-400">Ledger Status: <span className="text-emerald-400 font-bold">PAID &amp; ACTIVE</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Log Manual Payment / TrxID</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="sslcommerz">SSLCommerz</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Subscriber Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Ahmed"
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Transaction ID (TrxID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BK-98X21A"
                  value={manualTrxId}
                  onChange={(e) => setManualTrxId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Amount (BDT)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1499"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Plan / Order ID
                  </label>
                  <input
                    type="text"
                    placeholder="SUB-PRO"
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  placeholder="+88017XXXXXXXX"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Transaction Record"
        message={`Are you sure you want to permanently delete transaction "${txnToDelete?.transaction_id || 'this transaction'}"? This record will be removed from your master ledger.`}
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDeleteTxn}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setTxnToDelete(null);
        }}
      />
    </div>
  );
}

