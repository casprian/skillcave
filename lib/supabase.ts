import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔐 [Supabase] Initializing Supabase client');

// Create a NO-OP storage implementation that prevents Supabase from trying to use AsyncStorage
// This avoids the "native module is null" error completely
const noopStorage = {
  getItem: async (key: string) => {
    console.log(`📦 [Supabase] getItem called for key: ${key} (returning null - no persistence)`);
    return null;
  },
  setItem: async (key: string, value: string) => {
    console.log(`📦 [Supabase] setItem called for key: ${key} (discarding - no persistence)`);
  },
  removeItem: async (key: string) => {
    console.log(`📦 [Supabase] removeItem called for key: ${key}`);
  },
};

const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Supabase] Missing credentials');
    return null;
  }

  console.log('📡 [Supabase] Creating client with no-op storage (prevents AsyncStorage access)');

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // CRITICAL: Disable persistence to skip storage entirely
        detectSessionInUrl: false,
        storage: noopStorage, // Use no-op storage instead of AsyncStorage
      },
    });
    console.log('✅ [Supabase] Client created successfully');
    return client;
  } catch (err: any) {
    console.error('❌ [Supabase] Failed to create client:', err?.message);
    return null;
  }
};

export const supabase = createSupabaseClient() as any;

if (!supabase) {
  console.error('💥 [Supabase] FATAL: Client is null');
}

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};
