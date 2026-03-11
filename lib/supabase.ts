import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Platform detection
const isReactNative = 
  typeof navigator === 'undefined' && 
  typeof window === 'undefined' &&
  typeof document === 'undefined';

// Conditionally import AsyncStorage (React Native only)
let AsyncStorage: any = null;
if (isReactNative) {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    console.warn('AsyncStorage not available:', e);
  }
}

// Create Supabase client with platform-specific auth config
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  const authOptions: any = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  };

  // Only add storage on React Native when available
  if (isReactNative && AsyncStorage) {
    authOptions.storage = AsyncStorage;
  } else if (!isReactNative) {
    // On web, use browser's localStorage (default behavior)
    authOptions.storage = {
      getItem: (key: string) => {
        try {
          return Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null);
        } catch {
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
          return Promise.resolve();
        } catch {
          return Promise.resolve();
        }
      },
    };
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: authOptions,
  });
};

export const supabase = createSupabaseClient() as any;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL';
};