# n8n & Supabase Multi-Tenant Integration Guide

This folder contains the production-ready n8n workflow for your **Social Media SaaS**.

---

## 📄 Files in this Folder

1. **`Facebook_Chat_Automation_SaaS_Dynamic.json`**:
   The complete n8n workflow JSON ready to be imported into your n8n instance.
2. **`RENDER_DEPLOYMENT_GUIDE.md`**:
   Step-by-step instructions for hosting n8n on Render Free Tier with 24/7 keep-alive via cron-job.org.

---

## ⚡ How the Dynamic SaaS Webhook Operates

```
[ Incoming Facebook Message ]
               │
               ▼
   [ Webhook: Multiple Methods (GET & POST) ]
    ├── GET  ──▶ [ If: hub_mode == 'subscribe' ] ──▶ [ Respond to Webhook: hub.challenge ]
    └── POST ──▶ [ Filter: Check message.text ]
                        │
                        ▼
         [ Get Client Business Config (Supabase Query) ]
          👉 Looks up client by Page ID: `entry[0].id`
          👉 Retrieves: `page_access_token`, `system_prompt`, `products_sheet_id`, `orders_sheet_id`
                        │
                        ▼
         [ Gemini 2.5 Flash AI Agent ]
          👉 Injects dynamic client system prompt
          👉 Uses Products, FAQ, Orders tools
                        │
                        ▼
         [ Send Messenger Reply (Graph API) ]
          👉 Sends message using dynamic client `page_access_token`
          👉 Applies Unicode Bold formatting for mobile Messenger
```

---

## 🔌 Connecting n8n to Supabase (2 Methods)

### Method 1: Using PostgreSQL Node in n8n (Recommended)
In n8n:
1. Click **Credentials** -> **New Credential** -> Search **Postgres**.
2. Enter your Supabase connection parameters:
   - **Host**: `db.[YOUR-PROJECT-REF].supabase.co`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Your Supabase database password
   - **Port**: `5432` (or `6543` if using Supabase connection pooling)
   - **SSL**: `TLS/SSL enabled`
3. In the node `Get Client Business Config`, select this Postgres credential!

### Method 2: Using Supabase REST API (Lightweight)
If you prefer not opening a direct Postgres connection:
1. Replace the Postgres node with an **HTTP Request** node:
   - **Method**: `GET`
   - **URL**: `https://[YOUR-PROJECT-REF].supabase.co/rest/v1/business_pages?page_id=eq.{{ $('Webhook').first().json.body.entry[0].id }}&select=*`
   - **Headers**:
     - `apikey`: `[YOUR_SUPABASE_SERVICE_ROLE_KEY]`
     - `Authorization`: `Bearer [YOUR_SUPABASE_SERVICE_ROLE_KEY]`
2. This fetches the client configuration over HTTPS in less than 50ms!

---

## 🤖 Google Gemini AI Setup

1. Get a **Free API Key** from [Google AI Studio](https://aistudio.google.com).
2. In n8n, create a new credential for **Google Gemini(PaLM) Api**.
3. Paste your free API key.
4. The workflow utilizes `models/gemini-2.5-flash`, providing ultra-fast response times and zero cost under the generous free tier (up to 1,500 requests/day).

