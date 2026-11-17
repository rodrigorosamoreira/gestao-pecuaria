import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://aolmpvdlmmadcyfdfzul.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_qQnLFVTy0cQZGt2uc8098g_GwanqTTH';

export const normalizeSupabaseUrl = (inputUrl: string): string => {
  if (!inputUrl) return '';
  let url = inputUrl.trim().replace(/\/+$/, '');
  url = url.replace(/\/auth(\/v1)?(\/.*)?$/i, '');
  url = url.replace(/\/rest(\/v1)?(\/.*)?$/i, '');
  url = url.replace(/\/storage(\/v1)?(\/.*)?$/i, '');
  return url.replace(/\/+$/, '');
};

export const getSupabaseConfig = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('custom_supabase_url');
      window.localStorage.removeItem('custom_supabase_anon_key');
    } catch (_) {}
  }

  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string)?.trim() || '';
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string)?.trim() || '';

  const rawUrl = envUrl || DEFAULT_SUPABASE_URL;
  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = envKey || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url,
    anonKey
  };
};

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
    console.warn('Erro ao limpar armazenamento do Supabase:', e);
  }
};

/**
 * Fetch seguro que intercepta erros de rede e tokens expirados
 * evitando o lançamento de exceções não tratadas no runtime.
 */
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
          console.warn('Sessão expirada ou token de atualização inválido. Limpando sessão local.');
          clearSupabaseAuth();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('supabase-session-expired'));
          }
        }
      } catch (_) {
        // Ignorado se não for JSON
      }
    }
    return response;
  } catch (err: any) {
    // Intercepta falhas de rede (DNS inexistente, offline, etc.)
    // Retorna uma resposta 503 estruturada para o cliente Supabase processar limpo sem quebrar a aplicação
    console.warn('Conexão de rede com Supabase indisponível:', err?.message || err);
    return new Response(
      JSON.stringify({
        message: 'Servidor Supabase indisponível no momento. Verifique sua conexão com a internet.',
        error: 'network_connection_failed',
        statusCode: 503
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

const sanitizeStoredSupabaseSession = (supabaseUrl: string) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const projectRefMatch = supabaseUrl.match(/^https?:\/\/([^.]+)\./i);
    const activeProjectRef = projectRefMatch ? projectRefMatch[1] : '';

    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;

      // Remove tokens de outros projetos Supabase se houver troca de URL
      if (activeProjectRef && !key.includes(`sb-${activeProjectRef}-`)) {
        keysToRemove.push(key);
        continue;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        keysToRemove.push(key);
        continue;
      }

      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !parsed.refresh_token || !parsed.access_token) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch (_) {}
};

const initialConfig = getSupabaseConfig();
sanitizeStoredSupabaseSession(initialConfig.url);

export const supabase: SupabaseClient = createClient(
  initialConfig.url,
  initialConfig.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    global: {
      fetch: safeFetch
    }
  }
);
