# Meta (Facebook) Developer App & Webhook Setup Guide

This guide walks you through connecting your production n8n webhook and Facebook Pages to Meta Developer Portal.

---

## 🛠️ Step 1: Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in with your Facebook account.
2. Click **My Apps** -> **Create App**.
3. Use Case: Choose **Other** -> Click **Next**.
4. App Type: Select **Business** -> Click **Next**.
5. Enter your **App Name** (e.g. `AutoReply AI Sales Bot`) and your contact email.
6. Click **Create App**.

---

## 📩 Step 2: Configure Messenger Webhook

1. On your App Dashboard, scroll down to **Add products to your app**.
2. Find **Messenger** and click **Set up**.
3. In the left sidebar, navigate to **Messenger** -> **Instagram & Facebook Settings** (or **Webhooks**).
4. Under the **Webhooks** section, click **Add Callback URL**:
   - **Callback URL**:
     ```
     https://your-render-app-name.onrender.com/webhook/facebook-messenger-saas
     ```
     *(Make sure your n8n workflow is toggled to **Active** first!)*
   - **Verify Token**:
     ```
     socialsaas_secret
     ```
5. Click **Verify and Save**. (Meta will send a test GET request; your n8n workflow's verification node will return `hub.challenge` and verify immediately).
6. Under **Subscription Fields**, click **Manage** and subscribe to:
   - `messages` (Mandatory: incoming customer messages)
   - `messaging_postbacks` (Optional: button clicks)

---

## 🔑 Step 3: Get Long-Lived Page Access Token (Never Expires)

1. Go to [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. In the top-right:
   - **Meta App**: Select your newly created app.
   - **User or Page**: Click the dropdown and select your **Facebook Page**.
3. Under **Permissions**, ensure these are added:
   - `pages_messaging`
   - `pages_show_list`
   - `pages_manage_metadata`
4. Click **Generate Access Token**.
5. Copy the generated token.
6. **Extend to Never-Expiring Token**:
   - Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/).
   - Paste the token and click **Debug**.
   - Click **Extend Access Token** at the bottom.
   - Copy the new long-lived token (starts with `EAAb...`).
7. Paste this token into your **AutoReply AI Dashboard** under the **Facebook Pages** tab along with your numeric **Page ID**.

---

## 🚀 Step 4: Subscribe Your Page to the Webhook

In the Meta App Dashboard under Messenger Webhooks:
- Scroll down to **Select a Page to subscribe to Webhook events**.
- Select your Facebook Page and click **Subscribe**.

---

## ⚠️ Important Note: Development vs Live Mode

- **In Development Mode:** The bot will ONLY reply to you (the Page Admin/App Developer) and designated Testers.
- **In Live Mode (For Public Customers):**
  - Go to **App Settings** -> **Basic**. Add a Privacy Policy URL (you can use your landing page URL).
  - Toggle the switch at the top from **Development** to **Live**.
  - Submit `pages_messaging` permission for App Review so anyone visiting your Facebook page can chat with your AI assistant 24/7!

