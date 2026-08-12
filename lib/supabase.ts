
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aolmpvdlmmadcyfdfzul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qQnLFVTy0cQZGt2uc8098g_GwanqTTH';

export const clearSupabaseAuth = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  } catch (e) {
    console.warn('Error clearing Supabase auth storage:', e);
  }
};

const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        const errStr = JSON.stringify(data).toLowerCase();
        if (
          errStr.includes('invalid refresh token') ||
          errStr.includes('refresh token not found') ||
          errStr.includes('refresh_token_not_found')
        ) {
          console.warn('Refresh token error intercepted in fetch. Clearing stale session:', errStr);
          clearSupabaseAuth();
        }
      } catch (_) {
        // Ignored if JSON parsing fails
      }
    }
    return response;
  } catch (err: any) {
    console.warn('Supabase fetch network error handled:', err);
    throw new Error('Falha de conexão com o servidor Supabase');
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: safeFetch
  }
});


