import React, { useState } from 'react';
import { X, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!isSupabaseConfigured()) {
      // Demo bypass when Supabase keys are not yet pasted
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          id: 'demo-user-12345',
          email: email || 'demo@socialsaas.com',
          user_metadata: { name: 'Demo Entrepreneur' }
        });
        onClose();
      }, 500);
      return;
    }

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setSuccessMsg('Account created successfully! Check your email or log in.');
        if (data.session) {
          onAuthSuccess(data.user);
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white">
            {mode === 'signup' ? 'Create an Account' : 'Welcome Back'}
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'signup'
              ? 'Start automating your social sales in minutes'
              : 'Log in to manage your connected pages'}
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong>Demo Mode Active:</strong> Add your Supabase keys in <code className="bg-amber-950/40 px-1 py-0.5 rounded">frontend/.env</code> for live persistence. Any email/password will log you in now.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                Sign Up
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

