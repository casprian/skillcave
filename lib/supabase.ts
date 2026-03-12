import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔐 [Supabase] Initializing Supabase client');

// In-memory storage that persists during the app session
// Sessions are kept in RAM and survive app navigation and screen changes
// They are cleared only when the app is fully closed
const memoryStorage: { [key: string]: string } = {};

const createInMemoryStorage = () => {
  return {
    getItem: async (key: string) => {
      try {
        const value = memoryStorage[key] || null;
        console.log(`📦 [SessionStorage] Retrieved ${key}: ${value ? '✅ found' : '⭕ empty'}`);
        return value;
      } catch (error) {
        console.error(`❌ [SessionStorage] Error getting ${key}:`, error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        memoryStorage[key] = value;
        console.log(`💾 [SessionStorage] Saved ${key} (session in memory)`);
      } catch (error) {
        console.error(`❌ [SessionStorage] Error saving ${key}:`, error);
      }
    },
    removeItem: async (key: string) => {
      try {
        delete memoryStorage[key];
        console.log(`🗑️ [SessionStorage] Removed ${key}`);
      } catch (error) {
        console.error(`❌ [SessionStorage] Error removing ${key}:`, error);
      }
    },
  };
};

const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ [Supabase] Missing credentials');
    return null;
  }

  console.log('📡 [Supabase] Creating client with in-memory session storage');

  try {
    const inMemoryStorage = createInMemoryStorage();
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true, // ✅ ENABLED: Keep session in memory while app is open
        detectSessionInUrl: false,
        storage: inMemoryStorage, // ✅ Use in-memory storage (survives navigation)
      },
    });
    console.log('✅ [Supabase] Client created successfully - sessions stored in memory');
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
