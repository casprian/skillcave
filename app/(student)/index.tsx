import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function StudentDashboard() {
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

  const quickActions = [
    { id: 1, title: 'Mark Attendance', icon: '✓', color: '#0369a1', bgColor: '#ecf7ff', route: '/attendance' },
    { id: 2, title: 'Learning Log', icon: '📝', color: '#0284c7', bgColor: '#f0f9ff', route: '/learning-log' },
    { id: 3, title: 'View Progress', icon: '📊', color: '#0c4a6e', bgColor: '#e0f2fe', route: '/progress' },
    { id: 4, title: 'Resources', icon: '📚', color: '#1e40af', bgColor: '#dbeafe', route: '/resources' },
  ];

  const profileItems = [
    { id: 1, label: '📅 Enrolled On', value: 'Jan 15, 2026', route: '/profile' },
    { id: 2, label: '🔥 Highest Streak', value: '14 days', route: '/profile' },
    { id: 3, label: '⏳ Days Absent', value: '2 days', route: '/profile' },
    { id: 4, label: '🎓 Skills Learnt', value: '6 skills', route: '/skills' },
    { id: 5, label: '✅ Skills Reviewed', value: '4 skills', route: '/skills' },
    { id: 6, label: '⭐ Avg Rating', value: '4.8/5.0', route: '/profile' },
  ];

  const leaderboardData = [
    { rank: 1, name: 'Alex Johnson', effort: '156 hours', streak: '14 days', badge: '👑' },
    { rank: 2, name: 'Sarah Chen', effort: '142 hours', streak: '12 days', badge: '🥈' },
    { rank: 3, name: 'You', effort: '156 hours', streak: '14 days', badge: '🏆', isUser: true },
    { rank: 4, name: 'Michael Park', effort: '138 hours', streak: '10 days', badge: '🥉' },
    { rank: 5, name: 'Emma Wilson', effort: '125 hours', streak: '8 days', badge: '⭐' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoHeader}>
          <Image 
            source={require('../../assets/images/logo.jpeg')}
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>SkillCave</Text>
        </View>
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
          <Text style={styles.userEmail}>{user?.email || 'Student'}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Submissions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>92%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Student Information Section */}
        <Text style={styles.sectionTitle}>Your Profile</Text>
        <View style={styles.infoGrid}>
          {profileItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.infoCard}
              onPress={() => router.push(`/(student)${item.route}` as any)}
            >
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity 
              key={action.id}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={() => router.push(`/(student)${action.route}` as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                <Text style={[styles.iconText, { color: action.color }]}>
                  {action.icon}
                </Text>
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leaderboard Section */}
        <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
        <View style={styles.leaderboardCard}>
          {leaderboardData.map((entry, idx) => (
            <View 
              key={idx} 
              style={[
                styles.leaderboardItem,
                entry.isUser && styles.leaderboardItemUser,
                idx !== leaderboardData.length - 1 && styles.leaderboardItemBorder
              ]}
            >
              <View style={styles.leaderboardRank}>
                <Text style={styles.rankBadge}>{entry.badge}</Text>
                <Text style={styles.rankNumber}>#{entry.rank}</Text>
              </View>
              <View style={styles.leaderboardInfo}>
                <Text style={[styles.leaderboardName, entry.isUser && styles.leaderboardNameHighlight]}>
                  {entry.name}
                </Text>
                <View style={styles.leaderboardStats}>
                  <Text style={styles.leaderboardStatText}>📚 {entry.effort}</Text>
                  <Text style={styles.leaderboardStatText}>🔥 {entry.streak}</Text>
                </View>
              </View>
              {entry.isUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityDate}>Today</Text>
            <Text style={styles.activityText}>You marked attendance</Text>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityDate}>Yesterday</Text>
            <Text style={styles.activityText}>Learning log submitted</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0369a1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    elevation: 4,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSmall: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderTopWidth: 3,
    borderTopColor: '#0369a1',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c2d4c',
    textAlign: 'center',
  },
  activitySection: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  activityDate: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#334155',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0369a1',
  },
  leaderboardCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 28,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leaderboardItemUser: {
    backgroundColor: '#ecf7ff',
  },
  leaderboardItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  leaderboardRank: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 50,
  },
  rankBadge: {
    fontSize: 24,
    marginBottom: 2,
  },
  rankNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  leaderboardNameHighlight: {
    color: '#0369a1',
  },
  leaderboardStats: {
    flexDirection: 'row',
    gap: 10,
  },
  leaderboardStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  youBadge: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'white',
  },
});