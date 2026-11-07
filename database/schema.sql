-- ====================================================================
-- SUPABASE MULTI-TENANT FACEBOOK SAAS DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Create Business Pages Table
CREATE TABLE IF NOT EXISTS public.business_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_id VARCHAR(100) UNIQUE NOT NULL,       -- Facebook Page ID (e.g. 109827364512345)
    page_name VARCHAR(255) NOT NULL,            -- Name of the Facebook Page
    page_access_token TEXT NOT NULL,            -- Long-Lived Page Access Token
    verify_token VARCHAR(100) DEFAULT 'socialsaas_secret',
    system_prompt TEXT,                         -- Custom sales/consultant prompt for AI Agent
    knowledge_base TEXT,                        -- Business knowledge base (FAQs, pricing, policy)
    products_sheet_id VARCHAR(255),             -- Optional Google Sheet ID for Products
    faq_sheet_id VARCHAR(255),                  -- Optional Google Sheet ID for FAQ
    orders_sheet_id VARCHAR(255),               -- Optional Google Sheet ID for Orders
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes for webhook calls and user dashboards
CREATE INDEX IF NOT EXISTS idx_business_pages_page_id ON public.business_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_business_pages_user_id ON public.business_pages(user_id);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id VARCHAR(100) REFERENCES public.business_pages(page_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id VARCHAR(100),
    sender_id VARCHAR(100),                     -- Facebook PSID (Customer ID)
    customer_name VARCHAR(255),
    phone_number VARCHAR(100),
    email VARCHAR(255),
    selected_package TEXT,
    selected_addons TEXT,
    total_amount_bdt NUMERIC(12, 2) DEFAULT 0,
    total_amount_usd NUMERIC(12, 2) DEFAULT 0,
    order_status VARCHAR(50) DEFAULT 'Confirmed',
    customer_requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_page_id ON public.orders(page_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.business_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only manage their own business pages
CREATE POLICY "Users can manage their own business pages"
ON public.business_pages
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can view and manage their own orders
CREATE POLICY "Users can manage their own orders"
ON public.orders
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service Role (used by n8n Webhook backend) has full access
CREATE POLICY "Service role has full access to business pages"
ON public.business_pages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access to orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Auto-assign user_id on order creation based on page_id
CREATE OR REPLACE FUNCTION public.set_order_user_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT user_id INTO NEW.user_id FROM public.business_pages WHERE page_id = NEW.page_id LIMIT 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_set_order_user_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_user_id();

