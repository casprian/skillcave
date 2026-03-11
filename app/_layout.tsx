import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndRole = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (isMounted) {
          if (error) {
            console.error('Session check error:', error);
            setSession(null);
            setUserRole(null);
          } else {
            console.log('Session status:', currentSession ? 'Active' : 'No session');
            setSession(currentSession);
            
            // Fetch user role if session exists
            if (currentSession?.user) {
              try {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('email', currentSession.user.email)
                  .maybeSingle();
                
                if (profileError && profileError.code !== 'PGRST116') {
                  console.error('Error fetching user role:', profileError);
                }
                
                if (profileData?.role) {
                  console.log('User role:', profileData.role);
                  setUserRole(profileData.role);
                } else {
                  console.log('No profile found, defaulting to student');
                  setUserRole('student');
                }
              } catch (err) {
                console.error('Error fetching user role:', err);
              }
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        if (isMounted) {
          setSession(null);
          setUserRole(null);
          setIsLoading(false);
        }
      }
    };

    // Check session immediately
    checkSessionAndRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        console.log('Auth state changed:', _event, session ? 'Session' : 'No session');
        setSession(session);
        
        // Fetch role when auth state changes
        if (session?.user) {
          supabase
            .from('profiles')
            .select('role')
            .eq('email', session.user.email)
            .maybeSingle()
            .then(({ data, error }) => {
              if (isMounted) {
                if (error && error.code !== 'PGRST116') {
                  console.error('Error fetching role:', error);
                }
                if (data?.role) {
                  setUserRole(data.role);
                } else {
                  setUserRole('student');
                }
              }
            })
            .catch(err => console.error('Error fetching role:', err));
        } else {
          setUserRole(null);
        }
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
