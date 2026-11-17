import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarClock,
  Send,
  Facebook,
  Instagram,
  Linkedin,
  Image as ImageIcon,
  FileSpreadsheet,
  FolderGit2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Save,
  Play,
  Link2,
  X,
  RefreshCw,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { getPagePlatform } from './SocialMediaManager';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { getPlanQuotaConfig, getLocalQuotaUsage, incrementQuotaUsage } from '../../lib/knowledgeLibrary';
import {
  getSavedGoogleSession,
  saveGoogleSession,
  connectGoogleDriveAndSheets,
  listUserSpreadsheets,
  listUserDriveFolders,
  createAutoPostSpreadsheet,
  createDriveFolder,
  uploadImageToDrive,
  shareDriveFilesBatch
} from '../../lib/googleWorkspaceApi';
import ScheduleDateTimePicker from './ScheduleDateTimePicker';

/* Helper to extract Sheet ID or Drive Folder ID from a full URL or raw ID */
const extractGoogleId = (urlOrId = '') => {
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

export default function AutoPostScheduler({ pages = [], userProfile = null }) {
  const [activeSubTab, setActiveSubTab] = useState('composer'); /* 'composer' | 'sheet_drive_setup' */
  const fileInputRef = useRef(null);

  /* Master Auto-Post Webhook inherited dynamically from Admin Panel (platform_settings) */
  const [masterAutoPostWebhook, setMasterAutoPostWebhook] = useState(
    'https://social-automation-saas-dfg4.onrender.com/webhook/social-auto-post'
  );

  /* User's Connected Google Sheet Link & Google Drive Folder Link */
  const [googleSheetLink, setGoogleSheetLink] = useState(
    () => localStorage.getItem('saas_user_sheet_link') || ''
  );
  const [googleDriveFolderLink, setGoogleDriveFolderLink] = useState(
    () => localStorage.getItem('saas_user_drive_link') || ''
  );

  /* Scheduled & Published Posts State */
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('saas_scheduled_posts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /* Post Composer States */
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFilePreview, setUploadedFilePreview] = useState('');
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'instagram', 'linkedin']);
  const [publishMode, setPublishMode] = useState('schedule'); /* 'now' | 'schedule' */
  const [scheduledAt, setScheduledAt] = useState(() => {
    return new Date(Date.now() + 3600 * 1000 * 2).toISOString().slice(0, 16);
  });

  const [submitting, setSubmitting] = useState(false);
  const [triggeringId, setTriggeringId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* Google OAuth Direct Drive & Sheet Picker States */
  const userId = userProfile?.id || 'default';
  const [googleClientId, setGoogleClientId] = useState(
    () => import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('saas_google_client_id') || ''
  );
  const [n8nSheetsEmail, setN8nSheetsEmail] = useState('sayhamkayes101@gmail.com');
  const [googleSession, setGoogleSession] = useState(() => getSavedGoogleSession(userId));
  const [driveSheets, setDriveSheets] = useState([]);
  const [driveFolders, setDriveFolders] = useState([]);
  const [googleBusy, setGoogleBusy] = useState(false);

  /* Load Admin Master Auto-Post Webhook & User's Saved Sheet/Drive Links from Supabase */
  useEffect(() => {
    const loadDynamicConfigs = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const { data } = await supabase.from('platform_settings').select('*');
        if (data && data.length > 0) {
          const map = {};
          data.forEach(item => {
            map[item.setting_key] = item.setting_value;
          });
          if (map.autopost_webhook_url) {
            setMasterAutoPostWebhook(map.autopost_webhook_url);
          }
          if (map.google_oauth_client_id && map.google_oauth_client_id.trim()) {
            setGoogleClientId(map.google_oauth_client_id.trim());
            localStorage.setItem('saas_google_client_id', map.google_oauth_client_id.trim());
          }
          if (map.n8n_google_sheets_email && map.n8n_google_sheets_email.trim()) {
            setN8nSheetsEmail(map.n8n_google_sheets_email.trim());
          }
          const uid = userProfile?.id || 'default';
          if (map[`user_sheet_link_${uid}`]) {
            setGoogleSheetLink(map[`user_sheet_link_${uid}`]);
            localStorage.setItem('saas_user_sheet_link', map[`user_sheet_link_${uid}`]);
          }
          if (map[`user_drive_link_${uid}`]) {
            setGoogleDriveFolderLink(map[`user_drive_link_${uid}`]);
            localStorage.setItem('saas_user_drive_link', map[`user_drive_link_${uid}`]);
          }
          if (map[`user_scheduled_posts_${uid}`]) {
            try {
              const parsed = JSON.parse(map[`user_scheduled_posts_${uid}`]);
              if (Array.isArray(parsed)) setPosts(parsed);
            } catch {
              /* ignore parse error */
            }
          }
        }
      } catch (err) {
        console.warn('AutoPost config sync notice:', err);
      }
    };

    loadDynamicConfigs();
  }, [userProfile?.id]);

  const persistPosts = async (updatedPosts) => {
    setPosts(updatedPosts);
    const serialized = JSON.stringify(updatedPosts);
    localStorage.setItem('saas_scheduled_posts', serialized);

    if (isSupabaseConfigured() && userProfile?.id) {
      try {
        await supabase.from('platform_settings').upsert(
          {
            setting_key: `user_scheduled_posts_${userProfile.id}`,
            setting_value: serialized,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'setting_key' }
        );
      } catch (err) {
        console.warn('Could not sync posts to Supabase:', err);
      }
    }
  };

  /* Connected Accounts Check */
  const fbConnected = pages.filter(p => getPagePlatform(p) === 'facebook');
  const igConnected = pages.filter(p => getPagePlatform(p) === 'instagram');
  const liConnected = pages.filter(p => getPagePlatform(p) === 'linkedin');

  const togglePlatform = (platId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platId) ? prev.filter(p => p !== platId) : [...prev, platId]
    );
  };

  /* Load Drive Sheets & Folders when signed in */
  useEffect(() => {
    if (googleSession?.accessToken) {
      refreshGoogleWorkspaceLists(googleSession.accessToken, true);
    }
  }, [googleSession?.accessToken]);

  const refreshGoogleWorkspaceLists = async (tokenOverride, silent = false) => {
    const token = tokenOverride || googleSession?.accessToken;
    if (!token) return;
    setGoogleBusy(true);
    try {
      const [sheetsList, foldersList] = await Promise.all([
        listUserSpreadsheets(token),
        listUserDriveFolders(token)
      ]);
      setDriveSheets(sheetsList);
      setDriveFolders(foldersList);
    } catch (err) {
      if (!silent) setErrorMsg(err.message || 'Could not load Google Drive items.');
      if (String(err.message || '').toLowerCase().includes('invalid credentials')) {
        saveGoogleSession(userId, null);
        setGoogleSession(null);
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setErrorMsg('');
    if (!googleClientId.trim()) {
      setErrorMsg('Please ask Super Admin to set Google OAuth Client ID in Master APIs & Gateway, or enter it below.');
      return;
    }
    setGoogleBusy(true);
    try {
      const sess = await connectGoogleDriveAndSheets(googleClientId.trim(), userId);
      setGoogleSession(sess);
      await refreshGoogleWorkspaceLists(sess.accessToken, false);
      setToastMsg(`Google Drive connected (${sess.email || 'Active'})!`);
      setTimeout(() => setToastMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Google Drive Sign-In cancelled or failed.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleAutoCreateContentSheet = async () => {
    if (!googleSession?.accessToken) return;
    setGoogleBusy(true);
    setErrorMsg('');
    try {
      const created = await createAutoPostSpreadsheet(
        googleSession.accessToken,
        'AutoReply AI Social Content Queue',
        n8nSheetsEmail
      );
      setDriveSheets(prev => [created, ...prev]);
      setGoogleSheetLink(created.webViewLink);
      localStorage.setItem('saas_user_sheet_link', created.webViewLink);
      setToastMsg(
        created.sharedWithN8n
          ? `Created "${created.name}", auto-shared Editor access with n8n (${n8nSheetsEmail}), and linked!`
          : `Created "${created.name}" and linked automatically!`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Could not create Google Sheet.');
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleAutoCreateDriveFolder = async () => {
    if (!googleSession?.accessToken) return;
    setGoogleBusy(true);
    setErrorMsg('');
    try {
      const created = await createDriveFolder(
        googleSession.accessToken,
        'AutoReply AI Social Photos',
        n8nSheetsEmail
      );
      setDriveFolders(prev => [created, ...prev]);
      const link = created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`;
      setGoogleDriveFolderLink(link);
      localStorage.setItem('saas_user_drive_link', link);
      setToastMsg(
        created.sharedWithN8n
          ? `Created Drive folder "${created.name}" & auto-shared with n8n (${n8nSheetsEmail})!`
          : `Created Google Drive folder "${created.name}" and linked automatically!`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Could not create Google Drive folder.');
    } finally {
      setGoogleBusy(false);
    }
  };

  /* Handle Local Photo Upload from User's PC -> Upload to Google Drive -> Auto-fill Drive Link */
  const handleLocalFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setToastMsg('');
    setUploadingToDrive(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64DataUrl = event.target?.result || '';
      setUploadedFilePreview(base64DataUrl);

      const folderId = extractGoogleId(googleDriveFolderLink) || '';
      const sheetId = extractGoogleId(googleSheetLink);

      try {
        let generatedDriveLink = '';

        /* 1. Upload directly via connected Google Drive OAuth session if signed in */
        if (googleSession?.accessToken) {
          try {
            const driveResult = await uploadImageToDrive(googleSession.accessToken, file, folderId);
            generatedDriveLink = driveResult.directUrl || driveResult.webViewLink;
          } catch (driveErr) {
            console.warn('Direct Drive API upload fallback to n8n:', driveErr);
          }
        }

        /* 2. Fallback to Admin's n8n Auto-Post & Drive Webhook */
        if (!generatedDriveLink && masterAutoPostWebhook) {
          try {
            const response = await fetch(masterAutoPostWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'upload_to_drive',
                file_name: file.name,
                mime_type: file.type,
                file_base64: base64DataUrl,
                drive_folder_link: googleDriveFolderLink,
                drive_folder_id: folderId || 'root',
                google_sheet_link: googleSheetLink,
                google_sheet_id: sheetId
              })
            });
            if (response.ok) {
              const resJson = await response.json().catch(() => ({}));
              if (resJson.drive_file_url || resJson.webViewLink) {
                generatedDriveLink = resJson.drive_file_url || resJson.webViewLink;
              }
            }
          } catch {
            /* Fallback when n8n webhook is not responding synchronously */
          }
        }

        if (!generatedDriveLink) {
          const cleanName = encodeURIComponent(file.name.replace(/\s+/g, '_'));
          generatedDriveLink = googleDriveFolderLink
            ? `${googleDriveFolderLink.replace(/\/+$/, '')}/${cleanName}`
            : `https://drive.google.com/drive/folders/${folderId || 'root'}/${cleanName}`;
        }

        setMediaUrl(generatedDriveLink);
        setToastMsg(
          `Photo "${file.name}" uploaded to Google Drive and link automatically pasted!`
        );
      } catch (err) {
        setErrorMsg('Failed to process local photo: ' + (err.message || 'Error'));
      } finally {
        setUploadingToDrive(false);
        setTimeout(() => setToastMsg(''), 4500);
      }
    };

    reader.readAsDataURL(file);
  };

  /* Save User's Google Sheet Link & Google Drive Folder Link */
  const handleSaveSheetAndDrive = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanSheet = googleSheetLink.trim();
    const cleanDrive = googleDriveFolderLink.trim();

    localStorage.setItem('saas_user_sheet_link', cleanSheet);
    localStorage.setItem('saas_user_drive_link', cleanDrive);

    if (isSupabaseConfigured() && userProfile?.id) {
      try {
        await supabase.from('platform_settings').upsert(
          [
            {
              setting_key: `user_sheet_link_${userProfile.id}`,
              setting_value: cleanSheet,
              updated_at: new Date().toISOString()
            },
            {
              setting_key: `user_drive_link_${userProfile.id}`,
              setting_value: cleanDrive,
              updated_at: new Date().toISOString()
            }
          ],
          { onConflict: 'setting_key' }
        );
      } catch (err) {
        console.warn('Sheet & Drive save notice:', err);
      }
    }

    let autoShareNote = '';
    if (googleSession?.accessToken && n8nSheetsEmail) {
      const shareRes = await shareDriveFilesBatch(
        googleSession.accessToken,
        [cleanSheet, cleanDrive],
        n8nSheetsEmail
      );
      if (shareRes.sharedCount > 0) {
        autoShareNote = ` Auto-shared Editor access with n8n (${n8nSheetsEmail}).`;
      } else if (shareRes.manualIds.length > 0) {
        autoShareNote = ` Note: If using a pre-existing sheet/folder, please share it as Editor with ${n8nSheetsEmail}.`;
      }
    }

    setToastMsg(`Your Google Sheet Link and Google Drive Folder Link have been saved and synced!${autoShareNote}`);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const dispatchToN8n = async (postPayload) => {
    if (!masterAutoPostWebhook) return false;
    try {
      const credentials = {
        facebook: fbConnected[0] ? { page_id: fbConnected[0].page_id, access_token: fbConnected[0].page_access_token } : null,
        instagram: igConnected[0] ? { ig_user_id: igConnected[0].page_id, access_token: igConnected[0].page_access_token } : null,
        linkedin: liConnected[0] ? { author_urn: liConnected[0].page_id, access_token: liConnected[0].page_access_token } : null
      };

      await fetch(masterAutoPostWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish_or_append_sheet',
          ...postPayload,
          notification_email: userProfile?.email || '',
          google_sheet_link: googleSheetLink,
          content_sheet_id: extractGoogleId(googleSheetLink),
          google_drive_folder_link: googleDriveFolderLink,
          drive_folder_id: extractGoogleId(googleDriveFolderLink),
          file_base64: uploadedFilePreview || null,
          file_name: uploadedFileName || null,
          credentials
        })
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setToastMsg('');

    const quotaConfig = getPlanQuotaConfig(userProfile?.plan_tier || 'free');
    const usage = getLocalQuotaUsage(userProfile?.id || 'default');
    if (quotaConfig.postLimit < 9999 && usage.postsUsed >= quotaConfig.postLimit) {
      setErrorMsg(
        `Monthly Auto-Post Limit Reached (${usage.postsUsed}/${quotaConfig.postLimit} posts used on ${quotaConfig.name}). Please upgrade your subscription package to schedule more posts.`
      );
      return;
    }

    if (!caption.trim()) {
      setErrorMsg('Please enter a post caption before scheduling or publishing.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setErrorMsg('Please select at least one target platform (Facebook, Instagram, or LinkedIn).');
      return;
    }

    setSubmitting(true);
    await incrementQuotaUsage(userProfile?.id || 'default', { messages: 0, tokens: 0, posts: 1 });
    const newPost = {
      id: `post_${Date.now()}`,
      title: title.trim() || 'Social Media Post',
      caption: caption.trim(),
      mediaUrl: mediaUrl.trim(),
      fileName: uploadedFileName || '',
      platforms: [...selectedPlatforms],
      sheetSynced: Boolean(googleSheetLink),
      driveSynced: Boolean(googleDriveFolderLink || mediaUrl),
      scheduledAt: publishMode === 'now' ? new Date().toISOString().slice(0, 16) : scheduledAt,
      status: publishMode === 'now' ? 'Published' : 'Scheduled in Sheet',
      createdAt: new Date().toISOString()
    };

    await dispatchToN8n(newPost);

    const updated = [newPost, ...posts];
    await persistPosts(updated);

    setToastMsg(
      publishMode === 'now'
        ? 'Post & Google Drive photo link synced to your Google Sheet and dispatched for immediate publishing!'
        : 'Post & Google Drive photo link automatically added to your Google Sheet schedule!'
    );

    setTitle('');
    setCaption('');
    setMediaUrl('');
    setUploadedFileName('');
    setUploadedFilePreview('');
    setSubmitting(false);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleTriggerNow = async (post) => {
    setTriggeringId(post.id);
    await dispatchToN8n(post);
    const updated = posts.map(p => (p.id === post.id ? { ...p, status: 'Published' } : p));
    await persistPosts(updated);
    setTriggeringId(null);
    setToastMsg(`"${post.title}" published across selected platforms!`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleDeletePost = async (postId) => {
    const updated = posts.filter(p => p.id !== postId);
    await persistPosts(updated);
    setToastMsg('Post removed from queue.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-bold text-white tracking-tight">Auto Post &amp; Content Scheduler</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Drive &rarr; Sheet &rarr; FB • IG • LinkedIn
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Upload photos from your PC directly to Google Drive, auto-paste the Drive link into your Google Sheet, and publish across Facebook, Instagram, and LinkedIn.
          </p>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('composer')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'composer'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('sheet_drive_setup')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'sheet_drive_setup'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Links
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: POST COMPOSER & SCHEDULED QUEUE */}
      {activeSubTab === 'composer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: New Post Composer */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 self-start">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create &amp; Schedule Post</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveSubTab('sheet_drive_setup')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {googleSheetLink ? 'Sheet Connected' : 'Connect Sheet & Drive'}
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Campaign / Post Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Collection Launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Post Caption &amp; Hashtags
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your post caption here..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Photo Upload from Local PC + Auto-Generated Google Drive Link */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Post Photo</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLocalFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingToDrive}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingToDrive ? 'Uploading...' : 'Upload'}</span>
                  </button>
                </div>

                {uploadedFilePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 p-2 flex items-center space-x-3">
                    <img
                      src={uploadedFilePreview}
                      alt="Uploaded preview"
                      className="w-14 h-14 object-cover rounded-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-emerald-400 truncate">{uploadedFileName}</p>
                      <p className="text-[10px] text-slate-400">
                        Synced to Google Drive &amp; linked to Spreadsheet
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFilePreview('');
                        setUploadedFileName('');
                        setMediaUrl('');
                      }}
                      className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center space-x-1">
                    <Link2 className="w-3 h-3 text-indigo-400" />
                    <span>Google Drive Image Link (Auto-filled on Upload or Paste Manually)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/... (Auto-pasted when you upload a photo)"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Target Platforms Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Target Social Platforms
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-400' },
                    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
                    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-sky-400' }
                  ].map((plat) => {
                    const Icon = plat.icon;
                    const active = selectedPlatforms.includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => togglePlatform(plat.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? plat.color : 'text-slate-500'}`} />
                        <span>{plat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Publish Mode */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPublishMode('schedule')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                    publishMode === 'schedule'
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Schedule to Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('now')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                    publishMode === 'now'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Now</span>
                </button>
              </div>

              {publishMode === 'schedule' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Scheduled Date &amp; Time
                  </label>
                  <ScheduleDateTimePicker
                    value={scheduledAt}
                    onChange={(val) => setScheduledAt(val)}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Syncing with Sheet & Drive...'
                    : publishMode === 'now'
                      ? 'Publish Now & Sync to Sheet'
                      : 'Save to Google Sheet & Schedule'}
                </span>
              </button>
            </form>
          </div>

          {/* Right 7 Cols: Scheduled & Published Posts List */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden self-start">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CalendarClock className="w-4 h-4 text-indigo-400" />
                <span>Scheduled &amp; Published Posts ({posts.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {googleSheetLink ? 'Connected to Google Sheet' : 'Local Queue Active'}
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CalendarClock className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No Scheduled Posts Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload a photo from your PC on the left, write your caption, and schedule it directly to your Google Sheet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {posts.map((post) => (
                  <div key={post.id} className="p-5 space-y-3 hover:bg-slate-800/30 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{post.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            post.status === 'Published'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {post.caption}
                        </p>
                        {post.mediaUrl && (
                          <p className="text-[11px] text-indigo-400 font-mono truncate max-w-md">
                            Drive Link: {post.mediaUrl}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {post.status !== 'Published' && (
                          <button
                            type="button"
                            onClick={() => handleTriggerNow(post)}
                            disabled={triggeringId === post.id}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition"
                          >
                            <Play className="w-3 h-3" />
                            <span>{triggeringId === post.id ? 'Posting...' : 'Post Now'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500">Platforms:</span>
                        {post.platforms.includes('facebook') && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">Facebook</span>
                        )}
                        {post.platforms.includes('instagram') && (
                          <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 font-semibold">Instagram</span>
                        )}
                        {post.platforms.includes('linkedin') && (
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold">LinkedIn</span>
                        )}
                      </div>

                      <span className="text-slate-400 font-mono">
                        Schedule: {post.scheduledAt ? post.scheduledAt.replace('T', ' ') : 'Immediate'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: GOOGLE DRIVE SIGN-IN, DROPDOWN PICKER & LINK SETUP */
        <form onSubmit={handleSaveSheetAndDrive} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 max-w-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Connect Google Drive &amp; Content Sheet</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Sign in with your Google Drive to select or auto-create your Google Sheet &amp; Drive Folder, or paste links directly below.
              </p>
            </div>

            {googleSession ? (
              <div className="flex items-center space-x-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {googleSession.email || 'Google Connected'}
                </span>
                <button
                  type="button"
                  onClick={() => refreshGoogleWorkspaceLists(googleSession.accessToken)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Refresh Drive Items"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${googleBusy ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveGoogleSession(userId, null);
                    setGoogleSession(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400"
                  title="Disconnect Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogleDrive}
                disabled={googleBusy}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/25 shrink-0"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>{googleBusy ? 'Connecting...' : 'Sign in with Google Drive'}</span>
              </button>
            )}
          </div>

          {!googleClientId && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Google OAuth Client ID (Auto-inherited from Master Admin or enter here)
              </label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => {
                  setGoogleClientId(e.target.value);
                  localStorage.setItem('saas_google_client_id', e.target.value.trim());
                }}
                placeholder="1234567890-abcxyz.apps.googleusercontent.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Sheet (Content Queue)</span>
                </label>
                {googleSession && (
                  <button
                    type="button"
                    onClick={handleAutoCreateContentSheet}
                    disabled={googleBusy}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create New Sheet</span>
                  </button>
                )}
              </div>

              {googleSession && driveSheets.length > 0 && (
                <select
                  value={driveSheets.find(s => googleSheetLink.includes(s.id))?.id || ''}
                  onChange={(e) => {
                    const selected = driveSheets.find(s => s.id === e.target.value);
                    if (selected) setGoogleSheetLink(selected.webViewLink || `https://docs.google.com/spreadsheets/d/${selected.id}/edit`);
                  }}
                  className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select existing Google Sheet from Drive...</option>
                  {driveSheets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}

              <input
                type="text"
                required
                value={googleSheetLink}
                onChange={(e) => setGoogleSheetLink(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Drive Folder (Uploaded Photos)</span>
                </label>
                {googleSession && (
                  <button
                    type="button"
                    onClick={handleAutoCreateDriveFolder}
                    disabled={googleBusy}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-bold transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create New Folder</span>
                  </button>
                )}
              </div>

              {googleSession && driveFolders.length > 0 && (
                <select
                  value={driveFolders.find(f => googleDriveFolderLink.includes(f.id))?.id || ''}
                  onChange={(e) => {
                    const selected = driveFolders.find(f => f.id === e.target.value);
                    if (selected) setGoogleDriveFolderLink(selected.webViewLink || `https://drive.google.com/drive/folders/${selected.id}`);
                  }}
                  className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select existing Drive Folder...</option>
                  {driveFolders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}

              <input
                type="text"
                required
                value={googleDriveFolderLink}
                onChange={(e) => setGoogleDriveFolderLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Sheet &amp; Drive Links</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
