import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, Sparkles, KeyRound, Crown, ArrowLeft } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'login', 
  initialPlan = 'free',
  onAuthSuccess 
}) {
  const [mode, setMode] = useState(initialMode); /* 'login' | 'signup' | 'forgot' */
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'free');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setSelectedPlan(initialPlan || 'free');
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialMode, initialPlan, isOpen]);

  if (!isOpen) return null;

  const planOptions = [
    { id: 'free', name: 'Free Trial', pages: 1, price: '৳0' },
    { id: 'starter', name: 'Starter Growth', pages: 3, price: '৳1,499' },
    { id: 'business', name: 'Business Pro', pages: 10, price: '৳3,999' },
    { id: 'agency', name: 'Agency Enterprise', pages: 9999, price: '৳9,999' },
  ];

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setSuccessMsg(`A password reset link has been dispatched to ${email}. Please check your inbox or spam folder.`);
      } else {
        setSuccessMsg(`Password reset link dispatched to ${email} (Demo mode).`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Password and Confirm Password do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      /* Local demo fallback */
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          id: 'demo-user-12345',
          email: email || 'demo@socialsaas.com',
          user_metadata: { name: fullName || 'Demo Entrepreneur', plan_tier: selectedPlan }
        });
        onClose();
      }, 500);
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              plan_tier: selectedPlan
            }
          }
        });
        if (error) throw error;

        /* Auto sync into public.user_profiles */
        const maxPages = selectedPlan === 'starter' ? 3 : selectedPlan === 'business' ? 10 : selectedPlan === 'agency' ? 9999 : 1;
        if (data.user) {
          try {
            await supabase.from('user_profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName.trim(),
              role: 'user',
              plan_tier: selectedPlan,
              max_pages: maxPages,
              status: 'active',
              updated_at: new Date().toISOString()
            });
          } catch (profileErr) {
            console.warn('Profile sync fallback notice:', profileErr);
          }
        }

        setSuccessMsg('Account created successfully!');
        if (data.session) {
          onAuthSuccess(data.user);
          onClose();
        } else {
          setSuccessMsg('Account created! Please check your email to verify your address or sign in below.');
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'signup' 
              ? 'Create Your Account' 
              : mode === 'forgot' 
                ? 'Reset Your Password' 
                : 'Welcome Back'}
          </h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            {mode === 'signup'
              ? 'Start automating your social inquiries and leads in minutes'
              : mode === 'forgot'
                ? 'Enter your account email to receive a password recovery link'
                : 'Log in to manage your connected pages and AI sales bot'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Dispatch Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full flex items-center justify-center space-x-1.5 text-xs text-slate-400 hover:text-white pt-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        ) : (
          /* LOGIN OR SIGNUP FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs transition"
                    />
                  </div>
                </div>

                {/* Selected Plan Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                    <span>Initial Subscription Tier</span>
                    <span className="text-indigo-400 font-bold capitalize">
                      {planOptions.find(p => p.id === selectedPlan)?.name || 'Free Trial'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {planOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedPlan(opt.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          selectedPlan === opt.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{opt.name}</span>
                          <Crown className={`w-3.5 h-3.5 ${selectedPlan === opt.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {opt.price} • {opt.pages >= 999 ? 'Unlimited' : `${opt.pages} page${opt.pages > 1 ? 's' : ''}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs transition"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Footer Mode Switcher */}
        {mode !== 'forgot' && (
          <div className="mt-6 text-center text-xs text-slate-400">
            {mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold transition ml-1"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold transition ml-1"
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
