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
import ApiIntegrations from './components/admin/ApiIntegrations';
import AIAgentConfig from './components/admin/AIAgentConfig';
import OrdersManager from './components/admin/OrdersManager';
import TestChatSimulator from './components/admin/TestChatSimulator';

import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

export default function App() {
  // Check initial path on page load (/dashboard or /admin)
  const isDashboardPath = () => {
    return window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/admin');
  };

  const [currentView, setCurrentView] = useState(isDashboardPath() ? 'dashboard' : 'landing');
  const [activeAdminTab, setActiveAdminTab] = useState('overview'); // 'overview' | 'social-media' | 'api-integrations' | 'ai-config' | 'orders' | 'simulator'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [user, setUser] = useState(null);

  // Data states
  const [pages, setPages] = useState([]);
  const [orders, setOrders] = useState([]);

  // URL Path Synchronizer helper
  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'dashboard') {
      window.history.pushState({ view: 'dashboard' }, '', '/dashboard');
    } else {
      window.history.pushState({ view: 'landing' }, '', '/');
    }
  };

  // Listen to browser Back/Forward buttons
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

  // Check Supabase Auth state on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadUserData(session.user.id);
        } else {
          loadMockData();
          if (isDashboardPath()) {
            // Auto-open login if user visited /dashboard without an active session
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
    setPages([
      {
        page_id: "109827364512345",
        page_name: "SKzLAB Software Agency",
        page_access_token: "EAAbx1whxNGcBS2IMOyDSjADLVqGR...",
        verify_token: "socialsaas_secret",
        system_prompt: "You are an expert sales consultant for SKzLAB...",
        knowledge_base: "Standard Web Package: ৳15,000. AI Integration: ৳25,000.",
        products_sheet_id: "15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM",
        faq_sheet_id: "15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM",
        orders_sheet_id: "15YQgYbQ7DDMGEEk33VlIfsv090abgBXBvUTaYG-LujM",
        is_active: true
      }
    ]);

    setOrders([
      {
        id: "1",
        order_id: "ORD-FB-9821",
        channel: "facebook",
        customer_name: "Tanvir Ahmed",
        phone_number: "+8801712345678",
        email: "tanvir@example.com",
        selected_package: "AI Integration Suite",
        selected_addons: "Custom Training, Priority Support",
        total_amount_bdt: 25000,
        total_amount_usd: 215,
        order_status: "Confirmed",
        customer_requirements: "Wants an AI chatbot for Facebook page.",
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        order_id: "ORD-IG-4412",
        channel: "instagram",
        customer_name: "Samantha Roy",
        phone_number: "+8801987654321",
        email: "samantha@gmail.com",
        selected_package: "E-Commerce Web Package",
        selected_addons: "Payment Gateway, SEO Package",
        total_amount_bdt: 35000,
        total_amount_usd: 300,
        order_status: "Confirmed",
        customer_requirements: "Fashion boutique looking for online checkout.",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: "3",
        order_id: "ORD-WA-7730",
        channel: "whatsapp",
        customer_name: "Imran Hossain",
        phone_number: "+8801811223344",
        email: "imran@techbd.org",
        selected_package: "Standard Corporate Website",
        selected_addons: "Domain & 1 Year Hosting",
        total_amount_bdt: 18000,
        total_amount_usd: 155,
        order_status: "Processing",
        customer_requirements: "Corporate portfolio for logistics agency.",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ]);
  };

  const loadUserData = async (userId) => {
    try {
      const { data: pagesData } = await supabase
        .from('business_pages')
        .select('*')
        .eq('user_id', userId);

      if (pagesData && pagesData.length > 0) {
        setPages(pagesData);
      } else {
        loadMockData();
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId);

      if (ordersData && ordersData.length > 0) {
        setOrders(ordersData);
      }
    } catch (err) {
      console.warn("Could not fetch Supabase data, using local store:", err);
      loadMockData();
    }
  };

  const handleOpenAuth = (mode = 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    navigateTo('dashboard');
    if (isSupabaseConfigured()) {
      loadUserData(authenticatedUser.id);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigateTo('landing');
  };

  // Business Page Operations
  const handleSavePage = async (pageData) => {
    if (isSupabaseConfigured() && user) {
      const { data, error } = await supabase
        .from('business_pages')
        .upsert({
          ...pageData,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {currentView === 'landing' ? (
        <>
          <Navbar
            user={user}
            onOpenAuth={handleOpenAuth}
            onGoToDashboard={() => navigateTo('dashboard')}
          />
          <main className="flex-grow">
            <Hero onGetStarted={() => user ? navigateTo('dashboard') : handleOpenAuth('signup')} />
            <Features />
            <HowItWorks />
            <Pricing onSelectPlan={() => user ? navigateTo('dashboard') : handleOpenAuth('signup')} />
          </main>
          <Footer />
          <BackToTop />
        </>
      ) : (
        <div className="min-h-screen flex flex-col bg-slate-950">
          <AdminNavbar
            user={user}
            onLogout={handleLogout}
            onGoToLanding={() => navigateTo('landing')}
          />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              activeTab={activeAdminTab}
              setActiveTab={setActiveAdminTab}
              ordersCount={orders.length}
            />
            <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl">
              {activeAdminTab === 'overview' && (
                <DashboardOverview
                  pages={pages}
                  orders={orders}
                  onNavigate={setActiveAdminTab}
                />
              )}
              {activeAdminTab === 'social-media' && (
                <SocialMediaManager
                  pages={pages}
                  onSavePage={handleSavePage}
                  onDeletePage={handleDeletePage}
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
                  onUpdatePageConfig={handleUpdatePageConfig}
                />
              )}
              {activeAdminTab === 'orders' && (
                <OrdersManager
                  orders={orders}
                />
              )}
              {activeAdminTab === 'simulator' && (
                <TestChatSimulator
                  selectedPage={pages[0]}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
