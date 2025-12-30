
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aolmpvdlmmadcyfdfzul.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qQnLFVTy0cQZGt2uc8098g_GwanqTTH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
