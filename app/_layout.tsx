import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 [RootLayout] Starting auth check...');
        
        // Wait a bit to ensure native modules are initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [RootLayout] getSession() error:', error.message);
        }
        
        if (session?.user) {
          console.log('✅ [RootLayout] Auth check complete - User found:', session.user.email);
          console.log(`   - User ID: ${session.user.id}`);
          console.log(`   - Session expires: ${session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'}`);
        } else {
          console.log('📭 [RootLayout] Auth check complete - No user session');
        }
        
        if (isMounted) {
          // Delay to ensure stable state
          setTimeout(() => {
            if (isMounted) {
              console.log('✅ [RootLayout] Ready to render');
              setIsReady(true);
            }
          }, 500);
        }
      } catch (err: any) {
        console.error('❌ [RootLayout] Auth failed:', err?.message || err);
        if (isMounted) {
          setTimeout(() => setIsReady(true), 500);
        }
      }
    };

    initAuth();

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any) => {
      if (event === 'INITIAL_SESSION') return;
      console.log('🔄 Auth event:', event);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
        <ActivityIndicator size="large" color="#0369a1" />
      </View>
    );
  }

  // Always render Stack - Expo Router handles routing automatically via file system
  return <Stack screenOptions={{ headerShown: false }} />;
}
