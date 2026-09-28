import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'amapati_supabase_url';
const STORAGE_KEY_ANON = 'amapati_supabase_anon';

export function getStoredSupabaseConfig(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) || '' : '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function saveStoredSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
      localStorage.setItem(STORAGE_KEY_ANON, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseConfig();
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
}
