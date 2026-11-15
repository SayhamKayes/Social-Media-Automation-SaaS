import React, { useState } from 'react';
import { 
  UserCog, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Check, 
  X, 
  Lock, 
  Mail, 
  Key, 
  Shield, 
  Sliders, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const INITIAL_STAFF = [
  {
    id: 'staff_1',
    name: 'Sayham Kayes',
    email: 'sayhamkayes101@gmail.com',
    role: 'super_admin',
    status: 'active',
    modules: ['overview', 'users', 'packages', 'pages', 'orders', 'settings', 'staff', 'smtp'],
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'staff_2',
    name: 'Rafiqul Islam',
    email: 'support.lead@socialsaas.com',
    role: 'support_agent',
    status: 'active',
    modules: ['overview', 'users', 'pages', 'orders'],
    created_at: new Date(Date.now() - 12 * 86400000).toISOString()
  }
];

export default function StaffAccessManager() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    modules: ['overview', 'users', 'pages', 'orders']
  });

  const availableModules = [
    { id: 'overview', name: 'Master Overview' },
    { id: 'users', name: 'User Management (CRM)' },
    { id: 'packages', name: 'Subscription Tiers' },
    { id: 'pages', name: 'Connected Pages' },
    { id: 'orders', name: 'Global Orders & Leads' },
    { id: 'settings', name: 'Master APIs & Gateway' },
    { id: 'smtp', name: 'Email SMTP Mailer' }
  ];

  const handleToggleModule = (modId) => {
    setFormData(prev => {
      const exists = prev.modules.includes(modId);
      return {
        ...prev,
        modules: exists ? prev.modules.filter(m => m !== modId) : [...prev.modules, modId]
      };
    });
  };

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    const newStaff = {
      id: `staff_${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      status: 'active',
      modules: [...formData.modules],
      created_at: new Date().toISOString()
    };

    setStaffList(prev => [newStaff, ...prev]);
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      modules: ['overview', 'users', 'pages', 'orders']
    });

    setToast(`Staff account created for ${newStaff.email}`);
    setTimeout(() => setToast(''), 3500);
  };

  const handleToggleStatus = (staffId) => {
    setStaffList(prev =>
      prev.map(s => {
        if (s.id === staffId && s.role !== 'super_admin') {
          return { ...s, status: s.status === 'active' ? 'suspended' : 'active' };
        }
        return s;
      })
    );
  };

  const handleDeleteStaff = (staffId) => {
    setStaffList(prev => prev.filter(s => s.id !== staffId));
    setToast('Staff account removed from access registry');
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-200 text-xs shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Staff Access Control &amp; RBAC</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Role-Based Access
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provision administrative accounts and grant granular module access for your operations, sales, and support team.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Administrative Staff ({staffList.length})
          </h3>
          <span className="text-[11px] text-slate-500">Super Admin retains full system control</span>
        </div>

        <div className="divide-y divide-slate-800">
          {staffList.map((staff) => (
            <div key={staff.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/50 transition">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-white">{staff.name}</span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                    staff.role === 'super_admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {staff.role.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    staff.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {staff.status}
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
                  {staff.modules.map(mod => (
                    <span key={mod} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-purple-300 font-medium capitalize">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {staff.role !== 'super_admin' && (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(staff.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                  >
                    {staff.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                    title="Remove Staff Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
                <h3 className="text-base font-bold text-white">Create Staff Member</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Member Name</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="staff@socialsaas.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="admin">Admin (Operational Oversight)</option>
                  <option value="support_agent">Support Agent (Pages &amp; Orders Only)</option>
                  <option value="billing_manager">Billing &amp; Packages Manager</option>
                </select>
              </div>

              {/* Module Permissions Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Module Permissions Checklist
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
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
                          className="rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-900"
                        />
                        <span>{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

