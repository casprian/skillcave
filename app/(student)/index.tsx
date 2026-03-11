import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('Profile fetch error:', error);
          } else if (profileData) {
            console.log('Profile loaded:', profileData);
            setProfile(profileData);
          } else {
            console.log('No profile found for user, defaulting to student role');
            setProfile({ role: 'student' });
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };

    getUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const mainActions = [
    { id: 1, title: 'Mark Attendance', icon: '✓', color: '#0369a1' },
    { id: 2, title: 'Learning Log', icon: '📝', color: '#06b6d4' },
    { id: 3, title: 'View Progress', icon: '📊', color: '#8b5cf6' },
  ];

  const profileStats = [
    { label: 'Streak', value: '14 days', icon: '🔥', color: '#f59e0b' },
    { label: 'Skills', value: '6', icon: '🎓', color: '#10b981' },
    { label: 'Rating', value: '4.8/5', icon: '⭐', color: '#f97316' },
  ];

  const topLeaderboard = [
    { rank: 1, name: 'You', hours: '156 hrs', streak: '14d', badge: '👑', isUser: true },
    { rank: 2, name: 'Sarah Chen', hours: '142 hrs', streak: '12d', badge: '🥈' },
    { rank: 3, name: 'Alex Johnson', hours: '136 hrs', streak: '10d', badge: '🥉' },
  ];

  const renderOverviewTab = () => (
    <View>
      {/* Hero Stats */}
      <View style={styles.statsSection}>
        {profileStats.map((stat, idx) => (
          <View key={idx} style={styles.miniStatCard}>
            <Text style={styles.miniStatIcon}>{stat.icon}</Text>
            <Text style={styles.miniStatValue}>{stat.value}</Text>
            <Text style={styles.miniStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Primary Actions */}
      <Text style={styles.sectionTitle}>Quick Start</Text>
      {mainActions.map((action) => (
        <TouchableOpacity 
          key={action.id} 
          style={styles.primaryActionCard}
          onPress={() => {
            if (action.id === 1) {
              router.push('/(student)/attendance');
            } else if (action.id === 2) {
              router.push('/(student)/learning-log');
            } else if (action.id === 3) {
              router.push('/(student)/progress');
            }
          }}
        >
          <View style={[styles.actionIconBg, { backgroundColor: action.color + '15' }]}>
            <Text style={styles.largeIcon}>{action.icon}</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionCardTitle}>{action.title}</Text>
            <Text style={styles.actionCardDesc}>Start now</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}

      {/* Top Performers */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Top Performers</Text>
      <View style={styles.leaderboardCompact}>
        {topLeaderboard.map((entry, idx) => (
          <View key={idx} style={[
            styles.leaderboardCompactItem,
            idx !== topLeaderboard.length - 1 && styles.leaderboardCompactBorder
          ]}>
            <Text style={styles.leaderboardBadge}>{entry.badge}</Text>
            <View style={styles.leaderboardCompactInfo}>
              <Text style={[styles.leaderboardCompactName, entry.isUser && styles.userHighlight]}>
                {entry.name}
              </Text>
              <Text style={styles.leaderboardCompactStats}>
                {entry.hours} • {entry.streak}
              </Text>
            </View>
            {entry.isUser && <View style={styles.youIndicator} />}
          </View>
        ))}
      </View>
    </View>
  );

  const renderProfileTab = () => (
    <View>
      <View style={styles.profileDetailCard}>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{user?.email}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Name</Text>
          <Text style={styles.profileValue}>{profile?.name || 'Not set'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Phone</Text>
          <Text style={styles.profileValue}>{profile?.phone || 'Not set'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Enrolled</Text>
          <Text style={styles.profileValue}>Jan 15, 2026</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.dangerButton}>
        <Text style={styles.dangerButtonText}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Minimalist Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/images/logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>SkillCave</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>Welcome, {profile?.name?.split(' ')[0] || 'Student'}! 👋</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Student'}
            </Text>
          </View>
        </View>
        <View style={styles.heroProgressRing}>
          <Text style={styles.progressValue}>92%</Text>
          <Text style={styles.progressLabel}>Complete</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' ? renderOverviewTab() : renderProfileTab()}
      </View>

      {/* Footer Padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0369a1',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0369a1',
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#f9f9f9',
  },
  heroContent: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  heroProgressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  progressLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0369a1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#0369a1',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 8,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  miniStatIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 12,
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  largeIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#0369a1',
    fontWeight: '300',
  },
  leaderboardCompact: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  leaderboardCompactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leaderboardCompactBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaderboardBadge: {
    fontSize: 20,
    marginRight: 10,
  },
  leaderboardCompactInfo: {
    flex: 1,
  },
  leaderboardCompactName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  userHighlight: {
    color: '#0369a1',
  },
  leaderboardCompactStats: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  youIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0369a1',
    marginLeft: 8,
  },
  profileDetailCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  profileValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c2d4c',
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
  },
});