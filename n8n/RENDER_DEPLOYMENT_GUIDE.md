# Deploying n8n on Render (100% Free Tier) with 24/7 Keep-Alive

This guide explains how to host your production n8n automation engine on **Render Free Tier** without losing data or letting it sleep.

---

## Step 1: Create Free Database on Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. In the Supabase Dashboard, open **SQL Editor** -> **New Query**.
3. Paste the contents of `database/schema.sql` and click **Run**.
4. Go to **Project Settings** -> **Database** and copy your **Connection String (URI)**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
5. Go to **Project Settings** -> **API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role secret` key (used by n8n to read/write without RLS restrictions)

---

## Step 2: Deploy n8n on Render

1. Log in to [https://render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Choose **Deploy an existing image**.
4. Image URL: `n8nio/n8n:latest`
5. Name: `social-saas-n8n` (or your choice).
6. Region: Select closest (e.g. Frankfurt, Singapore, or Oregon).
7. Plan: **Free** (0.5 CPU, 512 MB RAM).
8. Under **Environment Variables**, add the following:

| Key | Value | Note |
| :--- | :--- | :--- |
| `DB_TYPE` | `postgresdb` | Tell n8n to use PostgreSQL |
| `N8N_ENCRYPTION_KEY` | `SocialMediaSaaS2026SecureKey!` | Permanent encryption key across redeploys |
| `DB_POSTGRESDB_HOST` | `aws-0-ap-northeast-2.pooler.supabase.com` | Supabase IPv4 Pooler host |
| `DB_POSTGRESDB_PORT` | `6543` | Supabase Transaction Pooler port |
| `DB_POSTGRESDB_DATABASE` | `postgres` | Default Supabase DB name |
| `DB_POSTGRESDB_USER` | `postgres.qpltadfseyybjnqisocm` | Supabase pooled user |
| `DB_POSTGRESDB_PASSWORD` | `fzh3NFdwUDFyg3Pe` | Your Supabase database password |
| `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED` | `false` | Required for Supabase SSL |
| `PORT` | `5678` | Tells Render which port to bind |
| `N8N_PORT` | `5678` | Internal n8n port |
| `N8N_LISTEN_ADDRESS` | `0.0.0.0` | Force IPv4 binding so Render port scanner detects it |
| `N8N_PROTOCOL` | `https` | Use HTTPS |
| `N8N_HOST` | `social-automation-saas-dfg4.onrender.com` | Raw hostname (NO https:// or trailing /) |
| `WEBHOOK_URL` | `https://social-automation-saas-dfg4.onrender.com/` | Used by Facebook Webhook |
| `EXECUTIONS_DATA_PRUNE` | `true` | Prevents RAM overflow on 512MB RAM |
| `EXECUTIONS_DATA_MAX_AGE` | `48` | Keeps execution logs for 48 hours |
| `GENERIC_TIMEZONE` | `Asia/Dhaka` | Your local timezone |

9. Click **Create Web Service**. Wait 2-3 minutes until the deploy status shows **Live**.

---

## Step 3: Prevent Render Sleep with a Free Cron Job

Render free services spin down after 15 minutes of inactivity. To keep your webhook responsive 24/7:

1. Go to [https://cron-job.org](https://cron-job.org) (or [https://uptimerobot.com](https://uptimerobot.com)) and sign up for a free account.
2. Create a new cron job / monitor:
   - **URL**: `https://your-render-app-name.onrender.com/healthz`
   - **Schedule**: Every `10 minutes` (or every `14 minutes`)
   - **Request Method**: `GET`
3. Save and activate.
4. Now Render will receive a ping every 10 minutes, keeping the container warm and 24/7 active for incoming Facebook messages!

---

## Step 4: Import Workflow into n8n

1. Visit `https://your-render-app-name.onrender.com` in your browser.
2. Complete owner setup (email & password).
3. Click **Workflows** -> **Import from File**.
4. Select `n8n/Facebook_Chat_Automation_SaaS_Dynamic.json`.
5. In the workflow:
   - Add your Supabase credentials in the `Get Client Business Config` node (PostgreSQL credential using your Supabase host, user, password, port 5432, database `postgres`).
   - Add your Google Gemini API key in the `Google Gemini Chat Model` node (Free tier key from Google AI Studio).
6. Click **Activate** (toggle to Active).
7. Copy your production Webhook URL from the Webhook node and register it in Meta Developer Portal.

