import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [enrollmentDate, setEnrollmentDate] = useState<string>('Jan 15, 2026');
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitializedProfile, setHasInitializedProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getUserProfile = async () => {
      try {
        console.log('📊 Fetching user profile...');
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (userError) {
          console.error('❌ Auth error:', userError);
          Alert.alert('Error', 'Not logged in. Please log in again.');
          router.replace('/');
          return;
        }
        
        if (!authUser) {
          console.error('❌ No authenticated user found');
          setIsInitialLoading(false);
          router.replace('/');
          return;
        }

        console.log('✅ User authenticated:', authUser.email);
        setUser(authUser);

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') {
          console.error('Profile fetch error:', error);
        } else if (profileData) {
          console.log('Profile loaded:', profileData);
          setProfile(profileData);
        } else {
          console.log('No profile found for user, defaulting to student role');
          setProfile({ role: 'student' });
        }

        // Fetch leaderboard data
        if (authUser?.id) {
          await fetchLeaderboard(authUser.id);
        }

        setHasInitializedProfile(true);
        setIsInitialLoading(false);
      } catch (err) {
        console.error('Error loading user profile:', err);
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    getUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh data when screen comes into focus (only if profile is already loaded)
  useFocusEffect(
    useCallback(() => {
      if (hasInitializedProfile && user?.id) {
        console.log('🔄 Refreshing leaderboard on focus...');
        fetchLeaderboard(user.id);
      }
    }, [hasInitializedProfile, user?.id])
  );

  const fetchLeaderboard = async (userId: string) => {
    try {
      // Set current month display
      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      setCurrentMonth(monthName);

      // Fetch top 3 current month performers from view
      const { data: leaderboard, error: leaderboardError } = await supabase
        .from('current_month_top_performers')
        .select('*')
        .order('rank', { ascending: true })
        .limit(3);

      if (leaderboardError) {
        console.error('Leaderboard fetch error:', leaderboardError);
        return;
      }

      // Fetch user's current month rank
      const { data: userRankData, error: rankError } = await supabase
        .from('current_month_leaderboard')
        .select('*')
        .eq('student_id', userId)
        .maybeSingle();

      if (rankError && rankError.code !== 'PGRST116') {
        console.error('User rank fetch error:', rankError);
      } else if (userRankData) {
        setUserRank(userRankData);
      } else {
        // If no monthly leaderboard entry, fetch total points from profiles as fallback
        const { data: profileData } = await supabase
          .from('profiles')
          .select('total_points, id')
          .eq('id', userId)
          .maybeSingle();

        if (profileData) {
          setUserRank({ total_points: profileData.total_points || 0 });
        }
      }

      if (leaderboard) {
        setTopPerformers(leaderboard);
      }

      // Fetch progress logs with tutor information
      const { data: submissions, error: submissionError } = await supabase
        .from('learning_submissions')
        .select('*')
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false });

      if (submissionError && submissionError.code !== 'PGRST116') {
        console.error('Submissions fetch error:', submissionError);
        return;
      }

      if (submissions) {
        setProgressLogs(submissions);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  // Calculate learning streak (consecutive days of submissions)
  const calculateLearningStreak = () => {
    if (!progressLogs || progressLogs.length === 0) return 0;

    // Get unique dates of submissions (in YYYY-MM-DD format)
    const submissionDates = new Set<string>();
    progressLogs.forEach((log) => {
      if (log.submitted_at) {
        const date = new Date(log.submitted_at);
        submissionDates.add(date.toISOString().split('T')[0]);
      }
    });

    // Sort dates in descending order
    const sortedDates = Array.from(submissionDates).sort().reverse();
    
    if (sortedDates.length === 0) return 0;

    // Calculate consecutive days from today going backwards
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      if (sortedDates[i] === checkDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Count unique skills/topics from learning logs
  const calculateUniqueSkills = () => {
    if (!progressLogs || progressLogs.length === 0) return 0;

    const uniqueTopics = new Set<string>();
    progressLogs.forEach((log) => {
      if (log.topic) {
        uniqueTopics.add(log.topic);
      }
    });

    return uniqueTopics.size;
  };

  // Calculate approval percentage (approved submissions / total submissions)
  const calculateApprovalPercentage = () => {
    if (!progressLogs || progressLogs.length === 0) return 0;

    const approvedCount = progressLogs.filter((log) => log.status === 'approved').length;
    const percentage = Math.round((approvedCount / progressLogs.length) * 100);
    
    return percentage;
  };

  const mainActions = [
    { id: 1, title: 'Mark Attendance', icon: '✓', color: '#0369a1' },
    { id: 2, title: 'Learning Log', icon: '📝', color: '#06b6d4' },
  ];

  const profileStats = [
    { label: 'Learning Streak', value: `${calculateLearningStreak()} days`, icon: '🔥', color: '#f59e0b' },
    { label: 'Skills', value: calculateUniqueSkills(), icon: '🎓', color: '#10b981' },
    { label: 'Points', value: userRank?.total_points || '0', icon: '⭐', color: '#f97316' },
  ];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (user?.id) {
      await fetchLeaderboard(user.id);
    }
    setIsRefreshing(false);
  }, [user?.id]);

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
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🏆 Top Performers - {currentMonth}</Text>
      
      {/* Points System Legend */}
      <View style={styles.pointsLegend}>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>📝</Text>
          <Text style={styles.legendText}>Submission: <Text style={styles.legendPoints}>+1 pt</Text></Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>✅</Text>
          <Text style={styles.legendText}>Approved: <Text style={styles.legendPoints}>+10 pts</Text></Text>
        </View>
      </View>

      {/* Monthly Notice - Compact Badge */}
      <View style={styles.monthlyNoticeBadge}>
        <Text style={styles.monthlyBadgeText}>📅 Monthly Competition • Fresh start each month</Text>
      </View>

      <View style={styles.leaderboardCompact}>
        {topPerformers.length > 0 ? (
          topPerformers.map((entry, idx) => {
            const badges = ['👑', '🥈', '🥉'];
            const isUser = entry.student_id === user?.id;
            return (
              <View key={entry.id} style={[
                styles.leaderboardCompactItem,
                idx !== topPerformers.length - 1 && styles.leaderboardCompactBorder
              ]}>
                <Text style={styles.leaderboardBadge}>{badges[idx] || '🎯'}</Text>
                <View style={styles.leaderboardCompactInfo}>
                  <Text style={[styles.leaderboardCompactName, isUser && styles.userHighlight]}>
                    {entry.name || (entry.email ? entry.email.split('@')[0] : 'Student')} {isUser && '(You)'}
                  </Text>
                  <Text style={styles.leaderboardCompactStats}>
                    {entry.total_points} pts • {entry.approved_count}/{entry.submission_count} approved
                  </Text>
                </View>
                {isUser && <View style={styles.youIndicator} />}
              </View>
            );
          })
        ) : (
          <View style={styles.leaderboardCompactItem}>
            <Text style={styles.emptyLeaderboardText}>Loading leaderboard...</Text>
          </View>
        )}
      </View>

      {/* Historical Performance */}
      <View style={styles.historicalSection}>
        <Text style={styles.historicalTitle}>📊 Historical Performance</Text>
        <View style={styles.historicalInfo}>
          <Text style={styles.historicalText}>View your performance from previous months</Text>
          <TouchableOpacity style={styles.viewHistoryButton}>
            <Text style={styles.viewHistoryText}>View Archives →</Text>
          </TouchableOpacity>
        </View>
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

  const renderProgressLogTab = () => (
    <View>
      {/* Timeline Header */}
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineHeaderTitle}>📚 Your Learning Journey</Text>
        <Text style={styles.timelineHeaderSubtitle}>
          Since {enrollmentDate}
        </Text>
      </View>

      {/* Timeline Items */}
      {progressLogs.length > 0 ? (
        <View style={styles.timelineContainer}>
          {progressLogs.map((log, idx) => {
            const isLast = idx === progressLogs.length - 1;
            const statusColor = 
              log.status === 'approved' ? '#10b981' :
              log.status === 'rejected' ? '#ef4444' :
              '#f59e0b';
            const statusIcon = 
              log.status === 'approved' ? '✅' :
              log.status === 'rejected' ? '❌' :
              '⏳';

            return (
              <View key={log.id} style={[styles.timelineItem, !isLast && styles.timelineItemWithLine]}>
                {/* Timeline Line */}
                {!isLast && <View style={styles.timelineLine} />}

                {/* Timeline Dot */}
                <View style={[styles.timelineDot, { backgroundColor: statusColor }]}>
                  <Text style={styles.timelineIcon}>{statusIcon}</Text>
                </View>

                {/* Timeline Card */}
                <View style={styles.timelineCard}>
                  {/* Status & Date */}
                  <View style={styles.timelineCardHeader}>
                    <Text style={[styles.timelineStatus, { color: statusColor }]}>
                      {log.status === 'approved' ? 'Approved' :
                       log.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {new Date(log.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Submission Title & Topic */}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{log.title}</Text>
                    <View style={styles.timelineTopicBadge}>
                      <Text style={styles.timelineTopicText}>{log.topic}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.timelineDescription} numberOfLines={2}>
                    {log.description}
                  </Text>

                  {/* Tutor Info (if reviewed) */}
                  {log.reviewed_by && (
                    <View style={styles.tutorInfoBox}>
                      <Text style={styles.tutorLabel}>Reviewed by</Text>
                      <Text style={styles.tutorName}>
                        👨‍🏫 Tutor
                      </Text>
                      {log.reviewed_at && (
                        <Text style={styles.tutorDate}>
                          on {new Date(log.reviewed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Feedback */}
                  {log.tutor_feedback && (
                    <View style={[styles.feedbackBox, { borderLeftColor: statusColor }]}>
                      <Text style={styles.feedbackLabel}>💬 Feedback</Text>
                      <Text style={styles.feedbackText}>{log.tutor_feedback}</Text>
                    </View>
                  )}

                  {/* Submission Type Badge */}
                  <View style={styles.submissionTypeBadge}>
                    <Text style={styles.submissionTypeText}>
                      {log.submission_type === 'open' ? '🌐 Open Submission' : '👤 Targeted Submission'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📭</Text>
          <Text style={styles.emptyStateTitle}>No submissions yet</Text>
          <Text style={styles.emptyStateDesc}>
            Start submitting your learning logs to see your progress timeline
          </Text>
        </View>
      )}

      {/* Summary Stats */}
      {progressLogs.length > 0 && (
        <View style={styles.progressSummary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryValue}>{progressLogs.length}</Text>
            <Text style={styles.summaryLabel}>Total Submissions</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>✅</Text>
            <Text style={styles.summaryValue}>
              {progressLogs.filter(l => l.status === 'approved').length}
            </Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>⏳</Text>
            <Text style={styles.summaryValue}>
              {progressLogs.filter(l => l.status === 'pending').length}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>
      )}
    </View>
  );

  // Show loading screen during initial profile fetch
  if (isInitialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
        <ActivityIndicator size="large" color="#0369a1" />
        <Text style={{ marginTop: 12, fontSize: 14, color: '#0369a1', fontWeight: '600' }}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
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
          <Text style={styles.progressValue}>{calculateApprovalPercentage()}%</Text>
          <Text style={styles.progressLabel}>Approved</Text>
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
          style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
            Progress Log
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
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'progress' && renderProgressLogTab()}
        {activeTab === 'profile' && renderProfileTab()}
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
  pointsLegend: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 12,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIcon: {
    fontSize: 14,
  },
  legendText: {
    fontSize: 11,
    color: '#0c2d4c',
    fontWeight: '600',
  },
  legendPoints: {
    color: '#0369a1',
    fontWeight: '800',
  },
  emptyLeaderboardText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 12,
  },
  monthlyNoticeBadge: {
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  monthlyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6d28d9',
    textAlign: 'center',
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
  progressCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0369a1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0369a1',
    borderRadius: 4,
  },
  progressDesc: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  skillCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  skillDesc: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  skillPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369a1',
  },
  achievementGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
  timelineHeader: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  timelineHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  timelineHeaderSubtitle: {
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '500',
  },
  timelineContainer: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
    position: 'relative',
  },
  timelineItemWithLine: {
    marginBottom: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 52,
    width: 2,
    height: 100,
    backgroundColor: '#dbeafe',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
    zIndex: 10,
  },
  timelineIcon: {
    fontSize: 20,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginRight: 16,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  timelineContent: {
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 6,
  },
  timelineTopicBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  timelineTopicText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
  },
  timelineDescription: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 8,
  },
  tutorInfoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0369a1',
  },
  tutorLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  tutorName: {
    fontSize: 12,
    color: '#0c2d4c',
    fontWeight: '700',
    marginBottom: 2,
  },
  tutorDate: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  feedbackBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  feedbackLabel: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '700',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#78350f',
    fontWeight: '500',
    lineHeight: 16,
  },
  submissionTypeBadge: {
    backgroundColor: '#f3e8ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  submissionTypeText: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  emptyStateDesc: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
  progressSummary: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  historicalSection: {
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historicalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  historicalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historicalText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  viewHistoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0369a1',
    borderRadius: 6,
  },
  viewHistoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
});