import React, { useState, useEffect } from 'react';
import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import HowItWorks from './components/landing/HowItWorks';
import Pricing from './components/landing/Pricing';
import Footer from './components/landing/Footer';
import BackToTop from './components/landing/BackToTop';
import AuthModal from './components/auth/AuthModal';

import AdminNavbar from './components/admin/AdminNavbar';
import Sidebar from './components/admin/Sidebar';
import DashboardOverview from './components/admin/DashboardOverview';
import SocialMediaManager from './components/admin/SocialMediaManager';
import AutoPostScheduler from './components/admin/AutoPostScheduler';
import ApiIntegrations from './components/admin/ApiIntegrations';
import AIAgentConfig from './components/admin/AIAgentConfig';
import OrdersManager from './components/admin/OrdersManager';
import TestChatSimulator from './components/admin/TestChatSimulator';
import UserProfile from './components/admin/UserProfile';
import SubscriptionCheckoutModal from './components/checkout/SubscriptionCheckoutModal';

import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

export default function App() {
  /* Check initial path on page load (/dashboard or /admin) */
  const isDashboardPath = () => {
    return window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin');
  };

  const [currentView, setCurrentView] = useState(isDashboardPath() ? 'dashboard' : 'landing');
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [selectedPlanForAuth, setSelectedPlanForAuth] = useState('free');
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    plan_tier: 'free',
    max_pages: 1,
    role: 'user',
    status: 'active'
  });

  /* Data states */
  const [pages, setPages] = useState([]);
  const [orders, setOrders] = useState([]);

  /* URL Path Synchronizer helper */
  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      window.history.pushState({ view: 'dashboard' }, '', '/dashboard');
    } else {
      window.history.pushState({ view: 'landing' }, '', '/');
    }
  };

  /* Listen to browser Back/Forward buttons */
  useEffect(() => {
    const handlePopState = () => {
      if (isDashboardPath()) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /* Check Supabase Auth state on mount */
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadUserData(session.user.id);
        } else {
          loadMockData();
          if (isDashboardPath()) {
            setIsAuthModalOpen(true);
            setAuthMode('login');
          }
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          loadUserData(session.user.id);
        } else {
          setUser(null);
          loadMockData();
        }
      });

      return () => subscription?.unsubscribe();
    } else {
      loadMockData();
    }
  }, []);

  const loadMockData = () => {
    setUserProfile({
      plan_tier: 'free',
      max_pages: 1,
      role: 'user',
      status: 'active'
    });
    setPages([]);
    setOrders([]);
  };

  const loadUserData = async (userId) => {
    try {
      /* Load user profile and subscription tier */
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setUserProfile(profileData);
      } else {
        setUserProfile({
          plan_tier: 'free',
          max_pages: 1,
          role: 'user',
          status: 'active'
        });
      }

      /* Load business pages */
      const { data: pagesData } = await supabase
        .from('business_pages')
        .select('*')
        .eq('user_id', userId);

      const loadedPages = pagesData || [];
      setPages(loadedPages);

      /* Load orders belonging to user_id OR any of the user's connected page_ids */
      const pageIdList = loadedPages.map(p => p.page_id).filter(Boolean);
      let rawOrders = [];

      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (userOrders) {
        rawOrders = [...userOrders];
      }

      if (pageIdList.length > 0) {
        const { data: pageOrders } = await supabase
          .from('orders')
          .select('*')
          .in('page_id', pageIdList)
          .order('created_at', { ascending: false });

        if (pageOrders) {
          const existingIds = new Set(rawOrders.map(o => o.id || o.order_id));
          pageOrders.forEach(po => {
            if (!existingIds.has(po.id || po.order_id)) {
              rawOrders.push(po);
            }
          });
        }
      }

      /* Filter out platform account signup/subscription rows so store orders & revenue are 100% accurate */
      const storeOrders = rawOrders.filter(o => {
        const oid = String(o.order_id || '').toUpperCase();
        return !oid.startsWith('SIGNUP-') && !oid.startsWith('SUB-');
      });

      setOrders(storeOrders);
    } catch (err) {
      console.warn("Could not fetch Supabase data:", err);
      setPages([]);
      setOrders([]);
    }
  };

  /* Real-time subscription so Secured Orders, Revenue, and Plan status update instantaneously */
  useEffect(() => {
    if (!isSupabaseConfigured() || !user?.id) return;

    const channel = supabase
      .channel(`realtime:client_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadUserData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_pages' }, () => {
        loadUserData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `id=eq.${user.id}` }, () => {
        loadUserData(user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleOpenAuth = (mode = 'signup', planId = 'free') => {
    setAuthMode(mode);
    setSelectedPlanForAuth(planId);
    setIsAuthModalOpen(true);
  };

  const handleOpenCheckout = (plan) => {
    setCheckoutPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = async () => {
    if (user && isSupabaseConfigured()) {
      await loadUserData(user.id);
    } else if (checkoutPlan) {
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setUserProfile(prev => ({
        ...prev,
        plan_tier: checkoutPlan.id,
        max_pages: checkoutPlan.pages_allowed || checkoutPlan.pages || 1,
        status: 'active',
        subscription_started_at: now.toISOString(),
        subscription_expires_at: expires.toISOString()
      }));
    }
    setIsCheckoutOpen(false);
    setCheckoutPlan(null);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    navigateTo('dashboard');
    if (isSupabaseConfigured()) {
      loadUserData(authenticatedUser.id);
    }
    if (checkoutPlan && checkoutPlan.id !== 'free') {
      setIsCheckoutOpen(true);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigateTo('landing');
  };

  /* Subscription Upgrade Handler */
  const handleUpdateSubscription = async (newPlanId, newMaxPages) => {
    setUserProfile(prev => ({
      ...prev,
      plan_tier: newPlanId,
      max_pages: newMaxPages
    }));

    if (isSupabaseConfigured() && user) {
      try {
        await supabase
          .from('user_profiles')
          .update({
            plan_tier: newPlanId,
            max_pages: newMaxPages,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (err) {
        console.error('Subscription update error:', err);
      }
    }
  };

  /* Business Page Operations with Plan Quota & Expiry Guard */
  const handleSavePage = async (pageData) => {
    const isNew = !pages.some(p => p.page_id === pageData.page_id);
    const maxAllowed = Number(userProfile?.max_pages) || 1;

    /* Enforce 30-day Free Trial & Subscription expiration check */
    const startedAt = userProfile?.subscription_started_at 
      ? new Date(userProfile.subscription_started_at)
      : userProfile?.created_at 
        ? new Date(userProfile.created_at)
        : new Date();
    const expiresAt = userProfile?.subscription_expires_at 
      ? new Date(userProfile.subscription_expires_at) 
      : new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > expiresAt;
    const isFree = (userProfile?.plan_tier || 'free').toLowerCase() === 'free';

    if (isExpired) {
      throw new Error(isFree 
        ? 'Your 1-Month Free Trial has expired. Please upgrade and pay for a package to connect pages and activate automated bot services.'
        : 'Your 30-Day Subscription has expired. Please renew your plan to connect or update pages.');
    }

    /* Enforce quota check if adding a new page */
    if (isNew && maxAllowed < 999 && pages.length >= maxAllowed) {
      throw new Error(`Quota Reached: Your current ${userProfile?.plan_tier?.toUpperCase() || 'FREE'} plan allows a maximum of ${maxAllowed} page(s). Please upgrade to connect more.`);
    }

    if (isSupabaseConfigured() && user) {
      let enrichedPageData = { ...pageData };

      /* Auto-inherit Master AI System Prompt & Knowledge Base from Admin AI Agents when connecting a new page */
      if (isNew) {
        try {
          const { data: masterSettings } = await supabase
            .from('platform_settings')
            .select('setting_key, setting_value')
            .in('setting_key', ['master_ai_system_prompt', 'master_ai_knowledge_base']);

          if (masterSettings && masterSettings.length > 0) {
            const promptRow = masterSettings.find(s => s.setting_key === 'master_ai_system_prompt');
            const kbRow = masterSettings.find(s => s.setting_key === 'master_ai_knowledge_base');
            if (promptRow?.setting_value) enrichedPageData.system_prompt = promptRow.setting_value;
            if (kbRow?.setting_value) enrichedPageData.knowledge_base = kbRow.setting_value;
          }
        } catch (err) {
          console.warn('Could not inherit master AI agent defaults:', err);
        }
      }

      const { data, error } = await supabase
        .from('business_pages')
        .upsert({
          ...enrichedPageData,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      setPages((prev) => {
        const index = prev.findIndex(p => p.page_id === pageData.page_id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = data[0];
          return updated;
        }
        return [data[0], ...prev];
      });
    } else {
      setPages((prev) => {
        const index = prev.findIndex(p => p.page_id === pageData.page_id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...pageData };
          return updated;
        }
        return [pageData, ...prev];
      });
    }
  };

  const handleDeletePage = async (pageId) => {
    if (isSupabaseConfigured() && user) {
      const { error } = await supabase
        .from('business_pages')
        .delete()
        .eq('page_id', pageId);

      if (error) throw error;
    }
    setPages((prev) => prev.filter(p => p.page_id !== pageId));
  };

  const handleAddOrder = async (newOrderData) => {
    if (isSupabaseConfigured() && user) {
      try {
        const dbPayload = {
          user_id: user.id,
          page_id: newOrderData.page_id || pages[0]?.page_id || null,
          order_id: newOrderData.order_id,
          customer_name: newOrderData.customer_name,
          phone_number: newOrderData.phone_number,
          email: newOrderData.email || null,
          selected_package: newOrderData.selected_package,
          selected_addons: newOrderData.selected_addons || null,
          total_amount_bdt: Number(newOrderData.total_amount_bdt) || 0,
          order_status: newOrderData.order_status || 'Confirmed',
          customer_requirements: newOrderData.customer_requirements || null
        };

        const { data, error } = await supabase
          .from('orders')
          .insert(dbPayload)
          .select();

        if (!error && data && data.length > 0) {
          setOrders((prev) => [{ ...data[0], channel: newOrderData.channel }, ...prev]);
          return;
        }
      } catch (err) {
        console.warn('Order insert notice:', err);
      }
    }
    setOrders((prev) => [{ id: `ord_${Date.now()}`, ...newOrderData }, ...prev]);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.order_id === orderId
          ? { ...o, order_status: newStatus }
          : o
      )
    );

    if (isSupabaseConfigured() && user) {
      try {
        await supabase
          .from('orders')
          .update({ order_status: newStatus })
          .or(`id.eq.${orderId},order_id.eq.${orderId}`);
      } catch (err) {
        console.warn('Update order status notice:', err);
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (isSupabaseConfigured() && user) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
        if (error) console.error('Order deletion error:', error);
      } catch (err) {
        console.error('Delete order failed:', err);
      }
    }
    setOrders((prev) => prev.filter(o => o.id !== orderId && o.order_id !== orderId));
  };

  const handleUpdatePageConfig = async (pageId, configUpdates) => {
    if (isSupabaseConfigured() && user) {
      const { data, error } = await supabase
        .from('business_pages')
        .update(configUpdates)
        .eq('page_id', pageId)
        .select();

      if (error) throw error;
      setPages((prev) => prev.map(p => p.page_id === pageId ? { ...p, ...configUpdates } : p));
    } else {
      setPages((prev) => prev.map(p => p.page_id === pageId ? { ...p, ...configUpdates } : p));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {currentView === 'landing' ? (
        <>
          <Navbar
            user={user}
            onOpenAuth={(mode) => handleOpenAuth(mode, 'free')}
            onGoToDashboard={() => navigateTo('dashboard')}
          />
          <main className="flex-grow">
            <Hero onGetStarted={() => user ? navigateTo('dashboard') : handleOpenAuth('signup', 'free')} />
            <Features />
            <HowItWorks />
            <Pricing
              user={user}
              userProfile={userProfile}
              onGoToDashboard={() => navigateTo('dashboard')}
              onSelectPlan={(selectedTier, isCurrentPlan) => {
                if (isCurrentPlan) {
                  navigateTo('dashboard');
                  return;
                }
                if (selectedTier.id === 'free') {
                  if (user) {
                    navigateTo('dashboard');
                  } else {
                    handleOpenAuth('signup', 'free');
                  }
                } else {
                  if (user) {
                    handleOpenCheckout(selectedTier);
                  } else {
                    setCheckoutPlan(selectedTier);
                    handleOpenAuth('signup', selectedTier.id);
                  }
                }
              }}
            />
          </main>
          <Footer />
          <BackToTop />
        </>
      ) : (
        /* Fixed Client Dashboard Shell: Fixed Sidebar + Full Width Smooth Scrolling Right Panel */
        <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
          <AdminNavbar
            user={user}
            userProfile={userProfile}
            onLogout={handleLogout}
            onGoToLanding={() => navigateTo('landing')}
          />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              activeTab={activeAdminTab}
              setActiveTab={setActiveAdminTab}
              ordersCount={orders.length}
            />
            <main className="flex-1 h-full overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
              <div className="w-full max-w-7xl mx-auto space-y-6">
                {activeAdminTab === 'overview' && (
                  <DashboardOverview
                    pages={pages}
                    orders={orders}
                    userProfile={userProfile}
                    onNavigate={setActiveAdminTab}
                  />
                )}
                {activeAdminTab === 'social-media' && (
                  <SocialMediaManager
                    pages={pages}
                    userProfile={userProfile}
                    onSavePage={handleSavePage}
                    onDeletePage={handleDeletePage}
                    onUpgradePlan={() => setActiveAdminTab('profile')}
                  />
                )}
                {activeAdminTab === 'auto-post' && (
                  <AutoPostScheduler
                    pages={pages}
                    userProfile={userProfile}
                  />
                )}
                {activeAdminTab === 'api-integrations' && (
                  <ApiIntegrations
                    pages={pages}
                  />
                )}
                {activeAdminTab === 'ai-config' && (
                  <AIAgentConfig
                    pages={pages}
                    userProfile={userProfile}
                    onUpdatePageConfig={handleUpdatePageConfig}
                    onUpgradePlan={() => setActiveAdminTab('profile')}
                  />
                )}
                {activeAdminTab === 'orders' && (
                  <OrdersManager
                    orders={orders}
                    pages={pages}
                    onAddOrder={handleAddOrder}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}
                {activeAdminTab === 'simulator' && (
                  <TestChatSimulator
                    selectedPage={pages[0]}
                    userProfile={userProfile}
                    onUpgradePlan={() => setActiveAdminTab('profile')}
                  />
                )}
                {activeAdminTab === 'profile' && (
                  <UserProfile
                    user={user}
                    userProfile={userProfile}
                    pages={pages}
                    onUpdateSubscription={handleUpdateSubscription}
                    onOpenCheckout={handleOpenCheckout}
                    onNavigateLandingPricing={() => navigateTo('landing')}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Subscription Checkout & Payment Gateway Modal */}
      <SubscriptionCheckoutModal
        isOpen={isCheckoutOpen}
        plan={checkoutPlan}
        user={user}
        onClose={() => {
          setIsCheckoutOpen(false);
          setCheckoutPlan(null);
        }}
        onPaymentSuccess={handleCheckoutSuccess}
      />

      {/* Auth Modal with Plan Preselection and Forgot Password */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        initialPlan={selectedPlanForAuth}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
