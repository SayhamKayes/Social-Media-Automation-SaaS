# Hugging Face Spaces Deployment Guide for n8n

Why Hugging Face Spaces is much better than Render Free Tier:
- **16 GB RAM** (vs Render's 512MB — 32x more memory!)
- **2 vCPUs** (Blazing fast execution)
- **50 GB Disk**
- 100% Free

---

## Step 1: Create a New Space on Hugging Face

1. Go to [https://huggingface.co/new-space](https://huggingface.co/new-space).
2. Fill in the details:
   - **Space name**: `social-n8n` (or any name you prefer)
   - **License**: `mit` (or any)
   - **Select the Space SDK**: Click **Docker** -> Choose **Blank**.
   - **Space hardware**: `CPU basic • 2 vCPU • 16 GB RAM • Free`
   - **Visibility**: **Public** (Important: Webhooks from Facebook require public access).
3. Click **Create Space**.

---

## Step 2: Upload Files to the Space

On your newly created Space page:
1. Click **Files** tab at the top.
2. Click **Add file** -> **Upload files** (or **Create a new file**):
   - Upload `huggingface/Dockerfile`
   - Upload `huggingface/README.md`
3. Click **Commit changes to main**.

---

## Step 3: Add Environment Variables (Secrets)

1. Go to your Space's **Settings** tab.
2. Scroll down to **Variables and secrets**.
3. Under **Variables** (or **Secrets**), add these exact values:

| Key | Value |
| :--- | :--- |
| `DB_TYPE` | `postgresdb` |
| `DB_POSTGRESDB_HOST` | `aws-0-ap-northeast-2.pooler.supabase.com` |
| `DB_POSTGRESDB_PORT` | `6543` |
| `DB_POSTGRESDB_DATABASE` | `postgres` |
| `DB_POSTGRESDB_USER` | `postgres.qpltadfseyybjnqisocm` |
| `DB_POSTGRESDB_PASSWORD` | `fzh3NFdwUDFyg3Pe` |
| `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED` | `false` |
| `N8N_ENCRYPTION_KEY` | `SocialMediaSaaS2026SecureKey!` |
| `N8N_PORT` | `7860` |
| `N8N_LISTEN_ADDRESS` | `0.0.0.0` |
| `N8N_PROTOCOL` | `https` |
| `N8N_HOST` | `[YOUR-USERNAME]-[YOUR-SPACE-NAME].hf.space` |
| `WEBHOOK_URL` | `https://[YOUR-USERNAME]-[YOUR-SPACE-NAME].hf.space/` |
| `EXECUTIONS_DATA_PRUNE` | `true` |
| `EXECUTIONS_DATA_MAX_AGE` | `48` |

> Note: To find your direct domain: Look at your space URL `https://huggingface.co/spaces/<username>/<space-name>`.
> The direct endpoint is: `<username>-<space-name>.hf.space`.

---

## Step 4: Access n8n

Once building completes (usually 1-2 minutes):
- Your Space will display the n8n interface right inside the Hugging Face page, OR you can visit `https://<username>-<space-name>.hf.space`.
- Set up your Owner account.
- Import `n8n/Facebook_Chat_Automation_SaaS_Dynamic.json`.
- Activate the workflow!

