import React, { useState, useEffect } from 'react';
import { Bot, Save, FileSpreadsheet, Sparkles, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

export default function AIAgentConfig({ pages = [], onUpdatePageConfig }) {
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.page_id || '');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [productsSheetId, setProductsSheetId] = useState('');
  const [faqSheetId, setFaqSheetId] = useState('');
  const [ordersSheetId, setOrdersSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Update form fields when selected page changes
  useEffect(() => {
    if (!selectedPageId && pages.length > 0) {
      setSelectedPageId(pages[0].page_id);
    }
    const currentPage = pages.find(p => p.page_id === selectedPageId);
    if (currentPage) {
      setSystemPrompt(currentPage.system_prompt || defaultAgencyPrompt);
      setKnowledgeBase(currentPage.knowledge_base || defaultKnowledge);
      setProductsSheetId(currentPage.products_sheet_id || '15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM');
      setFaqSheetId(currentPage.faq_sheet_id || '15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM');
      setOrdersSheetId(currentPage.orders_sheet_id || '15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM');
    }
  }, [selectedPageId, pages]);

  const defaultAgencyPrompt = `You are an expert, highly polite, and persuasive Senior Sales Consultant. Your primary goal is to guide clients smoothly, recommend suitable packages, answer questions, and secure orders via Messenger chat.

# Communication Tone & Style
- Polite, welcoming, helpful, and professional (match the user's language: Bengali / Banglish / English).
- Sound like a human sales expert, not a rigid robot.
- Keep messages clean, concise, and easy to read on mobile.
- Strictly summarize customer Name, Phone, and Package for confirmation before finalizing orders.`;

  const defaultKnowledge = `# Business Policies & FAQ
- Working Hours: 10:00 AM - 10:00 PM (Everyday)
- Payment Methods: bKash, Nagad, Bank Transfer, Visa/Mastercard
- Delivery/Onboarding Timeline: 3-5 business days for Standard Packages.
- Revision Policy: Up to 3 free revisions included with every base package.`;

  const handleApplyTemplate = (type) => {
    if (type === 'agency') {
      setSystemPrompt(defaultAgencyPrompt);
    } else if (type === 'ecommerce') {
      setSystemPrompt(`You are a friendly and enthusiastic Customer Sales Assistant for an online retail store. Help customers find products, check stock sizes/colors, calculate total delivery costs, and take delivery address and phone number for cash-on-delivery orders. Always confirm customer order details before finalizing.`);
    } else if (type === 'support') {
      setSystemPrompt(`You are a calm, highly empathetic 24/7 Customer Support Specialist. Your mission is to solve customer technical issues, answer FAQs clearly, and escalate urgent problems to our human team when requested.`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPageId) {
      setErrorMsg('Please select a Facebook page first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onUpdatePageConfig(selectedPageId, {
        system_prompt: systemPrompt,
        knowledge_base: knowledgeBase,
        products_sheet_id: productsSheetId,
        faq_sheet_id: faqSheetId,
        orders_sheet_id: ordersSheetId
      });
      setSuccessMsg('AI Agent instructions and Knowledge Base saved successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
        <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Connected Pages</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please connect at least one Facebook page before configuring AI prompts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Agent & Knowledge Config</h2>
        <p className="text-sm text-slate-400 mt-1">
          Customize the personality, sales rules, and knowledge base for your AI sales consultant.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Page Selector */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Select Business Page to Configure
            </label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {pages.map((p) => (
                <option key={p.page_id} value={p.page_id}>
                  {p.page_name} (ID: {p.page_id})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Preset Prompts:</span>
            <button
              type="button"
              onClick={() => handleApplyTemplate('agency')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
            >
              Agency Sales
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('ecommerce')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
            >
              E-Commerce
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('support')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
            >
              Support Rep
            </button>
          </div>
        </div>

        {/* System Prompt */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>AI System Prompt & Sales Guidelines</span>
          </div>
          <p className="text-xs text-slate-400">
            Define your consultant's personality, greeting style, language, and order confirmation workflow.
          </p>
          <textarea
            rows={8}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition leading-relaxed"
          />
        </div>

        {/* Knowledge Base */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Knowledge Base (FAQs, Policies, Business Details)</span>
          </div>
          <p className="text-xs text-slate-400">
            Enter FAQs, payment options, and return policies. The AI will strictly reference this information when answering customer questions.
          </p>
          <textarea
            rows={5}
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Google Sheets Sync IDs */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Google Sheets Integration (Optional)</span>
          </div>
          <p className="text-xs text-slate-400">
            Provide Google Sheet IDs if you prefer reading live product pricing or appending orders to Google Sheets.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Products Sheet ID
              </label>
              <input
                type="text"
                value={productsSheetId}
                onChange={(e) => setProductsSheetId(e.target.value)}
                placeholder="15YQgYbQ7DDMGE..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                FAQ Sheet ID
              </label>
              <input
                type="text"
                value={faqSheetId}
                onChange={(e) => setFaqSheetId(e.target.value)}
                placeholder="15YQgYbQ7DDMGE..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Orders Sheet ID
              </label>
              <input
                type="text"
                value={ordersSheetId}
                onChange={(e) => setOrdersSheetId(e.target.value)}
                placeholder="15YQgYbQ7DDMGE..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

