
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aolmpvdlmmadcyfdfzul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qQnLFVTy0cQZGt2uc8098g_GwanqTTH';

const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(input, init);
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

