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

/* Sync User Quota Usage from Supabase platform_settings */
export const fetchSupabaseQuotaUsage = async (userId) => {
  if (!isSupabaseConfigured() || !userId || userId === 'default') {
    return getLocalQuotaUsage(userId);
  }
  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', `quota_usage_${userId}`)
      .maybeSingle();

    if (data?.setting_value) {
      const parsed = JSON.parse(data.setting_value);
      const normalized = {
        messagesUsed: Number(parsed.messagesUsed) || 0,
        tokensUsed: Number(parsed.tokensUsed) || 0,
        postsUsed: Number(parsed.postsUsed) || 0,
        customTokenLimit: parsed.customTokenLimit ? Number(parsed.customTokenLimit) : null,
        customMessageLimit: parsed.customMessageLimit ? Number(parsed.customMessageLimit) : null,
        customPostLimit: parsed.customPostLimit ? Number(parsed.customPostLimit) : null,
        nextResetAt: parsed.nextResetAt || null
      };
      localStorage.setItem(`saas_quota_usage_${userId}`, JSON.stringify(normalized));
      return normalized;
    }
  } catch {
    /* fallback to local */
  }
  return getLocalQuotaUsage(userId);
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

  return updated;
};
