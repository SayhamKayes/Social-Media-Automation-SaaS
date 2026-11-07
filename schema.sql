-- Multi-tenant Facebook SaaS Database Schema
-- Run this in your PostgreSQL / Supabase database

CREATE TABLE IF NOT EXISTS business_pages (
    id SERIAL PRIMARY KEY,
    user_id UUID,                           -- Your SaaS user's ID
    page_id VARCHAR(100) UNIQUE NOT NULL,   -- Facebook Page ID (received in entry[0].id)
    page_name VARCHAR(255) NOT NULL,        -- e.g. "SKzLAB" or "Fashion Hub"
    page_access_token TEXT NOT NULL,        -- Permanent Page Access Token for this page
    verify_token VARCHAR(100) DEFAULT 'socialsaas_secret', -- Webhook verify token
    system_prompt TEXT,                     -- Custom sales prompt for this business
    products_sheet_id VARCHAR(255),         -- Client's Google Sheet ID for Products (or leave empty if using DB)
    faq_sheet_id VARCHAR(255),              -- Client's Google Sheet ID for FAQ
    orders_sheet_id VARCHAR(255),           -- Client's Google Sheet ID for Orders
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for instant lookup on incoming webhooks (millisecond response time)
CREATE INDEX IF NOT EXISTS idx_business_pages_page_id ON business_pages(page_id);

-- Optional: Central Orders table if clients prefer storing orders in your SaaS instead of Google Sheets
CREATE TABLE IF NOT EXISTS client_orders (
    id SERIAL PRIMARY KEY,
    page_id VARCHAR(100) REFERENCES business_pages(page_id) ON DELETE CASCADE,
    order_id VARCHAR(50),
    sender_id VARCHAR(100),
    customer_name VARCHAR(255),
    phone_number VARCHAR(50),
    email VARCHAR(255),
    selected_package TEXT,
    selected_addons TEXT,
    total_amount_bdt NUMERIC(12, 2),
    total_amount_usd NUMERIC(12, 2),
    order_status VARCHAR(50) DEFAULT 'Pending',
    customer_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

