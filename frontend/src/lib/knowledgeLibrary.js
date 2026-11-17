import { supabase, isSupabaseConfigured } from './supabaseClient';

/* Plan Quota Limits for Messages, Bot AI Tokens, and Social Auto-Posts */
export const PLAN_QUOTA_LIMITS = {
  free: {
    id: 'free',
    name: 'Free Trial',
    priceBDT: '৳0',
    pagesAllowed: 1,
    messageLimit: 5000,
    messageLabel: '5K / Month',
    tokenLimit: 50000,
    tokenLabel: '50K / Month',
    postLimit: 5,
    postLabel: '5 / Month'
  },
  starter: {
    id: 'starter',
    name: 'Starter Growth',
    priceBDT: '৳1,499',
    pagesAllowed: 3,
    messageLimit: 50000,
    messageLabel: '50K / Month',
    tokenLimit: 500000,
    tokenLabel: '500K / Month',
    postLimit: 20,
    postLabel: '20 / Month'
  },
  business: {
    id: 'business',
    name: 'Business Pro',
    priceBDT: '৳3,999',
    pagesAllowed: 10,
    messageLimit: 250000,
    messageLabel: '250K / Month',
    tokenLimit: 2500000,
    tokenLabel: '2.5M / Month',
    postLimit: 60,
    postLabel: '60 / Month'
  },
  agency: {
    id: 'agency',
    name: 'Agency Enterprise',
    priceBDT: '৳9,999',
    pagesAllowed: 9999,
    messageLimit: 10000000,
    messageLabel: '10M / Month',
    tokenLimit: 10000000,
    tokenLabel: '10M / Month',
    postLimit: 99999,
    postLabel: 'Unlimited'
  }
};

export const getPlanQuotaConfig = (tier = 'free') => {
  const key = String(tier || 'free').toLowerCase();
  return PLAN_QUOTA_LIMITS[key] || PLAN_QUOTA_LIMITS.free;
};

/* Calculate Next Monthly Token Reset Date for a User Profile */
export const getNextTokenResetDate = (userProfile = null, usageData = null) => {
  if (usageData?.nextResetAt) {
    const customDate = new Date(usageData.nextResetAt);
    if (!isNaN(customDate.getTime())) return customDate;
  }
  if (userProfile?.subscription_expires_at) {
    const exp = new Date(userProfile.subscription_expires_at);
    if (!isNaN(exp.getTime())) return exp;
  }
  const baseDate = userProfile?.subscription_started_at
    ? new Date(userProfile.subscription_started_at)
    : userProfile?.created_at
      ? new Date(userProfile.created_at)
      : new Date();

  const nextReset = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  /* If that 30-day mark is in the past, roll forward to the next 30-day cycle */
  const now = new Date();
  while (nextReset < now) {
    nextReset.setTime(nextReset.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  return nextReset;
};

/* Read User Monthly Token / Message / Post Usage & Custom Limits */
export const getLocalQuotaUsage = (userId = 'default') => {
  try {
    const raw = localStorage.getItem(`saas_quota_usage_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        messagesUsed: Number(parsed.messagesUsed) || 0,
        tokensUsed: Number(parsed.tokensUsed) || 0,
        postsUsed: Number(parsed.postsUsed) || 0,
        customTokenLimit: parsed.customTokenLimit ? Number(parsed.customTokenLimit) : null,
        customMessageLimit: parsed.customMessageLimit ? Number(parsed.customMessageLimit) : null,
        customPostLimit: parsed.customPostLimit ? Number(parsed.customPostLimit) : null,
        nextResetAt: parsed.nextResetAt || null
      };
    }
  } catch {
    /* ignore parse error */
  }
  return {
    messagesUsed: 0,
    tokensUsed: 0,
    postsUsed: 0,
    customTokenLimit: null,
    customMessageLimit: null,
    customPostLimit: null,
    nextResetAt: null
  };
};

/* Sync User Quota Usage from Supabase platform_settings (and backfill local usage if Supabase is behind) */
export const fetchSupabaseQuotaUsage = async (userId) => {
  const localUser = getLocalQuotaUsage(userId);
  const localDefault = userId && userId !== 'default' ? getLocalQuotaUsage('default') : null;
  const bestLocal =
    localDefault &&
    (localDefault.tokensUsed > localUser.tokensUsed ||
      localDefault.messagesUsed > localUser.messagesUsed ||
      localDefault.postsUsed > localUser.postsUsed)
      ? {
          ...localUser,
          messagesUsed: Math.max(localUser.messagesUsed, localDefault.messagesUsed),
          tokensUsed: Math.max(localUser.tokensUsed, localDefault.tokensUsed),
          postsUsed: Math.max(localUser.postsUsed, localDefault.postsUsed)
        }
      : localUser;

  if (!isSupabaseConfigured() || !userId || userId === 'default') {
    return bestLocal;
  }

  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', `quota_usage_${userId}`)
      .maybeSingle();

    if (data?.setting_value) {
      const parsed = JSON.parse(data.setting_value);
      const dbUsage = {
        messagesUsed: Number(parsed.messagesUsed) || 0,
        tokensUsed: Number(parsed.tokensUsed) || 0,
        postsUsed: Number(parsed.postsUsed) || 0,
        customTokenLimit: parsed.customTokenLimit ? Number(parsed.customTokenLimit) : null,
        customMessageLimit: parsed.customMessageLimit ? Number(parsed.customMessageLimit) : null,
        customPostLimit: parsed.customPostLimit ? Number(parsed.customPostLimit) : null,
        nextResetAt: parsed.nextResetAt || null
      };

      /* If local browser recorded usage that wasn't synced to Supabase yet, merge max values up to Supabase */
      const needsBackfill =
        bestLocal.tokensUsed > dbUsage.tokensUsed ||
        bestLocal.messagesUsed > dbUsage.messagesUsed ||
        bestLocal.postsUsed > dbUsage.postsUsed;

      if (needsBackfill) {
        const merged = {
          ...dbUsage,
          messagesUsed: Math.max(dbUsage.messagesUsed, bestLocal.messagesUsed),
          tokensUsed: Math.max(dbUsage.tokensUsed, bestLocal.tokensUsed),
          postsUsed: Math.max(dbUsage.postsUsed, bestLocal.postsUsed),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(`saas_quota_usage_${userId}`, JSON.stringify(merged));
        await supabase.from('platform_settings').upsert(
          {
            setting_key: `quota_usage_${userId}`,
            setting_value: JSON.stringify(merged),
            updated_at: new Date().toISOString()
          },
          { onConflict: 'setting_key' }
        );
        return merged;
      }

      localStorage.setItem(`saas_quota_usage_${userId}`, JSON.stringify(dbUsage));
      return dbUsage;
    }

    /* No row in Supabase yet: if user has any local usage, persist it to Supabase so Admin Panel sees it */
    if (bestLocal.tokensUsed > 0 || bestLocal.messagesUsed > 0 || bestLocal.postsUsed > 0) {
      const initialSync = { ...bestLocal, updatedAt: new Date().toISOString() };
      localStorage.setItem(`saas_quota_usage_${userId}`, JSON.stringify(initialSync));
      await supabase.from('platform_settings').upsert(
        {
          setting_key: `quota_usage_${userId}`,
          setting_value: JSON.stringify(initialSync),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'setting_key' }
      );
      return initialSync;
    }
  } catch {
    /* fallback to local */
  }
  return bestLocal;
};

/* Get Effective Quota Limits + Remaining Counts for a User */
export const getEffectiveUserQuota = (userProfile = null, usageOverride = null) => {
  const basePlan = getPlanQuotaConfig(userProfile?.plan_tier || 'free');
  const usage = usageOverride || getLocalQuotaUsage(userProfile?.id || 'default');

  const tokenLimit = usage.customTokenLimit || basePlan.tokenLimit;
  const messageLimit = usage.customMessageLimit || basePlan.messageLimit;
  const postLimit = usage.customPostLimit || basePlan.postLimit;

  const tokensUsed = Number(usage.tokensUsed) || 0;
  const messagesUsed = Number(usage.messagesUsed) || 0;
  const postsUsed = Number(usage.postsUsed) || 0;

  const tokensRemaining = Math.max(0, tokenLimit - tokensUsed);
  const messagesRemaining = Math.max(0, messageLimit - messagesUsed);
  const postsRemaining = Math.max(0, postLimit - postsUsed);

  const isTokenExhausted = tokensUsed >= tokenLimit;
  const isMessageExhausted = messagesUsed >= messageLimit;
  const nextResetDate = getNextTokenResetDate(userProfile, usage);

  return {
    planName: basePlan.name,
    priceBDT: basePlan.priceBDT,
    tokenLimit,
    tokensUsed,
    tokensRemaining,
    isTokenExhausted,
    messageLimit,
    messagesUsed,
    messagesRemaining,
    isMessageExhausted,
    postLimit,
    postsUsed,
    postsRemaining,
    nextResetDate
  };
};

export const incrementQuotaUsage = async (userId = 'default', { messages = 0, tokens = 0, posts = 0 }) => {
  const current = await fetchSupabaseQuotaUsage(userId);
  const updated = {
    ...current,
    messagesUsed: current.messagesUsed + messages,
    tokensUsed: current.tokensUsed + tokens,
    postsUsed: current.postsUsed + posts,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(`saas_quota_usage_${userId}`, JSON.stringify(updated));

  if (isSupabaseConfigured() && userId && userId !== 'default') {
    try {
      await supabase.from('platform_settings').upsert(
        {
          setting_key: `quota_usage_${userId}`,
          setting_value: JSON.stringify(updated),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'setting_key' }
      );
    } catch {
      /* ignore sync error */
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('saas-quota-updated', { detail: { userId, usage: updated } }));
  }

  return updated;
};

/* Native browser .docx, .txt, .md, .csv, and .json document text extractor */
export const extractTextFromDocument = async (file) => {
  if (!file) return '';
  const fileName = (file.name || '').toLowerCase();

  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.json')
  ) {
    return (await file.text()).trim();
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
};

/* Compile structured client business profile + uploaded document text for business_pages.knowledge_base */
export const buildCompiledBusinessKnowledge = (profile = {}, docText = '') => {
  const lines = [];
  lines.push('# Official Business Identity & Brand Profile');
  if (profile.brandName) lines.push(`- Brand / Page Name: ${profile.brandName}`);
  if (profile.businessCategory) lines.push(`- Business Category / Industry: ${profile.businessCategory}`);
  if (profile.tagline) lines.push(`- Tagline / Value Proposition: ${profile.tagline}`);
  if (profile.servicesOffered) lines.push(`- Products & Core Services: ${profile.servicesOffered}`);
  if (profile.preferredLanguage) lines.push(`- Preferred Customer Language: ${profile.preferredLanguage}`);
  if (profile.supportPhone) lines.push(`- Support Phone / WhatsApp: ${profile.supportPhone}`);
  if (profile.supportEmail) lines.push(`- Support Email: ${profile.supportEmail}`);
  if (profile.websiteUrl) lines.push(`- Website: ${profile.websiteUrl}`);
  if (profile.address) lines.push(`- Office / Store Location: ${profile.address}`);
  if (profile.workingHours) lines.push(`- Working Hours: ${profile.workingHours}`);
  if (profile.paymentMethods) lines.push(`- Accepted Payment Methods: ${profile.paymentMethods}`);
  if (profile.deliveryPolicy) lines.push(`- Delivery / Onboarding Policy: ${profile.deliveryPolicy}`);
  if (profile.aiVerifiedSummary) {
    lines.push('\n# AI-Verified Business Brief');
    lines.push(profile.aiVerifiedSummary);
  }
  if (docText && docText.trim()) {
    lines.push('\n# Uploaded Business Requirements, FAQ & Catalog Details');
    lines.push(docText.trim());
  }
  return lines.join('\n').trim();
};

/* Resolve dynamic placeholders in Admin Master Prompt for a specific Business Page */
export const resolveDynamicSystemPrompt = (templatePrompt = '', page = {}, businessProfile = null) => {
  const brandName = businessProfile?.brandName || page?.page_name || 'our business';
  const category = businessProfile?.businessCategory || 'products and services';
  const services = businessProfile?.servicesOffered || 'our listed packages and products';

  let resolved = String(templatePrompt || '').trim();
  if (!resolved) {
    resolved = `You are an official Senior Sales Consultant and Customer Support Representative of "${brandName}". Guide customers politely, answer FAQs accurately, recommend suitable packages from the Products Sheet, and confirm Customer Name, Phone Number, and Selected Package before recording an order.`;
  }

  resolved = resolved
    .replace(/\{\{\s*(business_name|brand_name|page_name)\s*\}\}/gi, brandName)
    .replace(/\{\{\s*business_category\s*\}\}/gi, category)
    .replace(/\{\{\s*services_offered\s*\}\}/gi, services);

  const kbText = (page?.knowledge_base || '').trim();
  const guardBlock = [
    '# Mandatory Brand Identity Rules',
    `- You are the official AI Customer Support & Sales Representative of "${brandName}".`,
    '- NEVER say you are Gemini, Google AI, OpenAI, ChatGPT, or an AI model.',
    `- If anyone asks who you are (e.g. "কে?", "তুমি কে?", "who are you?"), ALWAYS introduce yourself politely as an official representative of ${brandName}.`,
    `- Base all pricing, product details, and FAQs strictly on ${brandName}'s Business Profile and uploaded requirements below.`
  ].join('\n');

  return `${guardBlock}\n\n${resolved}${kbText ? `\n\n${kbText}` : ''}`;
};

/* Analyze uploaded business document / form using Gemini 2.5 Flash to auto-verify & structure brand info */
export const analyzeBusinessWithGemini = async ({
  apiKey,
  fileText = '',
  currentProfile = {},
  pageName = '',
  userId = 'default'
}) => {
  const cleanKey = String(apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Gemini API Key is not configured yet. Please ask Super Admin to save the Global Gemini API Key in Master APIs.');
  }

  const combinedInput = [
    pageName ? `Connected Page Name: ${pageName}` : '',
    currentProfile.brandName ? `Brand Name Input: ${currentProfile.brandName}` : '',
    currentProfile.businessCategory ? `Category Input: ${currentProfile.businessCategory}` : '',
    currentProfile.servicesOffered ? `Services Input: ${currentProfile.servicesOffered}` : '',
    fileText ? `Uploaded Business Document / Notes:\n${fileText.slice(0, 14000)}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  if (!combinedInput.trim()) {
    throw new Error('Please upload a business file (.docx/.txt) or fill in some business details first.');
  }

  const extractionPrompt = `Analyze the following client business details and uploaded requirements document. Extract and verify clean, accurate structured business fields for an omnichannel AI sales agent. Keep values concise, factual, and preserve Bengali/English wording accurately. Do not invent contact info or prices that are not present.\n\nReturn ONLY a JSON object with keys:\nbrandName, businessCategory, tagline, servicesOffered, supportPhone, supportEmail, websiteUrl, address, workingHours, paymentMethods, deliveryPolicy, preferredLanguage, aiVerifiedSummary.\n\nInput Data:\n${combinedInput}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || `Gemini API Error (HTTP ${res.status})`);
  }

  const data = await res.json();
  const totalTokens = Number(data?.usageMetadata?.totalTokenCount) || 450;
  await incrementQuotaUsage(userId, { messages: 0, tokens: totalTokens, posts: 0 });

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(rawText);
  return {
    extracted: {
      brandName: parsed.brandName || currentProfile.brandName || pageName || '',
      businessCategory: parsed.businessCategory || currentProfile.businessCategory || '',
      tagline: parsed.tagline || currentProfile.tagline || '',
      servicesOffered: parsed.servicesOffered || currentProfile.servicesOffered || '',
      supportPhone: parsed.supportPhone || currentProfile.supportPhone || '',
      supportEmail: parsed.supportEmail || currentProfile.supportEmail || '',
      websiteUrl: parsed.websiteUrl || currentProfile.websiteUrl || '',
      address: parsed.address || currentProfile.address || '',
      workingHours: parsed.workingHours || currentProfile.workingHours || '',
      paymentMethods: parsed.paymentMethods || currentProfile.paymentMethods || '',
      deliveryPolicy: parsed.deliveryPolicy || currentProfile.deliveryPolicy || '',
      preferredLanguage: parsed.preferredLanguage || currentProfile.preferredLanguage || 'Auto (Bengali / Banglish / English)',
      aiVerifiedSummary: parsed.aiVerifiedSummary || ''
    },
    tokensUsed: totalTokens
  };
};
