import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '../types';
import { db } from './mockEngine';

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

/**
 * Searches the 'profiles' table by business name or category using Supabase full-text search.
 * When Supabase is configured, executes full-text search (textSearch / websearch) or ilike filter on Postgres.
 * Seamlessly falls back to local database engine when working offline or before Supabase credentials are provided.
 */
export async function searchProfilesByFullText(
  query: string,
  options?: { category?: string; viewerId?: string }
): Promise<Profile[]> {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const trimmed = query.trim();
      let req = supabase.from('profiles').select('*');

      if (options?.category && options.category !== 'all') {
        req = req.ilike('category', `%${options.category}%`);
      }

      if (trimmed) {
        // Use Supabase Postgres Full-Text Search on business_name and category
        try {
          const { data: ftsData, error: ftsError } = await req
            .textSearch('business_name', trimmed, { config: 'english', type: 'websearch' })
            .limit(20);

          if (!ftsError && ftsData && ftsData.length > 0) {
            return ftsData as Profile[];
          }
        } catch {
          // Fall back to ilike query on remote Supabase
        }

        // Secondary fallback to multi-column ilike filter
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`business_name.ilike.%${trimmed}%,category.ilike.%${trimmed}%,bio.ilike.%${trimmed}%`)
          .limit(20);

        if (!error && data) {
          return data as Profile[];
        }
      } else {
        const { data } = await req.limit(25);
        if (data) return data as Profile[];
      }
    } catch (err) {
      console.warn('Supabase remote query failed, falling back to local DB search:', err);
    }
  }

  // Local database engine search with relevance ranking
  return db.searchProfiles(query, options);
}
