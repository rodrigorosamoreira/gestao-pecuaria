import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL_STORAGE_KEY = 'custom_supabase_url';
export const SUPABASE_KEY_STORAGE_KEY = 'custom_supabase_anon_key';

export const DEFAULT_SUPABASE_URL = 'https://aolmpvdlmmadcyfdfzul.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_qQnLFVTy0cQZGt2uc8098g_GwanqTTH';

export const getSupabaseConfig = () => {
  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      customUrl = window.localStorage.getItem(SUPABASE_URL_STORAGE_KEY)?.trim() || '';
      customKey = window.localStorage.getItem(SUPABASE_KEY_STORAGE_KEY)?.trim() || '';
    } catch (_) {}
  }

  const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string)?.trim() || '';
  const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string)?.trim() || '';

  const url = customUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = customKey || envKey || DEFAULT_SUPABASE_ANON_KEY;
  const isCustom = Boolean(customUrl || envUrl);

  return {
    url,
    anonKey,
    isCustom,
    hasCustomUrl: Boolean(customUrl),
    hasEnvUrl: Boolean(envUrl)
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

export const saveCustomSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = key.trim();
    if (cleanUrl) {
      window.localStorage.setItem(SUPABASE_URL_STORAGE_KEY, cleanUrl);
    } else {
      window.localStorage.removeItem(SUPABASE_URL_STORAGE_KEY);
    }
    if (cleanKey) {
      window.localStorage.setItem(SUPABASE_KEY_STORAGE_KEY, cleanKey);
    } else {
      window.localStorage.removeItem(SUPABASE_KEY_STORAGE_KEY);
    }
    clearSupabaseAuth();
  }
};

export const resetSupabaseConfig = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(SUPABASE_URL_STORAGE_KEY);
    window.localStorage.removeItem(SUPABASE_KEY_STORAGE_KEY);
    clearSupabaseAuth();
  }
};

export const testSupabaseConnection = async (targetUrl?: string, targetKey?: string): Promise<{ success: boolean; message: string }> => {
  const config = getSupabaseConfig();
  const url = (targetUrl || config.url).trim().replace(/\/+$/, '');
  const key = (targetKey || config.anonKey).trim();

  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'URL do Supabase inválida. Deve iniciar com https://' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'apikey': key
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok || res.status === 200 || res.status === 401 || res.status === 403) {
      return { success: true, message: 'Conexão com o servidor Supabase realizada com sucesso!' };
    }
    return { success: false, message: `Servidor respondeu com status ${res.status}.` };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return { success: false, message: 'Tempo limite esgotado ao tentar alcançar o servidor Supabase.' };
    }
    return { success: false, message: 'Não foi possível alcançar o servidor Supabase. Verifique a URL ou o status da rede.' };
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
          console.warn('Token de atualização expirado detectado no Supabase. Limpando sessão local.');
          clearSupabaseAuth();
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
        message: 'Servidor Supabase indisponível no momento. Modo offline ou armazenamento local recomendado.',
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

const initialConfig = getSupabaseConfig();

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
