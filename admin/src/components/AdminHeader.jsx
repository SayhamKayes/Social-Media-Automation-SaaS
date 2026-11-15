import React from 'react';
import { 
  ShieldCheck, 
  Crown, 
  LogOut, 
  Activity, 
  ExternalLink,
  Layers
} from 'lucide-react';

export default function AdminHeader({ adminUser, onLogout }) {
  return (
    <header className="h-16 border-b border-purple-900/30 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between select-none">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
          <Crown className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">AutoReply Master Console</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Super Admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Enterprise Multi-Tenant Infrastructure Manager
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Engine Status Clean Indicator */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Status: Online</span>
        </div>

        {/* Client Portal Clean Link */}
        <a 
          href="http://localhost:3000" 
          target="_blank" 
          rel="noreferrer" 
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Client Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>

        {adminUser && (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white leading-tight">
                {adminUser.full_name || 'Sayham Kayes'}
              </span>
              <span className="block text-[10px] text-purple-300 font-medium">
                {adminUser.email}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-purple-900/30 text-slate-400 hover:text-purple-300 border border-slate-800 transition"
              title="Admin Session Access"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
