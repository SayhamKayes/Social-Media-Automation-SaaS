import React from 'react';
import { 
  LayoutDashboard, 
  Share2, 
  KeyRound, 
  Bot, 
  ShoppingBag, 
  MessageSquareCode, 
  LifeBuoy 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, ordersCount = 0 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'social-media', label: 'Social Media', icon: Share2 },
    { id: 'api-integrations', label: 'Social Media APIs', icon: KeyRound },
    { id: 'ai-config', label: 'AI Agent & Prompts', icon: Bot },
    { id: 'orders', label: 'Orders & Leads', icon: ShoppingBag, badge: ordersCount > 0 ? ordersCount : null },
    { id: 'simulator', label: 'Chat Simulator', icon: MessageSquareCode },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <p className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Management
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-900">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold mb-1">
            <LifeBuoy className="w-4 h-4" />
            <span>Need Help?</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Configure your accounts in Social Media and grab webhook endpoints from Social Media APIs.
          </p>
        </div>
      </div>
    </aside>
  );
}
