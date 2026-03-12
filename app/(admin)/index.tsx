import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/enroll');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>SkillCave</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Management Hub 📊</Text>
        <Text style={styles.userEmail}>{(user as any)?.email}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Students</Text>
            <Text style={styles.statNumber}>0</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Tutors</Text>
            <Text style={styles.statNumber}>0</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Sessions</Text>
            <Text style={styles.statNumber}>0</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending Verifications</Text>
            <Text style={styles.statNumber}>0</Text>
          </View>
        </View>

        <View style={styles.actionCardsContainer}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>👥 User Management</Text>
            <Text style={styles.actionCardSubtitle}>Manage students, tutors, and admins</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>✅ Verify Accounts</Text>
            <Text style={styles.actionCardSubtitle}>Review pending verifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>📈 Analytics</Text>
            <Text style={styles.actionCardSubtitle}>View platform metrics and reports</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionCardTitle}>⚙️ Settings</Text>
            <Text style={styles.actionCardSubtitle}>Configure system preferences</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivityContainer}>
          <Text style={styles.activityTitle}>System Activity</Text>
          <Text style={styles.activityPlaceholder}>No recent system activity</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0c4a6e',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0369a1',
  },
  actionCardsContainer: {
    marginBottom: 28,
  },
  actionCard: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0369a1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '400',
  },
  recentActivityContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 16,
  },
  activityPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});