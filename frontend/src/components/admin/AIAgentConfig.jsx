import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Plus,
  RefreshCw,
  ExternalLink,
  LogOut,
  FolderGit2,
  Upload,
  FileText,
  Sparkles,
  Bot
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  extractGoogleId,
  getSavedGoogleSession,
  saveGoogleSession,
  connectGoogleDriveAndSheets,
  listUserSpreadsheets,
  createChatbotSpreadsheet,
  shareDriveFilesBatch
} from '../../lib/googleWorkspaceApi';
import {
  extractTextFromDocument,
  buildCompiledBusinessKnowledge,
  analyzeBusinessWithGemini
} from '../../lib/knowledgeLibrary';

const EMPTY_BUSINESS_PROFILE = {
  brandName: '',
  businessCategory: '',
  tagline: '',
  servicesOffered: '',
  supportPhone: '',
  supportEmail: '',
  websiteUrl: '',
  address: '',
  workingHours: '10:00 AM to 10:00 PM (Daily)',
  paymentMethods: 'bKash, Nagad, Rocket, Bank Transfer',
  deliveryPolicy: '3 to 5 business days delivery / onboarding',
  preferredLanguage: 'Auto (Bengali / Banglish / English)',
  aiVerifiedSummary: '',
  aiVerified: false,
  uploadedDocName: '',
  uploadedDocText: ''
};

export default function AIAgentConfig({ pages = [], userProfile = null, onUpdatePageConfig, onUpgradePlan }) {
  const userId = userProfile?.id || 'default';
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.page_id || '');
  const [brandDisplayName, setBrandDisplayName] = useState('');
  const [businessProfile, setBusinessProfile] = useState(EMPTY_BUSINESS_PROFILE);

  const [productsSheetId, setProductsSheetId] = useState('');
  const [faqSheetId, setFaqSheetId] = useState('');
  const [ordersSheetId, setOrdersSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* Master Platform Config fetched from Supabase */
  const [googleClientId, setGoogleClientId] = useState(
    () => import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('saas_google_client_id') || ''
  );
  const [n8nSheetsEmail, setN8nSheetsEmail] = useState('sayhamkayes101@gmail.com');
  const [platformGeminiKey, setPlatformGeminiKey] = useState('');

  /* Google Drive Session & Auto-Share States */
  const [googleSession, setGoogleSession] = useState(() => getSavedGoogleSession(userId));
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [showClientIdHelp, setShowClientIdHelp] = useState(false);
  const [shareStatusInfo, setShareStatusInfo] = useState(null);

  const docInputRef = useRef(null);

  const expiresAt = userProfile?.subscription_expires_at
    ? new Date(userProfile.subscription_expires_at)
    : userProfile?.created_at
      ? new Date(new Date(userProfile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const isSubscriptionExpired = expiresAt ? (new Date() > expiresAt) : false;
  const isFreeTrial = (userProfile?.plan_tier || 'free').toLowerCase() === 'free';
  const isFreeTrialExpired = isFreeTrial && isSubscriptionExpired;

  /* Fetch Admin global Google OAuth Client ID, n8n Gmail, and Gemini Key from platform_settings */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase
      .from('platform_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['google_oauth_client_id', 'n8n_google_sheets_email', 'gemini_api_key'])
      .then(({ data }) => {
        if (!data) return;
        data.forEach((row) => {
          if (row.setting_key === 'google_oauth_client_id' && row.setting_value?.trim()) {
            setGoogleClientId(row.setting_value.trim());
            localStorage.setItem('saas_google_client_id', row.setting_value.trim());
          }
          if (row.setting_key === 'n8n_google_sheets_email' && row.setting_value?.trim()) {
            setN8nSheetsEmail(row.setting_value.trim());
          }
          if (row.setting_key === 'gemini_api_key' && row.setting_value?.trim()) {
            setPlatformGeminiKey(row.setting_value.trim());
          }
        });
      });
  }, []);

  /* Load spreadsheets automatically if Google session already active */
  useEffect(() => {
    if (googleSession?.accessToken) {
      handleRefreshSpreadsheets(googleSession.accessToken, true);
    }
  }, [googleSession?.accessToken]);

  /* Load Selected Page Sheets & Structured Business Profile from Supabase / localStorage */
  useEffect(() => {
    if (!selectedPageId && pages.length > 0) {
      setSelectedPageId(pages[0].page_id);
      return;
    }
    const currentPage = pages.find(p => p.page_id === selectedPageId);
    if (!currentPage) return;

    setProductsSheetId(currentPage.products_sheet_id || '');
    setFaqSheetId(currentPage.faq_sheet_id || '');
    setOrdersSheetId(currentPage.orders_sheet_id || '');
    setBrandDisplayName(currentPage.page_name || '');
    setShareStatusInfo(null);

    const loadProfile = async () => {
      let savedProfile = null;
      try {
        const localRaw = localStorage.getItem(`saas_business_profile_${currentPage.page_id}`);
        if (localRaw) savedProfile = JSON.parse(localRaw);
      } catch {
        savedProfile = null;
      }

      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from('platform_settings')
            .select('setting_value')
            .eq('setting_key', `business_profile_${currentPage.page_id}`)
            .maybeSingle();
          if (data?.setting_value) {
            savedProfile = JSON.parse(data.setting_value);
          }
        } catch {
          /* fallback to local/page knowledge_base */
        }
      }

      setBusinessProfile({
        ...EMPTY_BUSINESS_PROFILE,
        brandName: currentPage.page_name || '',
        uploadedDocText: (!savedProfile?.uploadedDocText && currentPage.knowledge_base) ? currentPage.knowledge_base : '',
        ...(savedProfile || {})
      });
    };

    loadProfile();
  }, [selectedPageId, pages]);

  const handleRefreshSpreadsheets = async (tokenOverride, silent = false) => {
    const token = tokenOverride || googleSession?.accessToken;
    if (!token) return;
    setGoogleBusy(true);
    try {
      const files = await listUserSpreadsheets(token);
      setSpreadsheets(files);
    } catch (err) {
      if (!silent) setErrorMsg(err.message || 'Could not load spreadsheets from Google Drive.');
      if (String(err.message || '').toLowerCase().includes('invalid credentials')) {
        saveGoogleSession(userId, null);
        setGoogleSession(null);
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleConnectGoogle = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!googleClientId.trim()) {
      setShowClientIdHelp(true);
      setErrorMsg('Please set your Google OAuth Client ID (either in Super Admin Master APIs or below) to enable 1-click Google Drive Sign-In.');
      return;
    }
    localStorage.setItem('saas_google_client_id', googleClientId.trim());
    setGoogleBusy(true);
    try {
      const sess = await connectGoogleDriveAndSheets(googleClientId.trim(), userId);
      setGoogleSession(sess);
      const files = await listUserSpreadsheets(sess.accessToken);
      setSpreadsheets(files);
      setSuccessMsg(`Connected Google Drive & Sheets (${sess.email || 'Active'})!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const attemptAutoShareWithN8n = async (sheetIds = [], tokenOverride) => {
    const token = tokenOverride || googleSession?.accessToken;
    if (!token || !n8nSheetsEmail.trim()) return null;

    const batchRes = await shareDriveFilesBatch(token, sheetIds, n8nSheetsEmail.trim());
    if (batchRes.sharedCount > 0 && batchRes.manualIds.length === 0) {
      setShareStatusInfo({
        type: 'success',
        message: 'Google Sheet Editor permissions automatically synced with your AI Bot Engine.'
      });
    } else if (batchRes.manualIds.length > 0) {
      setShareStatusInfo({
        type: 'warning',
        message: `Selected existing Sheet(s) were created outside this app. Click "Open Sheet" > Share and add "${n8nSheetsEmail.trim()}" as Editor so the AI chatbot can read Products/FAQs and save Orders.`
      });
    }
    return batchRes;
  };

  const handleCreateReadySheet = async () => {
    if (!googleSession?.accessToken) return;
    setErrorMsg('');
    setSuccessMsg('');
    setCreatingSheet(true);
    try {
      const currentPage = pages.find(p => p.page_id === selectedPageId);
      const created = await createChatbotSpreadsheet(
        googleSession.accessToken,
        brandDisplayName || currentPage?.page_name || 'AutoReply Business',
        n8nSheetsEmail
      );
      setSpreadsheets(prev => [created, ...prev]);
      setProductsSheetId(created.id);
      setFaqSheetId(created.id);
      setOrdersSheetId(created.id);

      if (created.sharedWithN8n) {
        setShareStatusInfo({
          type: 'success',
          message: 'Created & automatically synced Editor permissions for your AI Bot Engine!'
        });
      }

      if (selectedPageId && onUpdatePageConfig) {
        await onUpdatePageConfig(selectedPageId, {
          products_sheet_id: created.id,
          faq_sheet_id: created.id,
          orders_sheet_id: created.id
        });
      }
      setSuccessMsg(
        `Created "${created.name}" with Products, FAQ & Orders tabs and automatically connected all 3 Sheet IDs!`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create Google Sheet.');
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleDisconnectGoogle = () => {
    saveGoogleSession(userId, null);
    setGoogleSession(null);
    setSpreadsheets([]);
    setShareStatusInfo(null);
  };

  const handleApplySheetToAll = async (sheetId) => {
    const clean = extractGoogleId(sheetId);
    setProductsSheetId(clean);
    setFaqSheetId(clean);
    setOrdersSheetId(clean);
    if (clean && googleSession?.accessToken) {
      await attemptAutoShareWithN8n([clean]);
    }
  };

  const handleSelectSingleSheet = async (setter, sheetId) => {
    const clean = extractGoogleId(sheetId);
    setter(clean);
    if (clean && googleSession?.accessToken) {
      await attemptAutoShareWithN8n([clean]);
    }
  };

  /* Document Upload (.docx / .txt / .md / .csv) + Auto AI Analysis if key available */
  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const extractedText = await extractTextFromDocument(file);
      if (!extractedText) {
        setErrorMsg(`Could not extract readable text from "${file.name}". Please upload a valid .docx, .txt, .md, or .csv file.`);
        return;
      }

      const nextProfile = {
        ...businessProfile,
        uploadedDocName: file.name,
        uploadedDocText: extractedText
      };
      setBusinessProfile(nextProfile);

      const effectiveGeminiKey = localStorage.getItem('saas_gemini_api_key') || platformGeminiKey;
      if (effectiveGeminiKey) {
        setAnalyzingAi(true);
        try {
          const { extracted, tokensUsed } = await analyzeBusinessWithGemini({
            apiKey: effectiveGeminiKey,
            fileText: extractedText,
            currentProfile: nextProfile,
            pageName: brandDisplayName,
            userId
          });
          setBusinessProfile({
            ...nextProfile,
            ...extracted,
            aiVerified: true
          });
          if (extracted.brandName && !brandDisplayName.trim()) {
            setBrandDisplayName(extracted.brandName);
          }
          setSuccessMsg(
            `Uploaded "${file.name}" and verified business details with Gemini AI (${tokensUsed.toLocaleString()} tokens)! Click "Save Business & Sheets Config" to sync to live bot.`
          );
        } catch (aiErr) {
          setSuccessMsg(
            `Loaded "${file.name}" (${extractedText.length} chars). Click "Save Business & Sheets Config" to publish.`
          );
        } finally {
          setAnalyzingAi(false);
        }
      } else {
        setSuccessMsg(
          `Loaded "${file.name}" (${extractedText.length} chars). Fill in any extra details below and click "Save Business & Sheets Config".`
        );
      }
    } catch (err) {
      setErrorMsg('Failed to read uploaded file: ' + (err.message || 'Invalid format'));
    } finally {
      e.target.value = '';
    }
  };

  const handleManualAiVerify = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const effectiveGeminiKey = localStorage.getItem('saas_gemini_api_key') || platformGeminiKey;
    if (!effectiveGeminiKey) {
      setErrorMsg('Gemini API Key is not configured yet. Please ask Super Admin to set it in Master APIs & Gateway.');
      return;
    }
    setAnalyzingAi(true);
    try {
      const { extracted, tokensUsed } = await analyzeBusinessWithGemini({
        apiKey: effectiveGeminiKey,
        fileText: businessProfile.uploadedDocText,
        currentProfile: businessProfile,
        pageName: brandDisplayName,
        userId
      });
      setBusinessProfile(prev => ({
        ...prev,
        ...extracted,
        aiVerified: true
      }));
      if (extracted.brandName) {
        setBrandDisplayName(extracted.brandName);
      }
      setSuccessMsg(`AI Verification Complete (${tokensUsed.toLocaleString()} tokens used)! Review the extracted Brand & Business Summary and click Save.`);
    } catch (err) {
      setErrorMsg(err.message || 'AI verification failed.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPageId) {
      setErrorMsg('Please select a connected business account first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanProducts = extractGoogleId(productsSheetId);
    const cleanFaq = extractGoogleId(faqSheetId);
    const cleanOrders = extractGoogleId(ordersSheetId);

    setProductsSheetId(cleanProducts);
    setFaqSheetId(cleanFaq);
    setOrdersSheetId(cleanOrders);

    const finalBrandName = (brandDisplayName || businessProfile.brandName || '').trim();
    const updatedProfile = {
      ...businessProfile,
      brandName: finalBrandName,
      updatedAt: new Date().toISOString()
    };
    const compiledKnowledge = buildCompiledBusinessKnowledge(updatedProfile, updatedProfile.uploadedDocText);

    try {
      await onUpdatePageConfig(selectedPageId, {
        ...(finalBrandName ? { page_name: finalBrandName } : {}),
        knowledge_base: compiledKnowledge,
        products_sheet_id: cleanProducts,
        faq_sheet_id: cleanFaq,
        orders_sheet_id: cleanOrders,
        updated_at: new Date().toISOString()
      });

      /* Persist structured Business Profile to localStorage & Supabase platform_settings for Admin & Simulator sync */
      localStorage.setItem(`saas_business_profile_${selectedPageId}`, JSON.stringify(updatedProfile));
      if (isSupabaseConfigured()) {
        await supabase.from('platform_settings').upsert(
          {
            setting_key: `business_profile_${selectedPageId}`,
            setting_value: JSON.stringify(updatedProfile),
            description: `Structured Business Identity & Uploaded Knowledge for ${finalBrandName || selectedPageId}`,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'setting_key' }
        );
      }

      /* Auto-share any selected sheets with Admin's n8n Gmail */
      if (googleSession?.accessToken && n8nSheetsEmail) {
        await attemptAutoShareWithN8n([cleanProducts, cleanFaq, cleanOrders]);
      }

      setBusinessProfile(updatedProfile);
      setSuccessMsg('Business Profile, Brand Identity, Knowledge File & Google Sheets saved and synced!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save Business & Google Sheet configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Connected Business Accounts</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please connect at least one social media business account before configuring your Brand Identity and Google Sheets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Business Identity, Knowledge &amp; Google Sheets</h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload your business requirements, let AI verify your brand details, and connect your Google Sheets for automated replies and order logging.
          </p>
        </div>

        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Synced to Live AI Agent</span>
        </span>
      </div>

      {/* 1-Month Free Trial Expired Warning */}
      {isFreeTrialExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 shadow-xl">
          <div className="flex items-start sm:items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                1-Month Free Trial Has Expired (Payment Required)
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Your 30-day trial period has ended. Business details &amp; Google Sheet mappings remain saved, but automated AI bot responses are suspended until a paid subscription package is activated.
              </p>
            </div>
          </div>
          {onUpgradePlan && (
            <button
              type="button"
              onClick={onUpgradePlan}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition"
            >
              Upgrade &amp; Pay Now
            </button>
          )}
        </div>
      )}

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

      {/* 1-Click Google Drive & Sheets Connection Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                <span>Google Drive &amp; Sheets Direct Sync</span>
                {googleSession && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Connected{googleSession.email ? `: ${googleSession.email}` : ''}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in once to create a ready-to-use Sheet or select existing Sheets from your Drive for instant AI bot sync.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {googleSession ? (
              <>
                <button
                  type="button"
                  onClick={handleCreateReadySheet}
                  disabled={creatingSheet}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/25 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{creatingSheet ? 'Creating Sheet...' : 'Create New Sheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRefreshSpreadsheets(googleSession.accessToken)}
                  disabled={googleBusy}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Refresh Google Sheets List"
                >
                  <RefreshCw className={`w-4 h-4 ${googleBusy ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={googleBusy}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/25 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{googleBusy ? 'Connecting...' : 'Sign in with Google Drive'}</span>
              </button>
            )}
          </div>
        </div>

        {shareStatusInfo && (
          <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
            shareStatusInfo.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            {shareStatusInfo.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{shareStatusInfo.message}</span>
          </div>
        )}

        {(showClientIdHelp || !googleClientId) && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Google OAuth Client ID (Auto-inherited from Master Admin or enter here)
            </label>
            <input
              type="text"
              value={googleClientId}
              onChange={(e) => {
                setGoogleClientId(e.target.value);
                localStorage.setItem('saas_google_client_id', e.target.value.trim());
              }}
              placeholder="1234567890-abcxyz.apps.googleusercontent.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {googleSession && spreadsheets.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                Quick-Select One Sheet for Products, FAQ &amp; Orders
              </label>
              <select
                value={productsSheetId}
                onChange={(e) => handleApplySheetToAll(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select a spreadsheet from your Google Drive...</option>
                {spreadsheets.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name} ({file.id.slice(0, 14)}...)
                  </option>
                ))}
              </select>
            </div>
            {productsSheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${extractGoogleId(productsSheetId)}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold shrink-0 self-end sm:self-center"
              >
                <span>Open Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Select Business Account + Editable Page / Brand Display Name */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Connected Social Account</span>
            </label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {pages.map((p) => (
                <option key={p.page_id} value={p.page_id}>
                  {p.page_name} (ID: {p.page_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Official Business / Brand Name (AI Identity)
            </label>
            <input
              type="text"
              required
              value={brandDisplayName}
              onChange={(e) => {
                setBrandDisplayName(e.target.value);
                setBusinessProfile(prev => ({ ...prev, brandName: e.target.value }));
              }}
              placeholder="e.g. SKzLAB Digital Agency"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Dynamic Brand Identity, Requirements Upload & AI Verification Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-white font-bold text-base">
                <Bot className="w-5 h-5 text-purple-400" />
                <span>Business Details &amp; Knowledge File Upload</span>
                {businessProfile.aiVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    AI Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Fill out your business info and upload a requirements file (.docx, .txt, .md, .csv). The AI Agent automatically adapts its identity to represent your brand.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                ref={docInputRef}
                type="file"
                accept=".docx,.txt,.md,.csv"
                onChange={handleDocumentUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Business Doc (.docx/.txt)</span>
              </button>

              <button
                type="button"
                onClick={handleManualAiVerify}
                disabled={analyzingAi}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${analyzingAi ? 'animate-spin' : ''}`} />
                <span>{analyzingAi ? 'Analyzing with AI...' : 'Analyze & Verify with AI'}</span>
              </button>
            </div>
          </div>

          {businessProfile.uploadedDocName && (
            <div className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200 flex items-center justify-between">
              <span className="inline-flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Loaded Document: <strong>{businessProfile.uploadedDocName}</strong></span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {(businessProfile.uploadedDocText || '').length.toLocaleString()} chars
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Business Category / Niche
              </label>
              <input
                type="text"
                value={businessProfile.businessCategory}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, businessCategory: e.target.value }))}
                placeholder="e.g. Software Agency / Clothing Brand"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Tagline / Short Intro
              </label>
              <input
                type="text"
                value={businessProfile.tagline}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="e.g. Fast AI & Web Solutions in Bangladesh"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Preferred Reply Language
              </label>
              <select
                value={businessProfile.preferredLanguage}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="Auto (Bengali / Banglish / English)">Auto (Match Customer: Bengali / Banglish / English)</option>
                <option value="Bengali Primary">Bengali Primary</option>
                <option value="English Primary">English Primary</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Core Products &amp; Services Offered
            </label>
            <input
              type="text"
              value={businessProfile.servicesOffered}
              onChange={(e) => setBusinessProfile(prev => ({ ...prev, servicesOffered: e.target.value }))}
              placeholder="e.g. Website Design, Facebook Chatbot Setup, Social Media Marketing Packages"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Support Phone / WhatsApp
              </label>
              <input
                type="text"
                value={businessProfile.supportPhone}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, supportPhone: e.target.value }))}
                placeholder="e.g. +880 17XX-XXXXXX"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={businessProfile.supportEmail}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, supportEmail: e.target.value }))}
                placeholder="e.g. support@yourbrand.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Website / Store Link
              </label>
              <input
                type="text"
                value={businessProfile.websiteUrl}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="e.g. https://yourbrand.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Working Hours
              </label>
              <input
                type="text"
                value={businessProfile.workingHours}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, workingHours: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Accepted Payment Methods
              </label>
              <input
                type="text"
                value={businessProfile.paymentMethods}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, paymentMethods: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Delivery / Onboarding Policy
              </label>
              <input
                type="text"
                value={businessProfile.deliveryPolicy}
                onChange={(e) => setBusinessProfile(prev => ({ ...prev, deliveryPolicy: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {businessProfile.aiVerifiedSummary && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Verified Business Summary</span>
              </p>
              <p className="text-xs text-slate-200 leading-relaxed">{businessProfile.aiVerifiedSummary}</p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Business Requirements, FAQs &amp; Uploaded Knowledge Text
            </label>
            <textarea
              rows={6}
              value={businessProfile.uploadedDocText}
              onChange={(e) => setBusinessProfile(prev => ({ ...prev, uploadedDocText: e.target.value }))}
              placeholder="Paste any extra rules, pricing notes, FAQs, or upload a .docx/.txt file above..."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Google Sheets Integration */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Google Sheets Integration (Products, FAQ &amp; Orders)</span>
          </div>
          <p className="text-xs text-slate-400">
            Select spreadsheets from your connected Google Drive above or paste any Google Sheet Link or Sheet ID below (links auto-extract the ID and sync permissions automatically).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Products Sheet ID
              </label>
              {spreadsheets.length > 0 && (
                <select
                  value={spreadsheets.some(f => f.id === productsSheetId) ? productsSheetId : ''}
                  onChange={(e) => e.target.value && handleSelectSingleSheet(setProductsSheetId, e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Choose from Google Drive...</option>
                  {spreadsheets.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={productsSheetId}
                onChange={(e) => setProductsSheetId(e.target.value)}
                placeholder="Paste Google Sheet URL or ID..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                FAQ Sheet ID
              </label>
              {spreadsheets.length > 0 && (
                <select
                  value={spreadsheets.some(f => f.id === faqSheetId) ? faqSheetId : ''}
                  onChange={(e) => e.target.value && handleSelectSingleSheet(setFaqSheetId, e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Choose from Google Drive...</option>
                  {spreadsheets.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={faqSheetId}
                onChange={(e) => setFaqSheetId(e.target.value)}
                placeholder="Paste Google Sheet URL or ID..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Orders Sheet ID
              </label>
              {spreadsheets.length > 0 && (
                <select
                  value={spreadsheets.some(f => f.id === ordersSheetId) ? ordersSheetId : ''}
                  onChange={(e) => e.target.value && handleSelectSingleSheet(setOrdersSheetId, e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Choose from Google Drive...</option>
                  {spreadsheets.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={ordersSheetId}
                onChange={(e) => setOrdersSheetId(e.target.value)}
                placeholder="Paste Google Sheet URL or ID..."
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
            <span>{loading ? 'Saving & Syncing All...' : 'Save Business & Sheets Config'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
