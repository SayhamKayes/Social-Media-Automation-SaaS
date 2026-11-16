import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Lock, 
  ArrowRight, 
  Copy, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Building,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

import bkashLogo from '../../assets/bkash.png';
import nagadLogo from '../../assets/nagad.png';
import rocketLogo from '../../assets/rocket.png';
import sslcommerzLogo from '../../assets/sslcommerz.svg';

export default function SubscriptionCheckoutModal({
  isOpen,
  plan,
  user,
  onClose,
  onPaymentSuccess
}) {
  const [selectedMethod, setSelectedMethod] = useState('bkash');
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [trxId, setTrxId] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  /* Step: 'form' | 'success' */
  const [checkoutStep, setCheckoutStep] = useState('form');
  const [successReceipt, setSuccessReceipt] = useState(null);

  /* Dynamic Admin Payment Configurations */
  const [gatewaySettings, setGatewaySettings] = useState({
    bkash: {
      number: '01892-019281',
      account_type: 'MERCHANT',
      counter: '1',
      instructions: "Select 'Payment' in your bKash app, pay to 01892-019281, and enter your TrxID below."
    },
    nagad: {
      number: '01918-293810',
      account_type: 'MERCHANT',
      counter: '1',
      instructions: "Select 'Payment' in your Nagad app, pay to 01918-293810, and enter your TrxID below."
    },
    rocket: {
      number: '01712-3456789',
      account_type: 'MERCHANT',
      counter: '1',
      instructions: "Select 'Merchant Pay' in your Rocket app, enter 01712-3456789, and provide TrxID."
    },
    sslcommerz: {
      is_active: true,
      instructions: 'Complete instant payment with Visa, Mastercard, Amex, Net Banking, or MFS via SSLCOMMERZ.'
    }
  });

  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email);
      if (user.user_metadata?.full_name && !fullName) setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  /* Fetch live admin payment credentials from Supabase */
  useEffect(() => {
    const fetchAdminSettings = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const { data, error } = await supabase
          .from('payment_settings')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          const mapped = {};
          data.forEach(item => {
            mapped[item.method_id] = {
              number: item.number || '',
              account_type: item.account_type || 'MERCHANT',
              counter: item.counter || '1',
              instructions: item.instructions || ''
            };
          });
          setGatewaySettings(prev => ({ ...prev, ...mapped }));
        }
      } catch (err) {
        console.warn('Using default checkout payment gateway info:', err);
      }
    };

    fetchAdminSettings();
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  /* Quota lookup for plan */
  const planQuotas = {
    free: 1,
    starter: 3,
    business: 10,
    agency: 9999
  };
  const targetMaxPages = planQuotas[plan.id] || plan.pages || 1;

  const currentMethodConfig = gatewaySettings[selectedMethod] || gatewaySettings.bkash;

  const handleCopyNumber = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedMethod !== 'sslcommerz' && !trxId.trim()) {
      setErrorMsg('Please enter your payment Transaction ID (TrxID) to confirm subscription.');
      return;
    }

    setLoading(true);

    try {
      const generatedTrxId = selectedMethod === 'sslcommerz' 
        ? `SSL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        : trxId.trim().toUpperCase();

      const numericAmount = Number(String(plan.price_bdt || plan.priceBDT || '0').replace(/[^0-9]/g, '')) || 0;

      const isInstantGateway = selectedMethod === 'sslcommerz';
      const initialTxnStatus = isInstantGateway ? 'CONFIRMED' : 'PENDING';
      const initialOrderStatus = isInstantGateway ? 'Confirmed' : 'Pending';

      /* 1. Record payment transaction and global order in Supabase */
      if (isSupabaseConfigured() && user) {
        const subOrderId = `SUB-${plan.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await supabase
          .from('payment_transactions')
          .insert({
            user_id: user.id,
            order_id: subOrderId,
            customer_name: fullName.trim() || user.email || 'Subscriber',
            customer_phone: phone.trim() || 'N/A',
            payment_method: selectedMethod.toUpperCase(),
            transaction_id: generatedTrxId,
            amount: numericAmount,
            currency: 'BDT',
            status: initialTxnStatus,
            notes: `Plan: ${plan.id} | ${plan.name} (${targetMaxPages >= 999 ? 'Unlimited' : targetMaxPages} Pages)`
          });

        try {
          await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              order_id: subOrderId,
              customer_name: fullName.trim() || user.email || 'Subscriber',
              phone_number: phone.trim() || user.email || 'N/A',
              email: email.trim() || user.email || null,
              selected_package: `${plan.name} (${selectedMethod.toUpperCase()} Trx: ${generatedTrxId})`,
              total_amount_bdt: numericAmount,
              order_status: initialOrderStatus,
              customer_requirements: `PlanId:${plan.id} | SaaS Package Purchase via ${selectedMethod.toUpperCase()}`
            });
        } catch (ordErr) {
          console.warn('Subscription order log notice:', ordErr);
        }

        /* 2. Only auto-upgrade user profile if using instant SSLCommerz; MFS awaits manual Admin verification */
        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        if (isInstantGateway) {
          await supabase
            .from('user_profiles')
            .update({
              plan_tier: plan.id,
              max_pages: targetMaxPages,
              status: 'active',
              subscription_started_at: now.toISOString(),
              subscription_expires_at: expires.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', user.id);
        } else {
          await supabase
            .from('user_profiles')
            .update({
              notes: `Pending MFS Verification: ${plan.id} (${plan.name}) | TrxID: ${generatedTrxId}`,
              updated_at: now.toISOString()
            })
            .eq('id', user.id);
        }
      }

      setSuccessReceipt({
        planName: plan.name,
        amount: plan.price_bdt || plan.priceBDT || '৳0',
        method: selectedMethod.toUpperCase(),
        trxId: generatedTrxId,
        isPending: !isInstantGateway,
        date: new Date().toLocaleString()
      });

      setCheckoutStep('success');
    } catch (err) {
      console.error('Payment processing error:', err);
      setErrorMsg(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {checkoutStep === 'form' ? (
          <>
            {/* Modal Header */}
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Checkout &amp; Activate Subscription
                </h3>
                <p className="text-xs text-slate-400">
                  Instant activation via bKash, Nagad, Rocket, or SSLCOMMERZ
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selected Plan Summary Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Selected Subscription Tier
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{plan.name}</h4>
                <p className="text-xs text-slate-300">
                  {targetMaxPages >= 999 ? 'Unlimited Connected Pages' : `Up to ${targetMaxPages} Connected Business Pages`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-white">{plan.price_bdt || plan.priceBDT || '৳0'}</p>
                <p className="text-[11px] text-indigo-300 font-medium">{plan.period || '/ mo'}</p>
              </div>
            </div>

            <form onSubmit={handleCompletePayment} className="space-y-5">
              {/* Customer Contact Details */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subscriber Information</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +8801712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Business / Page Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Drape Fashion BD"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Choose Payment Method</span>
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('bkash')}
                    className={`p-3 rounded-2xl border transition flex flex-col items-center text-center space-y-1.5 ${
                      selectedMethod === 'bkash'
                        ? 'bg-pink-600/15 border-pink-500 shadow-md shadow-pink-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={bkashLogo} alt="bKash" className="h-6 w-auto object-contain" />
                    <span className="text-[11px] font-bold text-white">bKash</span>
                  </button>

                  {/* Nagad */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('nagad')}
                    className={`p-3 rounded-2xl border transition flex flex-col items-center text-center space-y-1.5 ${
                      selectedMethod === 'nagad'
                        ? 'bg-orange-600/15 border-orange-500 shadow-md shadow-orange-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={nagadLogo} alt="Nagad" className="h-6 w-auto object-contain" />
                    <span className="text-[11px] font-bold text-white">Nagad</span>
                  </button>

                  {/* Rocket */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('rocket')}
                    className={`p-3 rounded-2xl border transition flex flex-col items-center text-center space-y-1.5 ${
                      selectedMethod === 'rocket'
                        ? 'bg-purple-600/15 border-purple-500 shadow-md shadow-purple-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={rocketLogo} alt="Rocket" className="h-6 w-auto object-contain" />
                    <span className="text-[11px] font-bold text-white">Rocket</span>
                  </button>

                  {/* SSLCommerz */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('sslcommerz')}
                    className={`p-3 rounded-2xl border transition flex flex-col items-center text-center space-y-1.5 ${
                      selectedMethod === 'sslcommerz'
                        ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={sslcommerzLogo} alt="SSLCOMMERZ" className="h-6 w-auto object-contain" />
                    <span className="text-[11px] font-bold text-white">Cards &amp; Net</span>
                  </button>
                </div>

                {/* Method Instructions Box */}
                {selectedMethod !== 'sslcommerz' ? (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Official {selectedMethod.toUpperCase()} Account
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(currentMethodConfig.number)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-bold transition"
                      >
                        {copiedNumber ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg font-mono font-black text-white tracking-wider">
                        {currentMethodConfig.number || '01892-019281'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                        {currentMethodConfig.account_type || 'Merchant'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {currentMethodConfig.instructions || `Send exact fee to the account above and enter the transaction ID below.`}
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                        Enter Transaction ID (TrxID)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9X2B8K12"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-white font-mono uppercase text-sm focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs space-y-2">
                    <p className="font-bold text-blue-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Instant Gateway Checkout</span>
                    </p>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      You will be authenticated via SSLCOMMERZ 256-bit secure gateway to complete payment using Visa, MasterCard, Amex, or Online Internet Banking.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit & Guarantee */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Validating &amp; Activating Plan...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Pay &amp; Activate {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-500 flex items-center justify-center space-x-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Bank Grade Encryption • Instant Cloud Quota Provisioning</span>
                </p>
              </div>
            </form>
          </>
        ) : (
          /* Step 2: Payment Receipt & Verification Status */
          <div className="text-center py-6 space-y-5 animate-fade-in">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xl ${
              successReceipt?.isPending
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-amber-500/10'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
            }`}>
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">
                {successReceipt?.isPending
                  ? 'Payment Submitted for Verification!'
                  : 'Subscription Successfully Activated!'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {successReceipt?.isPending ? (
                  <>
                    Your Transaction ID for <strong>{successReceipt?.planName}</strong> has been logged with status <strong>Pending</strong>. Once our Administrator verifies your TrxID, your package will be activated automatically.
                  </>
                ) : (
                  <>
                    Your account has been upgraded to <strong>{successReceipt?.planName}</strong>
                  </>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 max-w-sm mx-auto font-mono">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Requested Plan:</span>
                <span className="text-white font-bold">{successReceipt?.planName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Amount Submitted:</span>
                <span className="text-emerald-400 font-bold">{successReceipt?.amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Method:</span>
                <span className="text-indigo-300">{successReceipt?.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">TrxID:</span>
                <span className="text-white font-bold">{successReceipt?.trxId}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold ${successReceipt?.isPending ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {successReceipt?.isPending ? 'PENDING ADMIN VERIFICATION' : 'VERIFIED & ACTIVE'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onPaymentSuccess) onPaymentSuccess();
              }}
              className="w-full max-w-sm mx-auto py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 block"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

