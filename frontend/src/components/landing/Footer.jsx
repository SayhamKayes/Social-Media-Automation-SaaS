import React from 'react';
import { Bot } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-12 bg-slate-950 border-t border-slate-900 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            AutoReply <span className="text-indigo-400">AI</span>
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-400">
          &copy; {new Date().getFullYear()} AutoReply AI. Built for scalable social commerce automation.
        </p>

        <div className="flex space-x-6 text-xs sm:text-sm">
          <a href="#features" className="hover:text-slate-300 transition">Features</a>
          <a href="#how-it-works" className="hover:text-slate-300 transition">How it Works</a>
          <a href="#pricing" className="hover:text-slate-300 transition">Pricing</a>
        </div>
      </div>
    </footer>
  );
}

