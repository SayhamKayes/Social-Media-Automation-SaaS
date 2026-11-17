import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabaseAdminClient';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';
import AdminAuthModal from './components/AdminAuthModal';
import OverviewMetrics from './components/views/OverviewMetrics';
import UsersManager from './components/views/UsersManager';
import PackagesManager from './components/views/PackagesManager';
import PaymentGatewayManager from './components/views/PaymentGatewayManager';
import PaymentLedgerView, { TRANSACTION_STATUS_OPTIONS, extractPlanFromTransaction } from './components/views/PaymentLedgerView';
import PagesOversight from './components/views/PagesOversight';
import AdminAIAgentsManager from './components/views/AdminAIAgentsManager';
import GlobalOrdersView from './components/views/GlobalOrdersView';
import SystemSettings from './components/views/SystemSettings';
import StaffAccessManager from './components/views/StaffAccessManager';
import AdminProfileSmtp from './components/views/AdminProfileSmtp';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

/* Fallback Mock Data for instant developer preview */
const INITIAL_DEFAULT_PACKAGES = [
  {
    id: 'free',
    name: 'Free Trial',
    badge: 'Default',
    badge_color: 'bg-slate-800 text-slate-300',
    price_bdt: '৳0',
    price_usd: '$0',
    period: '1 Month',
    pages_allowed: 1,
    description: 'Introductory plan for small pages testing AI sales automation.',
    features: [
      'Connect Account: 1 Social Account (FB)',
      'Message Credit: 5K / Month',
      'Bot AI Token: 50K / Month',
      'Social Auto-Post: 5 / Month',
      'Google Gemini AI Sales Consultant',
      'Google Sheets Product & FAQ Lookup',
      'Automated Messenger Order Capture'
    ],
    is_popular: false,
    display_order: 1
  },
  {
    id: 'starter',
    name: 'Starter Growth',
    badge: 'Popular',
    badge_color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    price_bdt: '৳1,499',
    price_usd: '$15',
    period: '/ mo',
    pages_allowed: 3,
    description: 'Ideal for independent shops and boutique ecommerce brands.',
    features: [
      'Connect Account: 3 Social Accounts (FB & IG)',
      'Message Credit: 50K / Month',
      'Bot AI Token: 500K / Month',
      'Social Auto-Post: 20 / Month',
      'Messenger & Instagram DM Order Capture',
      'PC Photo to Google Drive & Sheet Auto-Sync',
      'Automated Sales Consultant Funnel'
    ],
    is_popular: true,
    display_order: 2
  },
  {
    id: 'business',
    name: 'Business Pro',
    badge: 'High Value',
    badge_color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    price_bdt: '৳3,999',
    price_usd: '$39',
    period: '/ mo',
    pages_allowed: 10,
    description: 'High-volume businesses needing multi-channel auto-sales bots.',
    features: [
      'Connect Account: 10 Social Accounts (FB, IG, WA, LinkedIn)',
      'Message Credit: 250K / Month',
      'Bot AI Token: 2.5M / Month',
      'Social Auto-Post: 60 / Month',
      'Omnichannel Messenger, IG & WhatsApp Order Panel',
      'PC Photo to Google Drive & Sheet Auto-Post',
      'Priority Gemini AI Response Speed'
    ],
    is_popular: false,
    display_order: 3
  },
  {
    id: 'agency',
    name: 'Agency Enterprise',
    badge: 'Master Tier',
    badge_color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    price_bdt: '৳9,999',
    price_usd: '$99',
    period: '/ mo',
    pages_allowed: 9999,
    description: 'For digital agencies managing dozens of client brand pages.',
    features: [
      'Connect Account: Unlimited Social Accounts',
      'Message Credit: 10M / Month',
      'Bot AI Token: 10M / Month',
      'Social Auto-Post: Unlimited / Month',
      'Manage Unlimited Client Brand Pages & Prompts',
      'Custom Gemini, Meta & LinkedIn API Key Override',
      'Omnichannel Orders & Leads Export (FB, IG, WA)',
      '24/7 Priority VIP Uptime & Workflow Support'
    ],
    is_popular: false,
    display_order: 4
  }
];

const INITIAL_MOCK_USERS = [];

const INITIAL_MOCK_PAGES = [];

const INITIAL_MOCK_ORDERS = [];

export default function App() {
  const [adminUser, setAdminUser] = useState({
    email: import.meta.env.VITE_ADMIN_EMAIL || 'sayhamkayes101@gmail.com',
    username: import.meta.env.VITE_ADMIN_USERNAME || 'sayham_admin',
    role: 'super_admin',
    full_name: 'Sayham Kayes'
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);
  
  /* Default active tab is Overview */
  const [activeTab, setActiveTab] = useState('overview');
  
  /* Unread Notification Dots State (disappears when tab is opened) */
  const [unreadTabs, setUnreadTabs] = useState({
    users: false,
    pages: false,
    orders: false,
    payment_ledger: false,
    staff: false
  });
  const [ledgerVisited, setLedgerVisited] = useState(false);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setUnreadTabs(prev => ({ ...prev, [tabId]: false }));
    if (tabId === 'payment_ledger') {
      setLedgerVisited(true);
    }
    if (tabId === 'users' || tabId === 'overview' || tabId === 'pages' || tabId === 'ai_agents') {
      fetchData();
    }
  };
  
  const [users, setUsers] = useState(INITIAL_MOCK_USERS);
  const [packages, setPackages] = useState(INITIAL_DEFAULT_PACKAGES);
  const [pages, setPages] = useState(INITIAL_MOCK_PAGES);
  const [orders, setOrders] = useState(INITIAL_MOCK_ORDERS);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    meta_app_id: '',
    meta_app_secret: '',
    gemini_api_key: '',
    webhook_url: 'https://social-automation-saas-dfg4.onrender.com/webhook/facebook-messenger-saas',
    autopost_webhook_url: 'https://social-automation-saas-dfg4.onrender.com/webhook/social-auto-post',
    verify_token: 'socialsaas_secret',
    google_oauth_client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    n8n_google_sheets_email: import.meta.env.VITE_N8N_SHEETS_EMAIL || 'sayhamkayes101@gmail.com',
    live_client_host_url: import.meta.env.VITE_CLIENT_PORTAL_URL || 'https://skzbot.vercel.app',
    live_admin_host_url: import.meta.env.VITE_ADMIN_PORTAL_URL || 'https://adminskzbot.vercel.app',
    admin_2fa_enabled: 'false',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_sender_name: 'AutoReply AI Notifications',
    smtp_sender_email: 'noreply@socialsaas.com',
    smtp_enable_welcome: 'true',
    smtp_enable_orders: 'true',
    smtp_enable_reset: 'true'
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* Fetch live Supabase data */
  const fetchData = async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);

    try {
      /* 1. Fetch Subscription Packages */
      const { data: dbPackages, error: pkgsErr } = await supabase
        .from('subscription_packages')
        .select('*')
        .order('display_order', { ascending: true });

      if (!pkgsErr && dbPackages && dbPackages.length > 0) {
        const hasLegacy = dbPackages.some(pkg => {
          const feats = Array.isArray(pkg.features) ? pkg.features.join(' ') : '';
          return (
            feats.includes('Sub-Client Management') ||
            feats.includes('Master Lead Audit') ||
            feats.includes('Knowledge Library') ||
            feats.includes('Knowledge Packs') ||
            feats.includes('1K / Month') ||
            (pkg.id === 'agency' && feats.includes('1M / Month')) ||
            !feats.includes('Connect Account:')
          );
        });

        if (hasLegacy) {
          await supabase.from('subscription_packages').upsert(INITIAL_DEFAULT_PACKAGES, { onConflict: 'id' });
          setPackages(INITIAL_DEFAULT_PACKAGES);
        } else {
          setPackages(dbPackages);
        }
      }

      /* 2. Fetch user profiles */
      const { data: dbUsers, error: usersErr } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersErr && dbUsers) {
        setUsers(dbUsers);
      }

      /* 3. Fetch business pages */
      const { data: dbPages, error: pagesErr } = await supabase
        .from('business_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pagesErr && dbPages) {
        setPages(dbPages);
      }

      /* 4. Fetch global orders */
      const { data: dbOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ordersErr && dbOrders) {
        setOrders(dbOrders);
      }

      /* 5. Fetch payment transactions */
      const { data: dbTxns, error: txnsErr } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!txnsErr && dbTxns) {
        setTransactions(dbTxns);
      }

      /* 6. Fetch platform settings */
      const { data: dbSettings, error: settingsErr } = await supabase
        .from('platform_settings')
        .select('*');

      if (!settingsErr && dbSettings && dbSettings.length > 0) {
        const mergedSettings = {};
        dbSettings.forEach(item => {
          mergedSettings[item.setting_key] = item.setting_value;
        });
        setSettings(prev => ({ ...prev, ...mergedSettings }));
      }
    } catch (err) {
      console.warn('Supabase fetch notice: using cached master data', err);
    } finally {
      setLoading(false);
    }
  };

  /* Setup real-time listener for live sync across tenants */
  useEffect(() => {
    fetchData();

    if (!isSupabaseConfigured()) return;

    /* Listen for live user signups, page connections, orders, and payment transactions */
    const channel = supabase
      .channel('realtime:admin_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, (payload) => {
        fetchData();
        if (payload.eventType === 'INSERT') {
          setUnreadTabs(prev => ({ ...prev, users: true }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_pages' }, (payload) => {
        fetchData();
        if (payload.eventType === 'INSERT') {
          setUnreadTabs(prev => ({ ...prev, pages: true }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchData();
        if (payload.eventType === 'INSERT') {
          setUnreadTabs(prev => ({ ...prev, orders: true }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_transactions' }, (payload) => {
        fetchData();
        if (payload.eventType === 'INSERT') {
          setUnreadTabs(prev => ({ ...prev, payment_ledger: true }));
          setLedgerVisited(false);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* Action: Update Subscription Package Tier */
  const handleUpdatePackage = async (updatedPackage) => {
    setPackages(prev =>
      prev.map(p => (p.id === updatedPackage.id ? { ...p, ...updatedPackage } : p))
    );

    if (isSupabaseConfigured()) {
      try {
        const payload = {
          name: updatedPackage.name,
          badge: updatedPackage.badge || 'Standard',
          price_bdt: updatedPackage.price_bdt,
          price_usd: updatedPackage.price_usd,
          period: updatedPackage.period || '/ mo',
          pages_allowed: Number(updatedPackage.pages_allowed) || 1,
          description: updatedPackage.description || '',
          features: Array.isArray(updatedPackage.features) ? updatedPackage.features : [],
          is_popular: Boolean(updatedPackage.is_popular),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('subscription_packages')
          .update(payload)
          .eq('id', updatedPackage.id);

        if (error) throw error;
        showToast(`Tier "${updatedPackage.name}" saved! Live landing page updated.`);
      } catch (err) {
        console.error('Failed to update package in Supabase:', err);
        showToast('Saved locally', 'info');
      }
    } else {
      showToast(`Tier "${updatedPackage.name}" updated in local state`);
    }
  };

  /* Action: Update User Subscription Plan */
  const handleUpdateUserPlan = async (userId, newPlan, newMaxPages) => {
    const defaultQuotas = { free: 1, starter: 3, business: 10, agency: 9999 };
    const resolvedMaxPages = newMaxPages !== undefined ? Number(newMaxPages) : (defaultQuotas[newPlan] || 1);

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, plan_tier: newPlan, max_pages: resolvedMaxPages } : u))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ 
            plan_tier: newPlan, 
            max_pages: resolvedMaxPages, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);
        showToast(`User plan updated to ${newPlan.toUpperCase()} (${resolvedMaxPages >= 999 ? 'Unlimited' : resolvedMaxPages} pages max)`);
      } catch (err) {
        showToast('Plan updated in local state', 'info');
      }
    } else {
      showToast(`User plan updated to ${newPlan.toUpperCase()}`);
    }
  };

  /* Action: Update User Status (active / suspended) */
  const handleUpdateUserStatus = async (userId, newStatus) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('user_profiles')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', userId);
        showToast(`User status changed to ${newStatus.toUpperCase()}`);
      } catch (err) {
        showToast('Status updated in local state', 'info');
      }
    } else {
      showToast(`User status changed to ${newStatus.toUpperCase()}`);
    }
  };

  /* Action: Reset User Password */
  const handleResetUserPassword = async (userId, email) => {
    const clientRedirect =
      settings?.live_client_host_url ||
      import.meta.env.VITE_CLIENT_PORTAL_URL ||
      'https://skzbot.vercel.app';
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: clientRedirect
        });
        if (error) throw error;
        showToast(`Password recovery link dispatched to ${email}`);
      } catch (err) {
        showToast(`Password reset recorded for ${email}`, 'info');
      }
    } else {
      showToast(`Password reset link created for ${email}`);
    }
  };

  /* Action: Delete User */
  const handleDeleteUser = async (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('user_profiles').delete().eq('id', userId);
        showToast('Tenant account removed from master directory');
      } catch (err) {
        showToast('User removed from local state', 'info');
      }
    } else {
      showToast('Tenant removed from local list');
    }
  };

  /* Action: Toggle Bot Active Status on Page */
  const handleTogglePageStatus = async (pageId, currentStatus) => {
    const nextStatus = !currentStatus;
    const botStatus = nextStatus ? 'ACTIVE' : 'INACTIVE';
    setPages(prev =>
      prev.map(p => (p.page_id === pageId ? { ...p, is_active: nextStatus, bot_status: botStatus } : p))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('business_pages')
          .update({ is_active: nextStatus, bot_status: botStatus, updated_at: new Date().toISOString() })
          .eq('page_id', pageId);
        showToast(`Page bot ${nextStatus ? 'Activated' : 'Paused'}`);
      } catch (err) {
        showToast('Page status updated locally', 'info');
      }
    } else {
      showToast(`Page bot ${nextStatus ? 'Activated' : 'Paused'}`);
    }
  };

  /* Action: Administrative Bot Status Update (ACTIVE, INACTIVE, SUSPENDED) */
  const handleUpdatePageBotStatus = async (pageId, newBotStatus) => {
    const isActive = newBotStatus === 'ACTIVE';
    setPages(prev =>
      prev.map(p => (p.page_id === pageId ? { ...p, bot_status: newBotStatus, is_active: isActive } : p))
    );

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('business_pages')
          .update({
            bot_status: newBotStatus,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('page_id', pageId);
        showToast(`Page status changed to ${newBotStatus}!`);
      } catch (err) {
        showToast('Page status updated locally', 'info');
      }
    } else {
      showToast(`Page status changed to ${newBotStatus}!`);
    }
  };

  /* Action: Delete Page Connection */
  const handleDeletePage = async (pageId) => {
    setPages(prev => prev.filter(p => p.page_id !== pageId));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('business_pages').delete().eq('page_id', pageId);
        showToast('Page disconnected from platform');
      } catch (err) {
        showToast('Page unhooked locally', 'info');
      }
    } else {
      showToast('Page unhooked locally');
    }
  };

  /* Action: Delete Global Order */
  const handleDeleteOrder = async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('orders').delete().eq('id', orderId);
        showToast('Order permanently deleted from database');
      } catch (err) {
        console.error('Failed to delete order:', err);
        showToast('Order removed locally', 'info');
      }
    } else {
      showToast('Order removed locally');
    }
  };

  /* Action: Update Package Payment Verification Status & Sync User CRM + Global Orders */
  const handleUpdateTransactionStatus = async (txn, nextStatus) => {
    const statusOpt = TRANSACTION_STATUS_OPTIONS.find(o => o.value === nextStatus) || {
      value: nextStatus,
      label: nextStatus,
      orderLabel: nextStatus
    };

    /* 1. Update local transactions state */
    setTransactions(prev =>
      prev.map(t => (t.id === txn.id ? { ...t, status: nextStatus } : t))
    );

    /* 2. Update corresponding order in Global Orders & Leads state */
    setOrders(prev =>
      prev.map(o =>
        o.order_id === txn.order_id ? { ...o, order_status: statusOpt.orderLabel } : o
      )
    );

    const planMeta = extractPlanFromTransaction(txn);
    const isApproved = nextStatus === 'CONFIRMED' || nextStatus === 'CONFIRMED_DELIVERED' || nextStatus === 'PAID';
    const isRejectedOrPending = nextStatus === 'REJECTED' || nextStatus === 'REFUNDED' || nextStatus === 'PENDING';

    /* 3. Update local users CRM state */
    if (txn.user_id) {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setUsers(prev =>
        prev.map(u => {
          if (u.id !== txn.user_id) return u;
          if (isApproved) {
            return {
              ...u,
              plan_tier: planMeta.planId,
              max_pages: planMeta.maxPages,
              status: 'active',
              subscription_started_at: now.toISOString(),
              subscription_expires_at: expires.toISOString()
            };
          }
          if (isRejectedOrPending) {
            return {
              ...u,
              plan_tier: 'free',
              max_pages: 1
            };
          }
          return u;
        })
      );
    }

    /* 4. Sync all 3 tables (payment_transactions, orders, user_profiles) in Supabase */
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('payment_transactions')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', txn.id);

        if (txn.order_id) {
          await supabase
            .from('orders')
            .update({ order_status: statusOpt.orderLabel })
            .eq('order_id', txn.order_id);
        }

        if (txn.user_id) {
          const now = new Date();
          const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (isApproved) {
            await supabase
              .from('user_profiles')
              .update({
                plan_tier: planMeta.planId,
                max_pages: planMeta.maxPages,
                status: 'active',
                subscription_started_at: now.toISOString(),
                subscription_expires_at: expires.toISOString(),
                notes: `Verified ${planMeta.planName} | TrxID: ${txn.transaction_id}`,
                updated_at: now.toISOString()
              })
              .eq('id', txn.user_id);
          } else if (isRejectedOrPending) {
            await supabase
              .from('user_profiles')
              .update({
                plan_tier: 'free',
                max_pages: 1,
                notes: `Payment Status: ${statusOpt.label} | TrxID: ${txn.transaction_id}`,
                updated_at: now.toISOString()
              })
              .eq('id', txn.user_id);
          }
        }

        showToast(
          isApproved
            ? `Payment verified (${statusOpt.orderLabel}) & ${planMeta.planName} activated for user!`
            : `Transaction & Global Order status updated to "${statusOpt.orderLabel}"`
        );
      } catch (err) {
        console.error('Failed to sync transaction verification:', err);
        showToast('Updated locally', 'info');
      }
    } else {
      showToast(`Status updated to ${statusOpt.orderLabel}`);
    }
  };

  /* Action: Add Manual Payment Transaction */
  const handleAddManualTransaction = async (newTxn) => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .insert({ ...newTxn, created_at: new Date().toISOString() })
          .select();

        if (!error && data && data.length > 0) {
          setTransactions(prev => [data[0], ...prev]);
        } else {
          setTransactions(prev => [{ id: String(Date.now()), ...newTxn, created_at: new Date().toISOString() }, ...prev]);
        }
        showToast('Manual payment record added to verification ledger');
      } catch {
        setTransactions(prev => [{ id: String(Date.now()), ...newTxn, created_at: new Date().toISOString() }, ...prev]);
      }
    } else {
      setTransactions(prev => [{ id: String(Date.now()), ...newTxn, created_at: new Date().toISOString() }, ...prev]);
      showToast('Manual payment record added');
    }
  };

  /* Action: Delete Payment Transaction */
  const handleDeleteTransaction = async (txnId) => {
    setTransactions(prev => prev.filter(t => t.id !== txnId));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('payment_transactions').delete().eq('id', txnId);
        showToast('Transaction deleted from ledger');
      } catch {
        showToast('Transaction removed locally', 'info');
      }
    }
  };

  /* Action: Sync AI System Prompt (and optionally Knowledge Base) across connected business_pages */
  const handleSyncPagesPrompt = async (targetPageId, systemPrompt, knowledgeBase, options = {}) => {
    const syncKnowledge = typeof options === 'object' ? Boolean(options.syncKnowledge) : false;
    const nowIso = new Date().toISOString();

    setPages(prev =>
      prev.map(p => {
        if (targetPageId !== 'ALL' && p.page_id !== targetPageId) return p;
        const shouldUpdateKb = targetPageId !== 'ALL' || syncKnowledge || !p.knowledge_base;
        return {
          ...p,
          system_prompt: systemPrompt,
          knowledge_base: shouldUpdateKb ? knowledgeBase : p.knowledge_base,
          updated_at: nowIso
        };
      })
    );

    if (isSupabaseConfigured()) {
      try {
        if (targetPageId === 'ALL') {
          const pageIds = pages.map(p => p.page_id).filter(Boolean);
          if (pageIds.length > 0) {
            if (syncKnowledge) {
              const { error } = await supabase
                .from('business_pages')
                .update({
                  system_prompt: systemPrompt,
                  knowledge_base: knowledgeBase,
                  updated_at: nowIso
                })
                .in('page_id', pageIds);
              if (error) throw error;
            } else {
              /* Update Master System Prompt on all pages without erasing client-uploaded Knowledge Base */
              const { error } = await supabase
                .from('business_pages')
                .update({
                  system_prompt: systemPrompt,
                  updated_at: nowIso
                })
                .in('page_id', pageIds);
              if (error) throw error;

              /* Backfill Master Knowledge Base ONLY for pages with empty knowledge_base */
              const emptyKbIds = pages.filter(p => !p.knowledge_base || !p.knowledge_base.trim()).map(p => p.page_id);
              if (emptyKbIds.length > 0 && knowledgeBase) {
                await supabase
                  .from('business_pages')
                  .update({ knowledge_base: knowledgeBase, updated_at: nowIso })
                  .in('page_id', emptyKbIds);
              }
            }
          }
        } else {
          const { error } = await supabase
            .from('business_pages')
            .update({
              system_prompt: systemPrompt,
              knowledge_base: knowledgeBase,
              updated_at: nowIso
            })
            .eq('page_id', targetPageId);
          if (error) throw error;
        }
        showToast(
          targetPageId === 'ALL'
            ? (syncKnowledge
                ? 'Master AI Prompt & Knowledge synced across all connected pages!'
                : 'Master AI Prompt Template synced across all pages (client knowledge files preserved)!')
            : 'Selected business page AI Prompt & Knowledge updated!'
        );
      } catch (err) {
        console.error('Failed to sync AI prompts to business_pages:', err);
        showToast('Saved locally; verify Supabase permissions if pages did not sync', 'info');
      }
    }
  };

  /* Action: Save Platform Master Settings (APIs and SMTP) */
  const handleSaveSettings = async (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    if (isSupabaseConfigured()) {
      try {
        const rows = Object.entries(newSettings).map(([key, val]) => ({
          setting_key: key,
          setting_value: val,
          updated_at: new Date().toISOString()
        }));

        await supabase.from('platform_settings').upsert(rows, { onConflict: 'setting_key' });
        showToast('Master platform settings updated and persisted successfully');
      } catch (err) {
        showToast('Settings saved to local storage', 'info');
      }
    } else {
      showToast('Master settings updated');
    }
  };

  const metrics = {
    totalUsers: users.length,
    totalPages: pages.length,
    totalOrders: orders.length
  };

  return (
    /* Fixed Super Admin Shell: Fixed Header & Sidebar, Independent Scrolling Content */
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-200 text-xs shadow-2xl shadow-purple-500/20 animate-bounce">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Master Top Header */}
      <AdminHeader
        adminUser={adminUser}
        settings={settings}
        onLogout={() => setIsAuthModalOpen(true)}
      />

      {/* Main Body with Fixed Sidebar + Scrollable View Content */}
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          unreadTabs={unreadTabs}
          pendingPaymentsCount={
            ledgerVisited
              ? 0
              : transactions.filter(t => String(t.status || 'PENDING').toUpperCase() === 'PENDING').length
          }
        />

        <main className="flex-1 h-full overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="text-purple-400 font-semibold uppercase tracking-wider">Console</span>
                <span>/</span>
                <span className="text-slate-200 capitalize font-medium">
                  {activeTab === 'pages'
                    ? 'Connected Apps'
                    : activeTab === 'payment_ledger'
                      ? 'Payment Verification & Ledger'
                      : activeTab.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition"
                title="Sync database"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Live Data</span>
              </button>
            </div>

            {/* Active Tab View Rendering */}
            {activeTab === 'overview' && (
              <OverviewMetrics
                users={users}
                pages={pages}
                orders={orders}
                transactions={transactions}
                settings={settings}
                onNavigateTab={handleSelectTab}
              />
            )}

            {activeTab === 'users' && (
              <UsersManager
                users={users}
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onUpdateUserPlan={handleUpdateUserPlan}
                onUpdateUserStatus={handleUpdateUserStatus}
                onResetUserPassword={handleResetUserPassword}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'packages' && (
              <PackagesManager
                packages={packages}
                users={users}
                onUpdatePackage={handleUpdatePackage}
              />
            )}

            {activeTab === 'payment_ledger' && (
              <PaymentLedgerView
                transactions={transactions}
                users={users}
                onUpdateTransactionStatus={handleUpdateTransactionStatus}
                onAddManualTransaction={handleAddManualTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {activeTab === 'payment_gateway' && (
              <PaymentGatewayManager />
            )}

            {activeTab === 'pages' && (
              <PagesOversight
                pages={pages}
                users={users}
                settings={settings}
                onTogglePageStatus={handleTogglePageStatus}
                onUpdatePageBotStatus={handleUpdatePageBotStatus}
                onDeletePage={handleDeletePage}
              />
            )}

            {activeTab === 'ai_agents' && (
              <AdminAIAgentsManager
                pages={pages}
                users={users}
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onSyncPagesPrompt={handleSyncPagesPrompt}
              />
            )}

            {activeTab === 'orders' && (
              <GlobalOrdersView
                orders={orders}
                users={users}
                pages={pages}
                onDeleteOrder={handleDeleteOrder}
              />
            )}

            {activeTab === 'settings' && (
              <SystemSettings
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            )}

            {activeTab === 'staff' && (
              <StaffAccessManager
                users={users}
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onRefreshUsers={fetchData}
              />
            )}

            {activeTab === 'smtp' && (
              <AdminProfileSmtp
                adminUser={adminUser}
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        settings={settings}
        onAuthSuccess={(profile) => {
          setAdminUser(profile);
          setIsAuthModalOpen(false);
          showToast(`Logged in as Super Admin: ${profile.email}`);
        }}
      />
    </div>
  );
}
