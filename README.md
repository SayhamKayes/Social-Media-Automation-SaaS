# AutoReply AI - Multi-Tenant Social Media SaaS

A complete production-ready Social Media SaaS that automates Facebook Messenger sales conversations, consultations, and confirmed orders using **Google Gemini 2.5 Flash**, **n8n**, **Supabase**, and **React + Tailwind CSS**.

---

## 🏛️ Architecture Overview

```
[ Facebook Messenger Customer ]
              │
              ▼
    [ n8n on Render (24/7) ]  <--- Kept alive via cron-job.org /healthz ping
              │
              ▼ (Postgres / REST Query by Page ID)
    [ Supabase PostgreSQL ]   <--- Multi-tenant business_pages with RLS
              │
              ▼ (Dynamic client prompt & tools)
    [ Gemini 2.5 Flash AI ]   <--- Google AI Studio Free Tier
              │
              ▼ (Dynamic client Page Access Token)
  [ Facebook Graph API Reply ]
```

---

## 📂 Project Organization

- **`frontend/`**: Full React (JSX) + Tailwind CSS application.
  - **`components/landing/`**: Modern conversion-focused landing page (Hero, Features, How It Works, Pricing, Footer).
  - **`components/admin/`**: Multi-tenant dashboard (Pages Manager, AI Prompt Config, Orders Viewer, Chat Simulator).
  - **`components/auth/`**: Supabase Auth (Sign Up & Login with JWT and email protection).
- **`database/`**:
  - **`schema.sql`**: Complete Supabase PostgreSQL schema with Row-Level Security (RLS) policies.
  - **`README.md`**: Quick execution guide for Supabase SQL Editor.
- **`n8n/`**:
  - **`Facebook_Chat_Automation_SaaS_Dynamic.json`**: Upgraded multi-tenant workflow.
  - **`RENDER_DEPLOYMENT_GUIDE.md`**: Guide to host n8n on Render free tier with 24/7 uptime.
  - **`README.md`**: n8n connection methods (Postgres or Supabase REST API).
- **`run_frontend.bat`**: 1-click script to install dependencies and run the frontend on Windows.

---

## 🚀 Quick Start Guide

### 1. Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** -> **New Query**, paste `database/schema.sql`, and click **Run**.
3. Copy your **Project URL** and **anon key** from **Settings -> API**.

### 2. Frontend Launch (React + Tailwind CSS)
1. Add your keys to `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Run the frontend:
   - Double-click `run_frontend.bat`, OR run in terminal:
     ```bash
     cd frontend
     npm install
     npm run dev
     ```
3. Open `http://localhost:3000` in your browser.

### 3. Automation Setup (n8n on Render)
1. Follow the steps in [`n8n/RENDER_DEPLOYMENT_GUIDE.md`](./n8n/RENDER_DEPLOYMENT_GUIDE.md).
2. Import [`n8n/Facebook_Chat_Automation_SaaS_Dynamic.json`](./n8n/Facebook_Chat_Automation_SaaS_Dynamic.json) into your n8n workspace.
3. Activate the workflow and connect your Webhook URL to Meta Developer Portal.
