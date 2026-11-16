import React, { useState } from 'react';
import { 
  Package, 
  Check, 
  Users, 
  Sparkles, 
  Crown, 
  Layers, 
  Flame, 
  Bot,
  Zap,
  Edit3,
  X,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function PackagesManager({ 
  packages = [], 
  users = [],
  onUpdatePackage 
}) {
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    badge: '',
    price_bdt: '',
    price_usd: '',
    period: '/ mo',
    pages_allowed: 1,
    description: '',
    features: [],
    is_popular: false
  });
  const [newFeatureText, setNewFeatureText] = useState('');

  const handleOpenEdit = (tier) => {
    setEditingTier(tier.id);
    setFormData({
      id: tier.id,
      name: tier.name,
      badge: tier.badge || 'Standard',
      price_bdt: tier.price_bdt,
      price_usd: tier.price_usd,
      period: tier.period || '/ mo',
      pages_allowed: tier.pages_allowed,
      description: tier.description || '',
      features: Array.isArray(tier.features) ? [...tier.features] : [],
      is_popular: Boolean(tier.is_popular)
    });
    setNewFeatureText('');
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, newFeatureText.trim()]
    }));
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index)
    }));
  };

  const handleFeatureChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.features];
      updated[index] = value;
      return { ...prev, features: updated };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (onUpdatePackage) {
      onUpdatePackage(formData);
    }
    setEditingTier(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Subscription Packages &amp; Tier Rules</h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
              Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-tenant tier limits, connected page quotas, and pricing structures. Changes synchronize live to the Public Landing Page.
          </p>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((tier) => {
          const userCount = users.filter((u) => u.plan_tier === tier.id).length;
          const isUnlimited = Number(tier.pages_allowed) >= 999;
          const displayPages = isUnlimited ? 'Unlimited' : tier.pages_allowed;

          let badgeStyling = 'bg-slate-800 text-slate-300';
          if (tier.id === 'starter') badgeStyling = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
          if (tier.id === 'business') badgeStyling = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
          if (tier.id === 'agency') badgeStyling = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';

          return (
            <div
              key={tier.id}
              className={`p-5 rounded-2xl bg-slate-900 border flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition shadow-lg shadow-black/20 relative group ${
                tier.is_popular ? 'border-purple-500/60 ring-1 ring-purple-500/30' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${badgeStyling}`}>
                    {tier.badge || 'Standard'}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>{userCount} Subscribers</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white flex items-center justify-between">
                    <span>{tier.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-black text-white">{tier.price_bdt}</span>
                    <span className="text-xs text-slate-400 font-medium">{tier.period}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Included Features
                  </p>
                  <ul className="space-y-1.5">
                    {Array.isArray(tier.features) && tier.features.map((f, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenEdit(tier)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-xs font-semibold transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Package &amp; Features</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Subscription Tier</h3>
                  <p className="text-xs text-slate-400">ID: {formData.id} (Database key)</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTier(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Package Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Popular, Master Tier"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price BDT</label>
                  <input
                    type="text"
                    value={formData.price_bdt}
                    onChange={(e) => setFormData({ ...formData, price_bdt: e.target.value })}
                    required
                    placeholder="৳1,499"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price USD (Optional)</label>
                  <input
                    type="text"
                    value={formData.price_usd}
                    onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                    placeholder="Optional (e.g. $15)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Period</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="/ mo or forever"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Allowed Pages Quota
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={formData.pages_allowed}
                    onChange={(e) => setFormData({ ...formData, pages_allowed: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Use 9999 for unlimited pages.
                  </span>
                </div>
                <div className="flex items-center space-x-3 pt-5">
                  <input
                    type="checkbox"
                    id="is_popular"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-800 bg-slate-950"
                  />
                  <label htmlFor="is_popular" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Highlight as Most Popular
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Features List Manager */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Included Features ({formData.features.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {formData.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new feature input */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    placeholder="Type new feature and press Add..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs font-medium transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
