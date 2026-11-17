import React, { useState, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  getLocalQuotaUsage,
  fetchSupabaseQuotaUsage,
  getEffectiveUserQuota,
  incrementQuotaUsage,
  resolveDynamicSystemPrompt
} from '../../lib/knowledgeLibrary';

export default function TestChatSimulator({ pages = [], selectedPage = null, userProfile = null, onUpgradePlan }) {
  const userId = userProfile?.id || 'default';
  const availablePages = pages.length > 0 ? pages : selectedPage ? [selectedPage] : [];
  const [activePageId, setActivePageId] = useState(availablePages[0]?.page_id || '');
  const activePage = availablePages.find(p => p.page_id === activePageId) || availablePages[0] || null;

  const [usage, setUsage] = useState(() => getLocalQuotaUsage(userId));
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('saas_gemini_api_key') || '');
  const [masterSystemPrompt, setMasterSystemPrompt] = useState('');
  const [businessProfile, setBusinessProfile] = useState(null);

  useEffect(() => {
    if (!activePageId && availablePages.length > 0) {
      setActivePageId(availablePages[0].page_id);
    }
  }, [availablePages.length]);

  useEffect(() => {
    let isMounted = true;
    fetchSupabaseQuotaUsage(userId).then((fresh) => {
      if (isMounted && fresh) setUsage(fresh);
    });
    const handleQuotaEvent = (e) => {
      if (isMounted && (!e.detail?.userId || e.detail.userId === userId)) {
        setUsage(e.detail?.usage || getLocalQuotaUsage(userId));
      }
    };
    window.addEventListener('saas-quota-updated', handleQuotaEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('saas-quota-updated', handleQuotaEvent);
    };
  }, [userId]);

  /* Fetch live Gemini Key, Master Prompt, and Page Business Profile from Supabase */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const keys = ['gemini_api_key', 'master_ai_system_prompt'];
    if (activePage?.page_id) keys.push(`business_profile_${activePage.page_id}`);

    supabase
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', keys)
      .then(({ data }) => {
        if (!data) return;
        data.forEach((row) => {
          if (row.setting_key === 'gemini_api_key' && row.setting_value?.trim() && !localStorage.getItem('saas_gemini_api_key')) {
            setGeminiApiKey(row.setting_value.trim());
          }
          if (row.setting_key === 'master_ai_system_prompt' && row.setting_value) {
            setMasterSystemPrompt(row.setting_value);
          }
          if (activePage?.page_id && row.setting_key === `business_profile_${activePage.page_id}` && row.setting_value) {
            try {
              setBusinessProfile(JSON.parse(row.setting_value));
            } catch {
              setBusinessProfile(null);
            }
          }
        });
      });
  }, [activePage?.page_id]);

  const effectiveQuota = getEffectiveUserQuota(userProfile, usage);
  const resetDateFormatted = effectiveQuota.nextResetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const isQuotaExhausted = effectiveQuota.isMessageExhausted || effectiveQuota.isTokenExhausted;

  const expiresAt = userProfile?.subscription_expires_at
    ? new Date(userProfile.subscription_expires_at)
    : userProfile?.created_at
      ? new Date(new Date(userProfile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const isSubscriptionExpired = expiresAt ? (new Date() > expiresAt) : false;
  const isFreeTrial = (userProfile?.plan_tier || 'free').toLowerCase() === 'free';
  const isFreeTrialExpired = isFreeTrial && isSubscriptionExpired;

  const brandName = businessProfile?.brandName || activePage?.page_name || 'AutoReply Sales Desk';

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: isFreeTrialExpired
        ? 'Notice: Your 1-Month Free Trial has expired. Automated AI responses are halted. Please upgrade to a paid package to test and deploy.'
        : `Hello! Welcome to ${brandName}. How can I assist you today?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleReset = (nextBrand = brandName) => {
    setMessages([
      {
        sender: 'bot',
        text: isFreeTrialExpired
          ? 'Notice: Your 1-Month Free Trial has expired. Automated AI responses are halted. Please upgrade to a paid package to test and deploy.'
          : `Hello! Welcome to ${nextBrand}. How can I assist you today?`
      }
    ]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (isFreeTrialExpired) {
      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: inputText.trim() },
        { sender: 'bot', text: 'Service Halted: Your 1-Month Free Trial has ended. Please upgrade and pay for a package to reactivate AI sales responses.' }
      ]);
      setInputText('');
      return;
    }

    if (isQuotaExhausted) {
      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: inputText.trim() },
        { sender: 'bot', text: `Token / Message Limit Reached: Your monthly quota (${effectiveQuota.tokenLimit.toLocaleString()} Tokens) has been fully used. Your quota will automatically reset on ${resetDateFormatted}, or you can upgrade your plan to top up extra tokens immediately.` }
      ]);
      setInputText('');
      return;
    }

    const userMsg = inputText.trim();
    const conversationBeforeSend = [...messages, { sender: 'user', text: userMsg }];
    setMessages(conversationBeforeSend);
    setInputText('');
    setIsTyping(true);

    const effectiveKey = (localStorage.getItem('saas_gemini_api_key') || geminiApiKey || '').trim();
    const compiledSystemInstruction = resolveDynamicSystemPrompt(
      activePage?.system_prompt || masterSystemPrompt,
      activePage || { page_name: brandName },
      businessProfile
    );

    if (effectiveKey) {
      try {
        const contents = conversationBeforeSend
          .slice(-10)
          .map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }));

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(effectiveKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: compiledSystemInstruction }] },
              contents,
              generationConfig: { temperature: 0.4, maxOutputTokens: 700 }
            })
          }
        );

        if (res.ok) {
          const data = await res.json();
          const botReply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            `Thank you for reaching out to ${brandName}! How can I help you today?`;
          const usedTokens =
            Number(data?.usageMetadata?.totalTokenCount) ||
            Math.max(250, Math.round((compiledSystemInstruction.length + userMsg.length + botReply.length) / 3));

          const updatedUsage = await incrementQuotaUsage(userId, {
            messages: 1,
            tokens: usedTokens,
            posts: 0
          });
          setUsage(updatedUsage);
          setMessages((prev) => [...prev, { sender: 'bot', text: botReply.trim() }]);
          setIsTyping(false);
          return;
        }
      } catch {
        /* fallback cleanly below */
      }
    }

    /* Offline / No-Key Fallback using Brand Identity & Knowledge Base */
    const estimatedTokens = Math.max(180, userMsg.length * 6 + 240);
    const updatedUsage = await incrementQuotaUsage(userId, {
      messages: 1,
      tokens: estimatedTokens,
      posts: 0
    });
    setUsage(updatedUsage);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let botReply = `Thank you for contacting ${brandName}!`;
      if (lower.includes('who') || lower.includes('কে') || lower.includes('ke')) {
        botReply = `আমি ${brandName} এর একজন অফিসিয়াল সেলস ও কাস্টমার সাপোর্ট প্রতিনিধি। ${businessProfile?.tagline || ''} আপনাকে কীভাবে সাহায্য করতে পারি?`;
      } else if (businessProfile?.servicesOffered) {
        botReply = `${brandName} এ আমরা ${businessProfile.servicesOffered} সার্ভিসগুলো প্রদান করছি। আপনি কোন প্যাকেজ বা সার্ভিস সম্পর্কে জানতে চাচ্ছেন?`;
      } else {
        botReply = `Thank you for asking ${brandName}! Could you tell me a bit more about your requirements so I can recommend the right package?`;
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
      setIsTyping(false);
    }, 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Chat Simulator</h2>
          <p className="text-sm text-slate-400 mt-1">
            Test your live AI brand identity, uploaded business knowledge, and response behavior before customers message you.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {availablePages.length > 0 && (
            <select
              value={activePage?.page_id || ''}
              onChange={(e) => {
                setActivePageId(e.target.value);
                const chosen = availablePages.find(p => p.page_id === e.target.value);
                handleReset(chosen?.page_name || 'AutoReply Sales Desk');
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              {availablePages.map((p) => (
                <option key={p.page_id} value={p.page_id}>
                  {p.page_name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => handleReset(brandName)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Free Trial Expired Banner */}
      {isFreeTrialExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 shadow-xl max-w-2xl mx-auto">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                1-Month Free Trial Expired (Payment Required)
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Your 30-day trial period has ended. Live prompt simulations and bot responses are paused until a subscription is activated.
              </p>
            </div>
          </div>
          {onUpgradePlan && (
            <button
              type="button"
              onClick={onUpgradePlan}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      )}

      <div className="max-w-2xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[540px]">
        {/* Messenger Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-bold text-white">{brandName}</p>
                {geminiApiKey ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[9px] font-bold">
                    Live Gemini 2.5 Flash
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9px] font-bold">
                    Preview Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">
                {activePage?.knowledge_base ? '● Business Knowledge Loaded' : '● Typically replies instantly'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Msg Left: {effectiveQuota.messagesRemaining.toLocaleString()}
            </span>
            <span className={`px-2 py-0.5 rounded border ${
              effectiveQuota.isTokenExhausted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold'
                : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
            }`}>
              Tokens Left: {effectiveQuota.tokensRemaining.toLocaleString()} (Used: {effectiveQuota.tokensUsed.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[80%] whitespace-pre-line shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-500 text-xs italic pl-9">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span className="animate-pulse">{brandName} representative is typing...</span>
            </div>
          )}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ${brandName} (e.g. 'তুমি কে?', 'তোমাদের প্যাকেজ কী কী?')...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
