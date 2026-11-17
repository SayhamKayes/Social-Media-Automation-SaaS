/* Browser-based Google Identity Services + Google Drive v3 + Google Sheets v4 API helper */

let gsiScriptPromise = null;

export const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser required'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
};

export const extractGoogleId = (urlOrId = '') => {
  const trimmed = String(urlOrId).trim();
  if (!trimmed) return '';
  const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch) return sheetMatch[1];
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch) return folderMatch[1];
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (fileMatch) return fileMatch[1];
  return trimmed;
};

export const getSavedGoogleSession = (userId = 'default') => {
  try {
    const raw = localStorage.getItem(`saas_google_session_${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken) return null;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt - 60000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveGoogleSession = (userId = 'default', session) => {
  try {
    if (!session) {
      localStorage.removeItem(`saas_google_session_${userId}`);
      return;
    }
    localStorage.setItem(`saas_google_session_${userId}`, JSON.stringify(session));
  } catch {
    /* ignore storage error */
  }
};

export const connectGoogleDriveAndSheets = async (clientId, userId = 'default') => {
  if (!clientId || !clientId.trim()) {
    throw new Error('Google OAuth Client ID is not configured. Please ask Super Admin to add it in Master APIs & Gateway.');
  }

  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/userinfo.email'
        ].join(' '),
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          const accessToken = tokenResponse.access_token;
          const expiresIn = Number(tokenResponse.expires_in) || 3500;
          let email = '';
          try {
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              email = profile.email || '';
            }
          } catch {
            /* ignore profile lookup failure */
          }

          const sessionObj = {
            accessToken,
            email,
            expiresAt: Date.now() + expiresIn * 1000
          };
          saveGoogleSession(userId, sessionObj);
          resolve(sessionObj);
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

export const listUserSpreadsheets = async (accessToken) => {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Failed to fetch spreadsheets from Google Drive');
  }
  const data = await res.json();
  return data.files || [];
};

export const listUserDriveFolders = async (accessToken) => {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false");
  const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Failed to fetch folders from Google Drive');
  }
  const data = await res.json();
  return data.files || [];
};

export const shareDriveFileWithEmail = async (accessToken, fileId, targetEmail, role = 'writer') => {
  const cleanId = extractGoogleId(fileId);
  const cleanEmail = String(targetEmail || '').trim();
  if (!accessToken || !cleanId || !cleanEmail) {
    return { shared: false, fileId: cleanId, reason: 'Missing token, file ID, or target Gmail' };
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(cleanId)}/permissions?sendNotificationEmail=false&supportsAllDrives=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          type: 'user',
          emailAddress: cleanEmail
        })
      }
    );

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { shared: true, fileId: cleanId, email: cleanEmail, permissionId: data.id || null };
    }

    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `HTTP ${res.status}`;
    return {
      shared: false,
      fileId: cleanId,
      email: cleanEmail,
      needsManualShare: res.status === 403 || res.status === 404,
      reason: msg
    };
  } catch (err) {
    return {
      shared: false,
      fileId: cleanId,
      email: cleanEmail,
      needsManualShare: true,
      reason: err.message || 'Network error while sharing file'
    };
  }
};

export const shareDriveFilesBatch = async (accessToken, fileIds = [], targetEmail) => {
  const uniqueIds = [...new Set(fileIds.map(extractGoogleId).filter(Boolean))];
  if (!accessToken || !targetEmail || uniqueIds.length === 0) {
    return { results: [], allShared: false, sharedCount: 0, manualIds: uniqueIds };
  }

  const results = await Promise.all(
    uniqueIds.map((id) => shareDriveFileWithEmail(accessToken, id, targetEmail, 'writer'))
  );
  const sharedCount = results.filter(r => r.shared).length;
  const manualIds = results.filter(r => !r.shared).map(r => r.fileId);
  return {
    results,
    allShared: manualIds.length === 0 && sharedCount > 0,
    sharedCount,
    manualIds
  };
};

export const createChatbotSpreadsheet = async (accessToken, businessName = 'Business', shareWithEmail = '') => {
  const title = `${businessName} - AutoReply AI Catalog & Orders`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'Products', index: 0 } },
        { properties: { title: 'FAQ', index: 1 } },
        { properties: { title: 'Orders', index: 2 } }
      ]
    })
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Could not create Google Sheet');
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;

  /* Populate Row 1 headers and sample rows for Products, FAQ, and Orders */
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Products!A1:F2',
          values: [
            ['Product_Name', 'Category', 'Price_BDT', 'Stock', 'Description', 'Delivery_Time'],
            ['Starter Package', 'Service', '15000', 'Available', 'Complete business setup and automation package', '3-5 Days']
          ]
        },
        {
          range: 'FAQ!A1:C2',
          values: [
            ['Question', 'Answer', 'Keywords'],
            ['What are your payment methods?', 'We accept bKash, Nagad, Rocket, and Bank Transfer.', 'payment, bkash, nagad']
          ]
        },
        {
          range: 'Orders!A1:K1',
          values: [[
            'Order_ID', 'Timestamp', 'Customer_Name', 'Sender_ID', 'Phone_Number',
            'Email', 'Selected_Package', 'Selected_Addons', 'Total_Amount_BDT',
            'Order_Status', 'Customer_Requirements'
          ]]
        }
      ]
    })
  });

  let shareStatus = { shared: false };
  if (shareWithEmail && shareWithEmail.trim()) {
    shareStatus = await shareDriveFileWithEmail(accessToken, spreadsheetId, shareWithEmail.trim(), 'writer');
  }

  return {
    id: spreadsheetId,
    name: title,
    webViewLink: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sharedWithN8n: shareStatus.shared,
    shareEmail: shareWithEmail.trim() || ''
  };
};

export const createAutoPostSpreadsheet = async (accessToken, title = 'AutoReply AI Social Content Queue', shareWithEmail = '') => {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: 'Content', index: 0 } }]
    })
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Could not create Auto-Post Content Sheet');
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Content!A1:F1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [['Title', 'Caption', 'Media_URL', 'Platforms', 'Scheduled_At', 'Status']]
    })
  });

  let shareStatus = { shared: false };
  if (shareWithEmail && shareWithEmail.trim()) {
    shareStatus = await shareDriveFileWithEmail(accessToken, spreadsheetId, shareWithEmail.trim(), 'writer');
  }

  return {
    id: spreadsheetId,
    name: title,
    webViewLink: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sharedWithN8n: shareStatus.shared,
    shareEmail: shareWithEmail.trim() || ''
  };
};

export const createDriveFolder = async (accessToken, name = 'AutoReply AI Media', shareWithEmail = '') => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Could not create Google Drive folder');
  }
  const folderData = await res.json();
  let shareStatus = { shared: false };
  if (shareWithEmail && shareWithEmail.trim() && folderData?.id) {
    shareStatus = await shareDriveFileWithEmail(accessToken, folderData.id, shareWithEmail.trim(), 'writer');
  }
  return {
    ...folderData,
    sharedWithN8n: shareStatus.shared,
    shareEmail: shareWithEmail.trim() || ''
  };
};

export const uploadImageToDrive = async (accessToken, file, folderId = '') => {
  const metadata = {
    name: file.name,
    mimeType: file.type || 'image/jpeg'
  };
  if (folderId && folderId.trim()) {
    metadata.parents = [folderId.trim()];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    }
  );

  if (!uploadRes.ok) {
    const errBody = await uploadRes.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'Failed to upload photo to Google Drive');
  }

  const uploaded = await uploadRes.json();

  /* Make readable via link so Meta Graph API can fetch the image URL */
  await fetch(`https://www.googleapis.com/drive/v3/files/${uploaded.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  }).catch(() => {});

  return {
    id: uploaded.id,
    name: uploaded.name,
    directUrl: `https://drive.google.com/uc?export=view&id=${uploaded.id}`,
    webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`
  };
};

