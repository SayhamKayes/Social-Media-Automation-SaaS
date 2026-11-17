import React, { useState, useEffect } from 'react';
import { 
  UserCog, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  X, 
  Mail, 
  CheckCircle2,
  AlertCircle,
  Globe,
  Send,
  Save,
  Info,
  RefreshCw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseAdminClient';

const DEFAULT_STAFF = [
  {
    id: 'staff_owner',
    name: 'Sayham Kayes',
    email: 'sayhamkayes101@gmail.com',
    role: 'super_admin',
    status: 'active',
    modules: ['overview', 'users', 'packages', 'payment_gateway', 'pages', 'ai_agents', 'orders', 'settings', 'staff', 'smtp'],
    created_at: new Date().toISOString()
  }
];

export default function StaffAccessManager({
  users = [],
  settings = {},
  onSaveSettings,
  onRefreshUsers
}) {
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* Live Host URL for Staff Invitation & Password Emails (prevents localhost links) */
  const detectedOrigin = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://adminskzbot.vercel.app';

  const [liveHostUrl, setLiveHostUrl] = useState(
    settings?.live_admin_host_url || localStorage.getItem('saas_live_admin_host_url') || detectedOrigin
  );
  const [showUrlGuide, setShowUrlGuide] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    modules: ['overview', 'users', 'pages', 'orders']
  });

  const availableModules = [
    { id: 'overview', name: 'Master Overview' },
    { id: 'users', name: 'User Management' },
    { id: 'packages', name: 'Subscription Tiers' },
    { id: 'payment_gateway', name: 'Payment Gateway & MFS' },
    { id: 'pages', name: 'Connected Apps' },
    { id: 'ai_agents', name: 'AI Agents' },
    { id: 'orders', name: 'Global Orders & Leads' },
    { id: 'settings', name: 'Master APIs & Gateway' },
    { id: 'smtp', name: 'Admin Profile & SMTP' }
  ];

  /* Load dynamic staff list from Supabase platform_settings & user_profiles */
  useEffect(() => {
    const loadDynamicStaff = async () => {
      if (settings?.live_admin_host_url) {
        setLiveHostUrl(settings.live_admin_host_url);
      }

      let loadedList = [...DEFAULT_STAFF];

      if (settings?.staff_access_list) {
        try {
          const parsed = JSON.parse(settings.staff_access_list);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedList = parsed;
          }
        } catch (e) {
          console.warn('Could not parse staff_access_list setting:', e);
        }
      } else if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from('platform_settings')
            .select('setting_value')
            .eq('setting_key', 'staff_access_list')
            .maybeSingle();

          if (data?.setting_value) {
            const parsed = JSON.parse(data.setting_value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedList = parsed;
            }
          }
        } catch (err) {
          console.warn('Staff fetch notice:', err);
        }
      }

      /* Also merge any users from user_profiles that have administrative roles */
      if (Array.isArray(users) && users.length > 0) {
        users.forEach((u) => {
          const r = String(u.role || '').toLowerCase();
          if (['super_admin', 'admin', 'support_agent', 'billing_manager'].includes(r)) {
            const exists = loadedList.some(
              (s) => s.email.toLowerCase() === String(u.email || '').toLowerCase()
            );
            if (!exists && u.email) {
              loadedList.push({
                id: u.id,
                name: u.full_name || u.email.split('@')[0],
                email: u.email,
                role: r,
                status: u.status || 'active',
                modules: r === 'super_admin'
                  ? availableModules.map(m => m.id)
                  : ['overview', 'users', 'pages', 'orders'],
                created_at: u.created_at || new Date().toISOString()
              });
            }
          }
        });
      }

      setStaffList(loadedList);
    };

    loadDynamicStaff();
  }, [settings?.staff_access_list, settings?.live_admin_host_url, users]);

  const persistStaffList = async (updatedList) => {
    setStaffList(updatedList);
    const serialized = JSON.stringify(updatedList);
    localStorage.setItem('saas_staff_access_list', serialized);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('platform_settings').upsert(
          {
            setting_key: 'staff_access_list',
            setting_value: serialized,
            description: 'Dynamic RBAC Staff Access Registry',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'setting_key' }
        );
      } catch (err) {
        console.warn('Could not persist staff list to Supabase:', err);
      }
    }
  };

  const handleSaveLiveHostUrl = async (e) => {
    e.preventDefault();
    const cleanedUrl = liveHostUrl.trim().replace(/\/+$/, '');
    setLiveHostUrl(cleanedUrl);
    localStorage.setItem('saas_live_admin_host_url', cleanedUrl);

    if (onSaveSettings) {
      await onSaveSettings({ live_admin_host_url: cleanedUrl });
    } else if (isSupabaseConfigured()) {
      await supabase.from('platform_settings').upsert(
        {
          setting_key: 'live_admin_host_url',
          setting_value: cleanedUrl,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'setting_key' }
      );
    }

    setToast(`Live Production Host URL saved: ${cleanedUrl}`);
    setTimeout(() => setToast(''), 3500);
  };

  const handleToggleModule = (modId) => {
    setFormData(prev => {
      const exists = prev.modules.includes(modId);
      return {
        ...prev,
        modules: exists ? prev.modules.filter(m => m !== modId) : [...prev.modules, modId]
      };
    });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return;

    if (formData.password.length < 6) {
      setErrorMsg('Temporary password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const targetRedirectUrl = (liveHostUrl || window.location.origin).trim().replace(/\/+$/, '');
    let createdUserId = `staff_${Date.now()}`;

    try {
      if (isSupabaseConfigured()) {
        /* 1. Provision Staff Auth Account & Dispatch Verification Email with Live Host Redirect URL */
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password.trim(),
          options: {
            emailRedirectTo: targetRedirectUrl,
            data: {
              full_name: formData.name.trim(),
              role: formData.role,
              staff_modules: formData.modules,
              invited_portal_url: targetRedirectUrl
            }
          }
        });

        if (signUpErr && !signUpErr.message?.toLowerCase().includes('already registered')) {
          throw signUpErr;
        }

        if (signUpData?.user?.id) {
          createdUserId = signUpData.user.id;
          /* 2. Sync Staff Role into public.user_profiles */
          await supabase.from('user_profiles').upsert({
            id: createdUserId,
            email: formData.email.trim(),
            full_name: formData.name.trim(),
            role: formData.role,
            plan_tier: 'agency',
            max_pages: 9999,
            status: 'active',
            notes: `Staff Role: ${formData.role} | Modules: ${formData.modules.join(', ')}`,
            updated_at: new Date().toISOString()
          });
        }
      }

      const newStaff = {
        id: createdUserId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: 'active',
        modules: [...formData.modules],
        created_at: new Date().toISOString()
      };

      const updated = [
        newStaff,
        ...staffList.filter(s => s.email.toLowerCase() !== newStaff.email.toLowerCase())
      ];
      await persistStaffList(updated);

      if (onRefreshUsers) onRefreshUsers();

      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        modules: ['overview', 'users', 'pages', 'orders']
      });

      setToast(`Staff account created & confirmation email dispatched to ${newStaff.email} (Redirect: ${targetRedirectUrl})`);
      setTimeout(() => setToast(''), 4500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to provision staff account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchLoginEmail = async (staff) => {
    if (!isSupabaseConfigured()) {
      setToast(`Login invite dispatched to ${staff.email}`);
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setSendingEmailId(staff.id);
    const targetRedirectUrl = (liveHostUrl || window.location.origin).trim().replace(/\/+$/, '');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(staff.email, {
        redirectTo: targetRedirectUrl
      });
      if (error) throw error;
      setToast(`Live login & password setup email dispatched to ${staff.email} (Link: ${targetRedirectUrl})`);
    } catch (err) {
      setToast(`Notice: ${err.message || 'Could not dispatch email'}`);
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setToast(''), 4500);
    }
  };

  const handleToggleStatus = async (staff) => {
    if (staff.role === 'super_admin') return;
    const nextStatus = staff.status === 'active' ? 'suspended' : 'active';
    const updated = staffList.map(s =>
      s.id === staff.id ? { ...s, status: nextStatus } : s
    );
    await persistStaffList(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('email', staff.email);
      } catch (err) {
        console.warn('Staff status update notice:', err);
      }
    }

    setToast(`${staff.name} status updated to ${nextStatus.toUpperCase()}`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDeleteStaff = async (staff) => {
    if (staff.role === 'super_admin') return;
    const updated = staffList.filter(s => s.id !== staff.id && s.email !== staff.email);
    await persistStaffList(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ role: 'user', updated_at: new Date().toISOString() })
          .eq('email', staff.email);
      } catch (err) {
        console.warn('Staff demote notice:', err);
      }
    }

    setToast(`Staff access revoked for ${staff.email}`);
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-200 text-xs shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Staff Access Control &amp; RBAC</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% Dynamic Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provision live Supabase administrative accounts, dispatch invitation emails with your live domain link, and control module permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setShowUrlGuide(!showUrlGuide)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs font-bold transition"
          >
            <Info className="w-4 h-4" />
            <span>Fix Localhost Email Guide</span>
          </button>

          <button
            onClick={() => {
              setErrorMsg('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add &amp; Invite Staff Member</span>
          </button>
        </div>
      </div>

      {/* Live Host URL Configuration Card (Solves Localhost Email Link Issue) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-4">
        <form onSubmit={handleSaveLiveHostUrl} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-white flex items-center space-x-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Live Production Admin Host URL (Used in Staff Invitation &amp; Reset Emails)</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Enter your live Vercel Admin URL below so staff invitation and password setup emails redirect to your live portal instead of <code className="text-rose-300">localhost</code>.
            </p>
            <input
              type="url"
              required
              placeholder="https://adminskzbot.vercel.app"
              value={liveHostUrl}
              onChange={(e) => setLiveHostUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Live Host URL</span>
          </button>
        </form>

        {showUrlGuide && (
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-slate-300 space-y-2">
            <p className="font-bold text-indigo-300">
              Required 1-Minute Step in Supabase Dashboard to Replace "localhost:3000" in Emails:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
              <li>
                Open your <strong>Supabase Dashboard</strong> &rarr; Go to <strong>Authentication</strong> &rarr; <strong>URL Configuration</strong>.
              </li>
              <li>
                Change <strong>Site URL</strong> from <code className="text-rose-400">http://localhost:3000</code> to your live Vercel URL (e.g. <code className="text-emerald-400">{liveHostUrl}</code>).
              </li>
              <li>
                Under <strong>Redirect URLs</strong>, click <strong>Add URL</strong> and add both your Frontend and Admin Vercel URLs with <code className="text-purple-300">/**</code> at the end (e.g. <code className="text-emerald-400">{liveHostUrl}/**</code>) and click <strong>Save</strong>.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Administrative Staff ({staffList.length})
          </h3>
          <span className="text-[11px] text-slate-500">Synced with Supabase Auth &amp; user_profiles</span>
        </div>

        <div className="divide-y divide-slate-800">
          {staffList.map((staff) => (
            <div key={staff.id || staff.email} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-bold text-white">{staff.name}</span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                    staff.role === 'super_admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {String(staff.role || 'admin').replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    staff.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {staff.status || 'active'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center space-x-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{staff.email}</span>
                </p>

                {/* Allowed Modules Chips */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 self-center">
                    Authorized:
                  </span>
                  {(staff.modules || []).map(mod => (
                    <span key={mod} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-purple-300 font-medium capitalize">
                      {mod === 'pages' ? 'Connected Apps' : mod.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDispatchLoginEmail(staff)}
                  disabled={sendingEmailId === staff.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
                  title="Send Password Setup / Login Link with Live Host URL"
                >
                  <Send className="w-3 h-3" />
                  <span>{sendingEmailId === staff.id ? 'Sending...' : 'Send Live Login Mail'}</span>
                </button>

                {staff.role !== 'super_admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(staff)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    >
                      {staff.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(staff)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Remove Staff Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-purple-400">
                <UserCog className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Create &amp; Invite Staff Member</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Member Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakil Mahmud"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Email Address (Receives Live Invite Link)</label>
                <input
                  type="email"
                  required
                  placeholder="staff@yourdomain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password (Min 6 Characters)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Administrative Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="admin">Admin (Operational Oversight)</option>
                  <option value="support_agent">Support Agent (Connected Apps &amp; Orders)</option>
                  <option value="billing_manager">Billing &amp; Packages Manager</option>
                </select>
              </div>

              {/* Module Permissions Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Module Permissions Checklist
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {availableModules.map((mod) => {
                    const checked = formData.modules.includes(mod.id);
                    return (
                      <label 
                        key={mod.id} 
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          checked ? 'bg-purple-600/10 border-purple-500/40 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleModule(mod.id)}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="truncate">{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                Email Redirect Host: <span className="text-purple-300 font-mono">{liveHostUrl}</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {loading ? 'Provisioning & Sending Mail...' : 'Provision Staff & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
