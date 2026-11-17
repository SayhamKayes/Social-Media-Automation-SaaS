import React from 'react';
import { 
  Users, 
  Share2, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Server, 
  ShieldCheck, 
  Activity,
  ArrowUpRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const PLAN_DEFAULT_QUOTAS = {
  free: { tokenLimit: 50000, messageLimit: 5000, postLimit: 5 },
  starter: { tokenLimit: 500000, messageLimit: 50000, postLimit: 20 },
  business: { tokenLimit: 2500000, messageLimit: 250000, postLimit: 60 },
  agency: { tokenLimit: 10000000, messageLimit: 10000000, postLimit: 99999 }
};

export default function OverviewMetrics({ 
  users = [], 
  pages = [], 
  orders = [],
  transactions = [],
  settings = {},
  onNavigateTab
}) {
  const getQuotaForUser = (user) => {
    const base = PLAN_DEFAULT_QUOTAS[String(user?.plan_tier || 'free').toLowerCase()] || PLAN_DEFAULT_QUOTAS.free;
    let parsed = null;
    const raw = settings?.[`quota_usage_${user?.id}`];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    const tokenLimit = parsed?.customTokenLimit ? Number(parsed.customTokenLimit) : base.tokenLimit;
    const messageLimit = parsed?.customMessageLimit ? Number(parsed.customMessageLimit) : base.messageLimit;
    const tokensUsed = Number(parsed?.tokensUsed) || 0;
    const messagesUsed = Number(parsed?.messagesUsed) || 0;
    const postsUsed = Number(parsed?.postsUsed) || 0;
    return {
      tokensUsed,
      tokenLimit,
      tokensRemaining: Math.max(0, tokenLimit - tokensUsed),
      messagesUsed,
      messageLimit,
      postsUsed
    };
  };

  const totalPlatformTokensUsed = users.reduce((acc, u) => acc + getQuotaForUser(u).tokensUsed, 0);
  const totalPlatformMessagesUsed = users.reduce((acc, u) => acc + getQuotaForUser(u).messagesUsed, 0);
  const isVerifiedTxn = (status = '') => {
    const s = String(status).toUpperCase();
    return s === 'CONFIRMED' || s === 'CONFIRMED_DELIVERED' || s === 'PAID';
  };

  const verifiedTransactions = transactions.filter(t => isVerifiedTxn(t.status));
  const pendingTransactions = transactions.filter(t => String(t.status || 'PENDING').toUpperCase() === 'PENDING');

  /* Verified Package Revenue from payment_transactions */
  const verifiedPackageRevenue = verifiedTransactions.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );

  /* Customer Chatbot Orders Revenue (excluding duplicate SUB- orders already in transactions) */
  const txnOrderIds = new Set(transactions.map(t => t.order_id).filter(Boolean));
  const nonDuplicateOrdersRevenue = orders
    .filter(o => {
      if (txnOrderIds.has(o.order_id)) return false;
      const st = String(o.order_status || 'Confirmed').toLowerCase();
      return !st.includes('pending') && !st.includes('rejected') && !st.includes('refund');
    })
    .reduce((acc, curr) => acc + (Number(curr.total_amount_bdt) || 0), 0);

  const totalRevenueBDT = verifiedPackageRevenue + nonDuplicateOrdersRevenue;

  /* Total Leads & Orders = all orders + any tenant signups not yet in orders */
  const orderUserIds = new Set(orders.map(o => o.user_id).filter(Boolean));
  const extraTenantLeads = users.filter(u => !orderUserIds.has(u.id)).length;
  const totalLeadsAndOrdersCount = orders.length + extraTenantLeads;

  const activePages = pages.filter(p => p.is_active !== false).length;

  const cards = [
    {
      title: 'Total Registered Tenants',
      value: users.length,
      detail: `${users.filter(u => u.status === 'active').length} active accounts`,
      icon: Users,
      color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-blue-400',
      action: () => onNavigateTab('users')
    },
    {
      title: 'Connected Apps',
      value: pages.length,
      detail: `${activePages} active social channels`,
      icon: Share2,
      color: 'from-purple-600/20 to-pink-600/20 border-purple-500/30 text-purple-400',
      action: () => onNavigateTab('pages')
    },
    {
      title: 'Total Platform Leads & Orders',
      value: totalLeadsAndOrdersCount,
      detail: `${transactions.length} package orders • ${orders.length} leads`,
      icon: ShoppingBag,
      color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
      action: () => onNavigateTab('orders')
    },
    {
      title: 'Gross Platform Sales',
      value: `৳${totalRevenueBDT.toLocaleString()}`,
      detail: pendingTransactions.length > 0
        ? `${pendingTransactions.length} pending verification • ${verifiedTransactions.length} verified`
        : `${verifiedTransactions.length} verified package sales`,
      icon: DollarSign,
      color: 'from-amber-600/20 to-orange-600/20 border-amber-500/30 text-amber-400',
      action: () => onNavigateTab('payment_ledger')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Platform Overview</h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics, tenant health, and conversational commerce performance across all accounts.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={c.action}
              className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} border cursor-pointer hover:scale-[1.01] transition shadow-lg shadow-black/20`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">{c.title}</span>
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <p className="text-2xl font-black text-white mt-3 tracking-tight">{c.value}</p>
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                <span>{c.detail}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Infrastructure Health Status */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">System Infrastructure & Services</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">n8n Orchestration Engine</p>
              <p className="text-[11px] text-slate-400">Port 5678 (Ngrok / VPS Tunnel)</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Supabase PostgreSQL</p>
              <p className="text-[11px] text-slate-400">Seoul Pooler (Port 6543)</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Google Gemini 3.6 Flash</p>
              <p className="text-[11px] text-slate-400">
                {totalPlatformTokensUsed.toLocaleString()} Tokens Used • {totalPlatformMessagesUsed.toLocaleString()} Messages
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Live Per-User AI Token & Credit Usage Summary */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Live User AI Token &amp; Credit Consumption</h3>
          </div>
          <button
            onClick={() => onNavigateTab('users')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Manage All Users &amp; Top-Up &rarr;
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No users found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.slice(0, 6).map((u) => {
              const q = getQuotaForUser(u);
              const pct = Math.min(100, Math.round((q.tokensUsed / q.tokenLimit) * 100));
              const isExhausted = q.tokensUsed >= q.tokenLimit;
              return (
                <div
                  key={u.id}
                  onClick={() => onNavigateTab('users')}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{u.email}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[9px] font-bold uppercase shrink-0">
                      {u.plan_tier || 'free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-300">Used: {q.tokensUsed.toLocaleString()}</span>
                    <span className={isExhausted ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {q.tokensRemaining.toLocaleString()} left
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isExhausted ? 'bg-rose-500' : 'bg-purple-500'}`}
                      style={{ width: `${Math.max(3, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Msg: {q.messagesUsed.toLocaleString()} / {q.messageLimit.toLocaleString()}</span>
                    <span>Posts: {q.postsUsed.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Recent Tenants ({users.length})</span>
            </h3>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              View All
            </button>
          </div>

          {users.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No tenants registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{u.email}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {u.id ? `${u.id.slice(0, 10)}...` : 'N/A'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 uppercase text-[10px] font-bold">
                      {u.plan_tier || 'free'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Captured Orders */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Recent Live Orders ({orders.length})</span>
            </h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              View All
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {orders.slice(0, 5).map((o, idx) => (
                <div key={o.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{o.customer_name || 'Customer'}</p>
                    <p className="text-[10px] text-slate-400">{o.selected_package || 'Inquiry'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">
                      {o.total_amount_bdt ? `৳${Number(o.total_amount_bdt).toLocaleString()}` : 'Lead'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {o.phone_number || 'Messenger'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

