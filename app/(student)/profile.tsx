import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('overview');

  const profileInfo = [
    { label: 'Enrolled On', value: 'Jan 15, 2026', icon: '📅' },
    { label: 'Days Active', value: '52 days', icon: '📊' },
    { label: 'Total Hours', value: '156 hours', icon: '⏱️' },
    { label: 'Learning Streak', value: '14 days', icon: '🔥' },
  ];

  const performanceMetrics = [
    { label: 'Days Absent', value: '2 days', icon: '❌', color: '#ef4444' },
    { label: 'Skills Learnt', value: '6 skills', icon: '🎓', color: '#0369a1' },
    { label: 'Skills Reviewed', value: '4 skills', icon: '✅', color: '#10b981' },
    { label: 'Avg Rating', value: '4.8/5.0', icon: '⭐', color: '#f59e0b' },
  ];

  const achievements = [
    { id: 1, title: 'Early Bird', description: 'Attended first 5 sessions', icon: '🌅' },
    { id: 2, title: 'Consistent Learner', description: 'Maintained 7-day learning streak', icon: '✨' },
    { id: 3, title: 'Mentor\'s Favorite', description: '4 skills reviewed', icon: '⭐' },
    { id: 4, title: 'Never Give Up', description: '100+ learning hours', icon: '💪' },
  ];

  const recentActivity = [
    { date: 'Today', activity: 'Submitted learning log - React Hooks' },
    { date: 'Yesterday', activity: 'Marked attendance' },
    { date: 'Mar 6', activity: 'Received mentor feedback - JavaScript ES6+' },
    { date: 'Mar 5', activity: 'Completed TypeScript module' },
    { date: 'Mar 4', activity: 'Started API Integration course' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatar}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Alex Johnson</Text>
              <Text style={styles.profileEmail}>alex.johnson@email.com</Text>
              <Text style={styles.profileRole}>Student • Batch 2026</Text>
            </View>
          </View>
        </View>

        {/* Key Stats Grid */}
        <View style={styles.statsGrid}>
          {profileInfo.map((stat, idx) => (
            <View key={idx} style={styles.statBox}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
              Performance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'achievements' && styles.tabActive]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Text style={[styles.tabText, selectedTab === 'achievements' && styles.tabTextActive]}>
              Achievements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'activity' && styles.tabActive]}
            onPress={() => setSelectedTab('activity')}
          >
            <Text style={[styles.tabText, selectedTab === 'activity' && styles.tabTextActive]}>
              Activity
            </Text>
          </TouchableOpacity>
        </View>

        {/* Performance Tab */}
        {selectedTab === 'overview' && (
          <View style={styles.performanceContainer}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              {performanceMetrics.map((metric, idx) => (
                <View key={idx} style={styles.metricCard}>
                  <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                    <Text style={styles.metricIconText}>{metric.icon}</Text>
                  </View>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Learning Trends</Text>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>This Week</Text>
                <View style={styles.trendBar}>
                  <View style={[styles.trendFill, { width: '75%' }]} />
                </View>
                <Text style={styles.trendValue}>15 hours</Text>
              </View>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>Last Week</Text>
                <View style={styles.trendBar}>
                  <View style={[styles.trendFill, { width: '60%' }]} />
                </View>
                <Text style={styles.trendValue}>12 hours</Text>
              </View>
              <View style={styles.trendItem}>
                <Text style={styles.trendLabel}>2 Weeks Ago</Text>
                <View style={styles.trendBar}>
                  <View style={[styles.trendFill, { width: '80%' }]} />
                </View>
                <Text style={styles.trendValue}>16 hours</Text>
              </View>
            </View>
          </View>
        )}

        {/* Achievements Tab */}
        {selectedTab === 'achievements' && (
          <View style={styles.achievementsContainer}>
            <Text style={styles.sectionTitle}>Badges & Achievements</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.badgeBox}>
                    <Text style={styles.badgeIcon}>{achievement.icon}</Text>
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                </View>
              ))}
            </View>

            <View style={styles.achievementStatsCard}>
              <Text style={styles.statsCardTitle}>Achievement Stats</Text>
              <View style={styles.statsItem}>
                <Text style={styles.statsItemLabel}>Total Badges Earned</Text>
                <Text style={styles.statsItemValue}>4</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsItemLabel}>Progress to Next Badge</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '60%' }]} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Activity Tab */}
        {selectedTab === 'activity' && (
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.map((item, idx) => (
              <View key={idx} style={styles.activityCard}>
                <View style={styles.activityTimeline}>
                  <View style={styles.timelineDot} />
                  {idx !== recentActivity.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityDate}>{item.date}</Text>
                  <Text style={styles.activityText}>{item.activity}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Contact Tutor */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>📞 Need Help?</Text>
          <Text style={styles.contactText}>Contact your mentor for personalized guidance</Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Message Mentor</Text>
          </TouchableOpacity>
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
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ecf7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatar: {
    fontSize: 36,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIcon: {
    fontSize: 28,
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
    color: '#64748b',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0369a1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 14,
  },
  performanceContainer: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  metricIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconText: {
    fontSize: 24,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 14,
  },
  trendItem: {
    marginBottom: 14,
  },
  trendLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  trendBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  trendFill: {
    height: '100%',
    backgroundColor: '#0369a1',
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  achievementsContainer: {
    marginBottom: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  badgeBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementStatsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 14,
  },
  statsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statsItemLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    flex: 1,
  },
  statsItemValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369a1',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0369a1',
    borderRadius: 3,
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityTimeline: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0369a1',
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#bfdbfe',
  },
  activityContent: {
    flex: 1,
    paddingRight: 12,
    paddingVertical: 12,
  },
  activityDate: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '700',
    marginBottom: 2,
  },
  activityText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: '#ecf7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: '#0369a1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
});
