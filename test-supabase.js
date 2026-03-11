// Quick test to verify Supabase is configured
require('dotenv').config({ path: '.env.local' });

console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are not configured!');
  process.exit(1);
}

console.log('\n✅ Supabase credentials are properly configured');
console.log('URL:', supabaseUrl);
console.log('Key prefix:', supabaseAnonKey.substring(0, 20) + '...');
