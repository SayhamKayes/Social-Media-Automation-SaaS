import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qpltadfseyybjnqisocm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Shvos9PAGHozWfFBvpFRog__CLJM5ON';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));
};

/* Super Admin Pre-authorized Owner Emails */
export const SUPER_ADMIN_EMAILS = [
  'sayhamkayes101@gmail.com',
  'sayhamkayes@gmail.com',
  'admin@autoreply.ai'
];

export const checkIsSuperAdmin = (email) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

