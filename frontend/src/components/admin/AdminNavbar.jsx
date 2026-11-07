import React from 'react';
import { Bot, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';

export default function AdminNavbar({ user, onLogout, onGoToLanding }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <button onClick={onGoToLanding} className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight text-lg">
            AutoReply <span className="text-indigo-400">Dashboard</span>
          </span>
        </button>
        <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium ml-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>RLS Protected</span>
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-white">{user?.email || 'user@example.com'}</p>
          <p className="text-[10px] text-slate-400 font-mono">Tenant ID: {user?.id?.slice(0, 8)}...</p>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          title="Log Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
}

