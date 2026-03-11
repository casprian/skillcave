import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (isMounted) {
          if (error) {
            console.error('Session check error:', error);
            setSession(null);
          } else {
            console.log('Session status:', currentSession ? 'Active' : 'No session');
            setSession(currentSession);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    // Check session immediately
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        console.log('Auth state changed:', _event, session ? 'Session' : 'No session');
        setSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
        <ActivityIndicator size="large" color="#0369a1" />
      </View>
    );
  }

  return <Slot />;
}
