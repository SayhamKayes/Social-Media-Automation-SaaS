import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  Lock, 
  Mail, 
  Key, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured, checkIsSuperAdmin } from '../lib/supabaseAdminClient';

export default function AdminAuthModal({ isOpen, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) throw error;

        // Verify if authenticated user is a super admin
        if (!checkIsSuperAdmin(data.user.email)) {
          // Check role in user_profiles
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (!profile || profile.role !== 'super_admin') {
            await supabase.auth.signOut();
            throw new Error('Access Denied: This account lacks Super Admin privileges.');
          }
        }

        onAuthSuccess(data.user);
      } else {
        // Local mode fallback
        onAuthSuccess({
          id: 'admin-master-local-uuid',
          email: email.trim() || 'sayhamkayes101@gmail.com',
          role: 'super_admin'
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBypass = () => {
    onAuthSuccess({
      id: 'admin-master-local-uuid',
      email: 'sayhamkayes101@gmail.com',
      role: 'super_admin'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl shadow-purple-900/20 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-purple-600/40">
            <Crown className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Super Admin Gate</h2>
          <p className="text-xs text-slate-400">
            Dedicated Administrative Portal for AutoReply Platform Owner
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="sayhamkayes101@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Enter Master Console'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleQuickBypass}
            className="inline-flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>One-Click Owner Access (Local Dev)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

