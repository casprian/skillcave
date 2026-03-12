import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export const useRoleBasedRouting = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkRoleAndRoute = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.replace('/(auth)/enroll');
          return;
        }

        // Get user profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', user.id)
          .single();

        const role = profile?.role || 'student';
        setUserRole(role);

        // Route based on role
        if (role === 'super_admin') {
          router.replace('/(super_admin)');
        } else if (role === 'organization_admin') {
          router.replace('/(admin)');
        } else if (role === 'tutor' || role === 'management') {
          router.replace('/(tutor)');
        } else {
          router.replace('/(student)');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        router.replace('/(auth)/enroll');
      } finally {
        setLoading(false);
      }
    };

    checkRoleAndRoute();
  }, [router]);

  return { loading, userRole };
};
