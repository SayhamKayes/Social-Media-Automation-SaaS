import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Save,
  BookOpen,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Share2,
  Sparkles
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseAdminClient';

/* Native browser .docx and text document parser */
async function extractTextFromDocument(file) {
  const fileName = (file.name || '').toLowerCase();

  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
    return await file.text();
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let offset = 0;
  while (offset + 30 < bytes.length) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);

    const nameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLength);
    const entryName = new TextDecoder('utf-8').decode(nameBytes);
    const dataStart = offset + 30 + fileNameLength + extraFieldLength;

    if (entryName === 'word/document.xml') {
      let actualEnd = dataStart + compressedSize;
      if (compressedSize === 0) {
        let scan = dataStart;
        while (scan + 4 < bytes.length) {
          const sig = view.getUint32(scan, true);
          if (sig === 0x04034b50 || sig === 0x02014b50) break;
          scan += 1;
        }
        actualEnd = scan;
      }

      const entryData = bytes.subarray(dataStart, actualEnd);
      let xmlString = '';

      if (compressionMethod === 0) {
        xmlString = new TextDecoder('utf-8').decode(entryData);
      } else if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(entryData).catch(() => {});
        writer.close().catch(() => {});
        const response = new Response(ds.readable);
        const decompressedBuffer = await response.arrayBuffer();
        xmlString = new TextDecoder('utf-8').decode(decompressedBuffer);
      }

      if (xmlString) {
        return xmlString
          .replace(/<\/w:p>/g, '\n')
          .replace(/<w:br[^>]*\/>/g, '\n')
          .replace(/<w:tab[^>]*\/>/g, '\t')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }
      break;
    }

    offset = dataStart + (compressedSize > 0 ? compressedSize : 1);
  }

  const rawText = await file.text();
  return rawText.replace(/[^\x09\x0A\x0D\x20-\x7E\u0980-\u09FF]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

const DEFAULT_MASTER_PROMPT = `You are an expert, highly polite, and persuasive Senior Sales Consultant. Your primary goal is to guide clients smoothly, recommend suitable packages, answer questions, and secure orders via Messenger chat.

# Communication Tone & Style
- Polite, welcoming, helpful, and professional (match the user's language: Bengali / Banglish / English).
- Sound like a human sales expert, not a rigid robot.
- Keep messages clean, concise, and easy to read on mobile.
- Strictly summarize customer Name, Phone, and Package for confirmation before finalizing orders.`;

const DEFAULT_MASTER_KNOWLEDGE = `# Business Policies & FAQ
- Working Hours: 10:00 AM - 10:00 PM (Everyday)
- Payment Methods: bKash, Nagad, Rocket, Bank Transfer, Visa/Mastercard
- Delivery/Onboarding Timeline: 3-5 business days for Standard Packages.
- Revision Policy: Up to 3 free revisions included with every base package.`;

export default function AdminAIAgentsManager({
  pages = [],
  users = [],
  settings = {},
  onSaveSettings,
  onSyncPagesPrompt
}) {
  const [targetScope, setTargetScope] = useState('ALL_MASTER');
  const [systemPrompt, setSystemPrompt] = useState(
    settings?.master_ai_system_prompt || DEFAULT_MASTER_PROMPT
  );
  const [knowledgeBase, setKnowledgeBase] = useState(
    settings?.master_ai_knowledge_base || DEFAULT_MASTER_KNOWLEDGE
  );
  const [saving, setSaving] = useState(false);
  const [syncingPageId, setSyncingPageId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const promptFileRef = useRef(null);
  const knowledgeFileRef = useRef(null);
  const [uploadedPromptDocName, setUploadedPromptDocName] = useState('');
  const [uploadedKnowledgeDocName, setUploadedKnowledgeDocName] = useState('');

  useEffect(() => {
    if (targetScope === 'ALL_MASTER') {
      setSystemPrompt(settings?.master_ai_system_prompt || DEFAULT_MASTER_PROMPT);
      setKnowledgeBase(settings?.master_ai_knowledge_base || DEFAULT_MASTER_KNOWLEDGE);
    } else {
      const selected = pages.find(p => p.page_id === targetScope);
      if (selected) {
        setSystemPrompt(selected.system_prompt || settings?.master_ai_system_prompt || DEFAULT_MASTER_PROMPT);
        setKnowledgeBase(selected.knowledge_base || settings?.master_ai_knowledge_base || DEFAULT_MASTER_KNOWLEDGE);
      }
    }
  }, [targetScope, settings?.master_ai_system_prompt, settings?.master_ai_knowledge_base, pages]);

  const handleApplyTemplate = (type) => {
    if (type === 'agency') {
      setSystemPrompt(DEFAULT_MASTER_PROMPT);
    } else if (type === 'ecommerce') {
      setSystemPrompt(
        'You are a friendly and enthusiastic Customer Sales Assistant for an online retail store. Help customers find products, check stock sizes/colors, calculate total delivery costs, and take delivery address and phone number for cash-on-delivery orders. Always confirm customer order details before finalizing.'
      );
    } else if (type === 'support') {
      setSystemPrompt(
        'You are a calm, highly empathetic 24/7 Customer Support Specialist. Your mission is to solve customer technical issues, answer FAQs clearly, and escalate urgent problems to our human team when requested.'
      );
    }
  };

  const handleDocumentUpload = async (e, targetBox) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const extractedText = await extractTextFromDocument(file);
      if (!extractedText) {
        setErrorMsg(`Could not extract readable text from "${file.name}". Please ensure it is a valid .docx or .txt file.`);
        return;
      }

      if (targetBox === 'prompt') {
        setSystemPrompt(extractedText);
        setUploadedPromptDocName(file.name);
        setSuccessMsg(`Loaded content from "${file.name}" into AI System Prompt box!`);
      } else {
        setKnowledgeBase(extractedText);
        setUploadedKnowledgeDocName(file.name);
        setSuccessMsg(`Loaded content from "${file.name}" into Knowledge Base box!`);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Failed to read document file: ' + (err.message || 'Invalid format'));
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveAndSyncAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (targetScope === 'ALL_MASTER') {
        /* 1. Persist Master Prompt & Knowledge Base in platform_settings for future pages */
        if (onSaveSettings) {
          await onSaveSettings({
            master_ai_system_prompt: systemPrompt,
            master_ai_knowledge_base: knowledgeBase
          });
        }

        /* 2. Sync to ALL connected business pages in business_pages table */
        if (onSyncPagesPrompt) {
          await onSyncPagesPrompt('ALL', systemPrompt, knowledgeBase);
        }

        setSuccessMsg(
          `Master AI Prompt & Knowledge Base saved and synced across all ${pages.length} connected business page(s)!`
        );
      } else {
        /* Update only selected business page */
        if (onSyncPagesPrompt) {
          await onSyncPagesPrompt(targetScope, systemPrompt, knowledgeBase);
        }
        const pg = pages.find(p => p.page_id === targetScope);
        setSuccessMsg(
          `AI Prompt & Knowledge Base updated for "${pg?.page_name || targetScope}" in database!`
        );
      }
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync AI Agents configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncSinglePageToMaster = async (page) => {
    setSyncingPageId(page.page_id);
    setErrorMsg('');
    try {
      const masterPrompt = settings?.master_ai_system_prompt || systemPrompt;
      const masterKb = settings?.master_ai_knowledge_base || knowledgeBase;
      if (onSyncPagesPrompt) {
        await onSyncPagesPrompt(page.page_id, masterPrompt, masterKb);
      }
      setSuccessMsg(`"${page.page_name}" synced with Master AI Prompt & Knowledge Base!`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync page.');
    } finally {
      setSyncingPageId(null);
    }
  };

  const getOwnerEmail = (userId) => {
    const found = users.find(u => u.id === userId);
    return found ? found.email : 'Tenant Account';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-black text-white tracking-tight">AI Agents &amp; Knowledge Master</h2>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Central DB Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage global AI System Prompts, Sales Guidelines, and Knowledge Base files (.docx/.txt) and synchronize them directly across all connected business pages.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold shrink-0">
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{pages.length} Connected Pages Ready</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveAndSyncAll} className="space-y-6">
        {/* Target Scope Selector + Preset Templates */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Target Synchronization Scope</span>
            </label>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value)}
              className="w-full lg:w-auto min-w-[340px] px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="ALL_MASTER">
                Master Global Sync (All {pages.length} Connected Pages + Future Pages)
              </option>
              {pages.map((p) => (
                <option key={p.page_id} value={p.page_id}>
                  Specific Page: {p.page_name} ({getOwnerEmail(p.user_id)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Preset Prompts:</span>
            <button
              type="button"
              onClick={() => handleApplyTemplate('agency')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
            >
              Agency Sales
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('ecommerce')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
            >
              E-Commerce
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('support')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
            >
              Support Rep
            </button>
          </div>
        </div>

        {/* AI System Prompt & Sales Guidelines */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <Bot className="w-5 h-5 text-purple-400" />
                <span>AI System Prompt &amp; Sales Guidelines</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Define the consultant personality or upload a <strong>.docx</strong> / <strong>.txt</strong> file directly into this box.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {uploadedPromptDocName && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-[11px] font-medium border border-purple-500/30">
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[140px] truncate">{uploadedPromptDocName}</span>
                </span>
              )}
              <input
                ref={promptFileRef}
                type="file"
                accept=".docx,.txt,.md"
                onChange={(e) => handleDocumentUpload(e, 'prompt')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => promptFileRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .docx File</span>
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-purple-500 transition leading-relaxed"
          />
        </div>

        {/* Knowledge Base */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Knowledge Base (FAQs, Policies, Business Details)</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload business FAQs, policies, and product guidance or load a <strong>.docx</strong> file to push across connected pages.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {uploadedKnowledgeDocName && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-medium border border-emerald-500/30">
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[140px] truncate">{uploadedKnowledgeDocName}</span>
                </span>
              )}
              <input
                ref={knowledgeFileRef}
                type="file"
                accept=".docx,.txt,.md"
                onChange={(e) => handleDocumentUpload(e, 'knowledge')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => knowledgeFileRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .docx File</span>
              </button>
            </div>
          </div>

          <textarea
            rows={7}
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-purple-500 transition leading-relaxed"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving
                ? 'Syncing to Database...'
                : targetScope === 'ALL_MASTER'
                  ? 'Save & Sync All Connected Pages'
                  : 'Save for Selected Page'}
            </span>
          </button>
        </div>
      </form>

      {/* Connected Business Pages Sync Matrix */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Connected Business Pages Knowledge Sync ({pages.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500">Live Supabase business_pages sync</span>
        </div>

        {pages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No business pages connected yet. Any new page connected by a user will automatically inherit your Master Prompt &amp; Knowledge Base.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {pages.map((page) => {
              const masterPrompt = settings?.master_ai_system_prompt || DEFAULT_MASTER_PROMPT;
              const masterKb = settings?.master_ai_knowledge_base || DEFAULT_MASTER_KNOWLEDGE;
              const isSyncedWithMaster =
                page.system_prompt === masterPrompt && page.knowledge_base === masterKb;

              return (
                <div key={page.page_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{page.page_name}</span>
                      <span className="text-[10px] font-mono text-slate-500">ID: {page.page_id}</span>
                      {isSyncedWithMaster ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Synced with Master
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Custom / Out of Sync
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Owner: <span className="text-slate-300">{getOwnerEmail(page.user_id)}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setTargetScope(page.page_id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Edit Page Prompt
                    </button>
                    <button
                      type="button"
                      disabled={syncingPageId === page.page_id}
                      onClick={() => handleSyncSinglePageToMaster(page)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingPageId === page.page_id ? 'animate-spin' : ''}`} />
                      <span>Sync Master</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

