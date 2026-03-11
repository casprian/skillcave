import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { ActivityIndicator, View, Text } from 'react-native';
import { useState } from 'react';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔐 [Index] Starting auth check...');
        setDebugInfo('Checking session...');
        
        // Wait for native modules to initialize
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get session with retry
        let session = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            console.log(`🔄 [Index] Attempt ${attempts + 1}/${maxAttempts}...`);
            const { data: { session: s }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error(`❌ [Index] Auth error (attempt ${attempts + 1}):`, error.message);
              setDebugInfo(`Auth error: ${error.message}`);
            } else {
              session = s;
              if (session) {
                console.log(`✅ [Index] Session found (attempt ${attempts + 1}):`);
                console.log(`   - User ID: ${session.user?.id}`);
                console.log(`   - Email: ${session.user?.email}`);
                console.log(`   - Auth method: ${session.user?.user_metadata?.provider || 'default'}`);
              } else {
                console.log(`📭 [Index] No session found (attempt ${attempts + 1})`);
              }
              break;
            }
          } catch (err: any) {
            console.error(`❌ [Index] Exception (attempt ${attempts + 1}):`, err?.message || err);
            setDebugInfo(`Error: ${err?.message || 'Unknown error'}`);
          }
          
          attempts++;
          if (attempts < maxAttempts && !session) {
            console.log(`⏳ [Index] Waiting 1s before retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (session?.user) {
          console.log('👤 [Index] User authenticated:', session.user.email);
          setDebugInfo('Authenticated: ' + session.user.email);
          setIsAuthenticated(true);
        } else {
          console.log('🚫 [Index] No user session found after ' + attempts + ' attempts');
          setDebugInfo('No session found');
          setIsAuthenticated(false);
        }
      } catch (err: any) {
        console.error('💥 [Index] Unexpected error:', err);
        setDebugInfo('Unexpected error: ' + err?.message);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 20 }}>
        <ActivityIndicator size="large" color="#0369a1" />
        <Text style={{ marginTop: 16, fontSize: 12, color: '#0369a1', textAlign: 'center' }}>
          {debugInfo || 'Checking session...'}
        </Text>
      </View>
    );
  }

  if (isAuthenticated) {
    console.log('✅ [Index] Redirecting to student dashboard');
    return <Redirect href="/(student)" />;
  }

  console.log('🔄 [Index] Redirecting to login');
  return <Redirect href="/(auth)/login" />;
}