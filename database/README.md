# Database Setup Guide (Supabase PostgreSQL)

1. Open your Supabase Dashboard: [https://supabase.com](https://supabase.com)
2. Go to **SQL Editor** from the left sidebar.
3. Click **New Query**.
4. Copy the entire contents of `database/schema.sql` and paste it into the editor.
5. Click **Run**.
6. This automatically creates:
   - `public.business_pages` (Multi-tenant page and token storage)
   - `public.orders` (Leads and orders captured by AI Agent)
   - Row-Level Security (RLS) policies protecting tenant data isolation.

