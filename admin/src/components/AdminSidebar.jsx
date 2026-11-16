import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Share2, 
  ShoppingBag, 
  KeyRound, 
  ShieldAlert,
  UserCog,
  MailCheck,
  CreditCard,
  FileCheck2,
  Bot
} from 'lucide-react';

export default function AdminSidebar({ activeTab, onSelectTab, unreadTabs = {}, pendingPaymentsCount = 0 }) {
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'pages', name: 'Connected Apps', icon: Share2 },
    { id: 'ai_agents', name: 'AI Agents', icon: Bot },
    { id: 'orders', name: 'Global Orders & Leads', icon: ShoppingBag },
    { id: 'payment_ledger', name: 'Payment Verification', icon: FileCheck2, countBadge: pendingPaymentsCount },
    { id: 'payment_gateway', name: 'Payment Gateway & MFS', icon: CreditCard },
    { id: 'settings', name: 'Master APIs & Gateway', icon: KeyRound },
    { id: 'staff', name: 'Staff Access Control', icon: UserCog },
    { id: 'smtp', name: 'Admin Profile & SMTP', icon: MailCheck },
    { id: 'packages', name: 'Subscription Tiers', icon: Package },
  ];

  return (
    <aside className="w-64 border-r border-purple-900/30 bg-slate-950 p-4 shrink-0 flex flex-col justify-between hidden md:flex h-full select-none">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-400/80 mb-2">
            Master Controls
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const hasUnread = Boolean(unreadTabs[item.id]) && !isActive;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {item.countBadge > 0 && !isActive && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.countBadge}
                      </span>
                    )}
                    {hasUnread && (
                      <span 
                        className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400 animate-pulse" 
                        title="New unread activity"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Fixed Bottom Security Notice */}
      <div className="pt-3 border-t border-slate-900 shrink-0">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Super Admin privileges active. Realtime database sync enabled.</span>
        </div>
      </div>
    </aside>
  );
}
