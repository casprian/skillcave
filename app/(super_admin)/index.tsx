import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch organizations
        const { data: orgsData } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });

        if (orgsData) {
          setOrganizations(orgsData);
        }
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0369a1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.logo}
            />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Super Admin</Text>
              <Text style={styles.headerSubtitle}>SkillCave Management</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>⟵</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.content}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Welcome, {user?.user_metadata?.name?.split(' ')[0]}! 👋</Text>
            <Text style={styles.welcomeSubtitle}>Organization Management</Text>
          </View>

          {/* Add Organization Button */}
          <TouchableOpacity 
            style={styles.createOrgBtn}
            onPress={() => router.navigate('/(super_admin)/organizations' as any)}
          >
            <Text style={styles.createOrgBtnIcon}>+</Text>
            <View style={styles.createOrgBtnContent}>
              <Text style={styles.createOrgBtnTitle}>Create New Organization</Text>
              <Text style={styles.createOrgBtnDesc}>Add and configure a new organization</Text>
            </View>
            <Text style={styles.createOrgBtnChevron}>›</Text>
          </TouchableOpacity>

          {/* Organizations List Header */}
          <View style={styles.listHeaderContainer}>
            <Text style={styles.listHeader}>Organizations ({organizations.length})</Text>
            <TouchableOpacity onPress={initializeUser}>
              <Text style={styles.refreshIcon}>⟳</Text>
            </TouchableOpacity>
          </View>

          {/* Organizations List */}
          {organizations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateTitle}>No Organizations Yet</Text>
              <Text style={styles.emptyStateDesc}>Create your first organization to get started</Text>
            </View>
          ) : (
            <View>
              {organizations.map((org) => (
                <TouchableOpacity 
                  key={org.id}
                  style={styles.orgCard}
                  onPress={() => router.navigate({
                    pathname: '/(super_admin)/organization-detail' as any,
                    params: { id: org.id }
                  } as any)}
                >
                  <View style={styles.orgCardHeader}>
                    <View style={styles.orgInitial}>
                      <Text style={styles.orgInitialText}>
                        {org.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>{org.name}</Text>
                      <Text style={styles.orgEmail}>{org.admin_email}</Text>
                    </View>
                  </View>
                  <View style={styles.orgFooter}>
                    <Text style={styles.orgStatus}>Active</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
    display: 'none',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 12,
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#0369a1',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  createOrgBtn: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 0,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  createOrgBtnIcon: {
    position: 'absolute',
    fontSize: 40,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.2)',
    right: 16,
    top: 12,
  },
  createOrgBtnContent: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  createOrgBtnTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  createOrgBtnDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  createOrgBtnChevron: {
    position: 'absolute',
    fontSize: 28,
    color: 'white',
    fontWeight: '300',
    right: 12,
    top: '50%',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionIconBg_org: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIconBg_settings: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  actionChevron: {
    fontSize: 24,
    color: '#cbd5e1',
    fontWeight: '300',
    marginLeft: 8,
  },
  actionCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafc',
  },
  actionCardMetric: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgInitialText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  orgEmail: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  orgFooter: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orgStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
});
