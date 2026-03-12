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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log('📊 Loading dashboard...');
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (userError) {
          console.error('❌ [Dashboard] getUser() error:', userError.message);
        }
        
        if (!authUser) {
          console.error('❌ [Dashboard] User not found - authUser is null');
          console.log('💡 [Dashboard] Check:');
          console.log('   1. Is session persisted in AsyncStorage?');
          console.log('   2. Did user complete login successfully?');
          console.log('   3. Is user still authenticated at app/index.tsx level?');
          setIsLoading(false);
          return;
        }
        
        console.log('✅ [Dashboard] User found:', authUser.email);

        setUser(authUser);

        // Fetch profile and leaderboard in parallel
        const [profileRes, leaderRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle(),
          (async () => {
            try {
              const now = new Date();
              const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              setCurrentMonth(monthName);

              const [performers, userRank, submissions] = await Promise.all([
                supabase
                  .from('current_month_top_performers')
                  .select('*')
                  .order('rank', { ascending: true })
                  .limit(3),
                supabase
                  .from('current_month_leaderboard')
                  .select('*')
                  .eq('student_id', authUser.id)
                  .maybeSingle(),
                supabase
                  .from('learning_submissions')
                  .select('*')
                  .eq('student_id', authUser.id)
                  .order('submitted_at', { ascending: false })
              ]);

              if (!isMounted) return { performers: null, userRank: null, submissions: null };

              return {
                performers: performers.data || [],
                userRank: userRank.data || null,
                submissions: submissions.data || []
              };
            } catch (err) {
              console.error('Error fetching leaderboard data:', err);
              return { performers: null, userRank: null, submissions: null };
            }
          })()
        ]);

        if (!isMounted) return;

        if (profileRes.data) {
          setProfile(profileRes.data);
        } else {
          setProfile({ role: 'student' });
        }

        if (leaderRes) {
          if (leaderRes.performers && leaderRes.performers.length > 0) {
            // Fetch profile names for the performers using email
            const emails = leaderRes.performers
              .map((p: any) => p.email)
              .filter((email: string) => email);
            
            if (emails.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('email, name')
                .in('email', emails);

              const profileMap = profiles?.reduce((acc: any, p: any) => {
                acc[p.email] = p.name;
                return acc;
              }, {}) || {};

              const enriched = leaderRes.performers.map((entry: any) => ({
                ...entry,
                name: profileMap[entry.email] || entry.name || (entry.email ? entry.email.split('@')[0] : 'Student'),
              }));
              setTopPerformers(enriched);
            } else {
              setTopPerformers(leaderRes.performers);
            }
          }
          if (leaderRes.userRank) setUserRank(leaderRes.userRank);
          if (leaderRes.submissions) setProgressLogs(leaderRes.submissions);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('❌ Error loading dashboard:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh only when screen refocuses after initial load
  useFocusEffect(
    useCallback(() => {
      if (!isLoading && user?.id) {
        console.log('🔄 Refreshing on focus...');
        fetchLeaderboard(user.id);
      }
    }, [isLoading, user?.id])
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

      // Fetch profile names for the performers
      let enrichedLeaderboard = leaderboard || [];
      if (enrichedLeaderboard.length > 0) {
        const emails = enrichedLeaderboard
          .map((p: any) => p.email)
          .filter((email: string) => email); // Filter out null/undefined emails
        
        if (emails.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('email, name')
            .in('email', emails);

          const profileMap = profiles?.reduce((acc: any, p: any) => {
            acc[p.email] = p.name;
            return acc;
          }, {}) || {};

          enrichedLeaderboard = enrichedLeaderboard.map((entry: any) => ({
            ...entry,
            name: profileMap[entry.email] || entry.name || (entry.email ? entry.email.split('@')[0] : 'Student'),
          }));
        }
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

      if (enrichedLeaderboard && enrichedLeaderboard.length > 0) {
        setTopPerformers(enrichedLeaderboard);
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

  const profileStats = [];

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
      {/* Professional Action Cards Section */}
      <View style={styles.actionCardsContainer}>
        {/* Mark Attendance Action */}
        <TouchableOpacity 
          style={styles.actionCardProfessional}
          onPress={() => router.push('/(student)/attendance')}
          activeOpacity={0.85}
        >
          <View style={styles.actionCardHeader}>
            <View style={styles.actionIconLarge_attendance}>
              <Text style={styles.actionIconText}>✓</Text>
            </View>
            <View style={styles.actionCardInfo}>
              <Text style={styles.actionCardTitleLarge}>Mark Attendance</Text>
              <Text style={styles.actionCardSubtitle}>Track your daily presence</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </View>
          <View style={styles.actionCardFooter}>
            <Text style={styles.actionCardMetric}>12/12 sessions attended</Text>
          </View>
        </TouchableOpacity>

        {/* Learning Log Action */}
        <TouchableOpacity 
          style={styles.actionCardProfessional}
          onPress={() => router.push('/(student)/learning-log')}
          activeOpacity={0.85}
        >
          <View style={styles.actionCardHeader}>
            <View style={styles.actionIconLarge_learning}>
              <Text style={styles.actionIconText}>📝</Text>
            </View>
            <View style={styles.actionCardInfo}>
              <Text style={styles.actionCardTitleLarge}>Log Learning</Text>
              <Text style={styles.actionCardSubtitle}>Record your progress</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </View>
          <View style={styles.actionCardFooter}>
            <Text style={styles.actionCardMetric}>{progressLogs?.length || 0} entries this month</Text>
          </View>
        </TouchableOpacity>
      </View>

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

      {/* Leaderboard Table */}
      <View style={styles.leaderboardTable}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCell_rank}>
            <Text style={styles.tableHeaderText}>Rank</Text>
          </View>
          <View style={styles.tableCell_name}>
            <Text style={styles.tableHeaderText}>Name</Text>
          </View>
          <View style={styles.tableCell_submitted}>
            <Text style={styles.tableHeaderText}>Submitted</Text>
          </View>
          <View style={styles.tableCell_approved}>
            <Text style={styles.tableHeaderText}>Approved</Text>
          </View>
          <View style={styles.tableCell_rate}>
            <Text style={styles.tableHeaderText}>Rate</Text>
          </View>
          <View style={styles.tableCell_points}>
            <Text style={styles.tableHeaderText}>Points</Text>
          </View>
        </View>

        {/* Table Body */}
        {topPerformers.length > 0 ? (
          topPerformers.map((entry, idx) => {
            const badges = ['👑', '🥈', '🥉'];
            const isUser = entry.student_id === user?.id;
            const approvalRate = entry.submission_count > 0 
              ? Math.round((entry.approved_count / entry.submission_count) * 100)
              : 0;
            return (
              <View 
                key={entry.id} 
                style={[
                  styles.tableRow,
                  isUser && styles.tableRowHighlight,
                  idx !== topPerformers.length - 1 && styles.tableRowBorder
                ]}
              >
                <View style={styles.tableCell_rank}>
                  <Text style={styles.tableCellText}>{badges[idx]} #{idx + 1}</Text>
                </View>
                <View style={styles.tableCell_name}>
                  <Text style={[styles.tableCellText, styles.tableCellNameText, isUser && styles.tableUserName]}>
                    {entry.name || (entry.email ? entry.email.split('@')[0] : 'Student')}
                    {isUser && <Text style={styles.userLabel}> (You)</Text>}
                  </Text>
                </View>
                <View style={styles.tableCell_submitted}>
                  <Text style={[styles.tableCellText, styles.tableCellBadge]}>{entry.submission_count}</Text>
                </View>
                <View style={styles.tableCell_approved}>
                  <Text style={[styles.tableCellText, styles.tableCellBadgeGreen]}>{entry.approved_count}</Text>
                </View>
                <View style={styles.tableCell_rate}>
                  <Text style={[styles.tableCellText, styles.tableCellBadgeBlue]}>{approvalRate}%</Text>
                </View>
                <View style={styles.tableCell_points}>
                  <Text style={[styles.tableCellText, styles.tableCellPointsText]}>{entry.total_points}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.tableRow}>
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

  // Show loading screen during initial data load
  if (isLoading) {
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
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>SkillCave</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>⎋</Text>
        </TouchableOpacity>
      </View>

      {/* Premium Header Section */}
      <View style={styles.premiumHeader}>
        {/* Top Row: Greeting + Role Badge */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Welcome, {profile?.name?.split(' ')[0] || 'Student'}! 👋</Text>
            <Text style={styles.headerSubtext}>Keep building momentum</Text>
          </View>
          <View style={styles.roleBadgeNew}>
            <Text style={styles.roleBadgeTextNew}>
              {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Student'}
            </Text>
          </View>
        </View>

        {/* Key Metrics - 4 Column Header */}
        <View style={styles.statsCardIntegrated}>
          <View style={styles.statItemSmall}>
            <Text style={styles.statIconSmall}>✅</Text>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValueSmall}>{calculateApprovalPercentage()}%</Text>
              <Text style={styles.statLabelSmall}>Approved</Text>
            </View>
          </View>
          <View style={styles.statDividerSmall} />
          <View style={styles.statItemSmall}>
            <Text style={styles.statIconSmall}>📝</Text>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValueSmall}>{progressLogs?.length || 0}</Text>
              <Text style={styles.statLabelSmall}>Submitted</Text>
            </View>
          </View>
          <View style={styles.statDividerSmall} />
          <View style={styles.statItemSmall}>
            <Text style={styles.statIconSmall}>🔥</Text>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValueSmall}>{calculateLearningStreak()}</Text>
              <Text style={styles.statLabelSmall}>Streak</Text>
            </View>
          </View>
          <View style={styles.statDividerSmall} />
          <View style={styles.statItemSmall}>
            <Text style={styles.statIconSmall}>🎓</Text>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValueSmall}>{calculateUniqueSkills()}</Text>
              <Text style={styles.statLabelSmall}>Skills</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Actions
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
  // Premium Header Styles (World-Class UX)
  premiumHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtext: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  roleBadgeNew: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  roleBadgeTextNew: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statsCardIntegrated: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItemSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconSmall: {
    fontSize: 20,
    marginRight: 10,
  },
  statTextContainer: {
    justifyContent: 'center',
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0c2d4c',
  },
  statLabelSmall: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  statDividerSmall: {
    width: 1,
    height: 40,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 12,
  },
  // Professional Action Card Styles
  actionCardsContainer: {
    marginHorizontal: 0,
    marginBottom: 24,
  },
  actionCardProfessional: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
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
  actionIconLarge_attendance: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIconLarge_learning: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  actionCardInfo: {
    flex: 1,
  },
  actionCardTitleLarge: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  actionCardSubtitle: {
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
  // Table Styles for Leaderboard
  leaderboardTable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#0369a1',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowHighlight: {
    backgroundColor: '#f0f9ff',
  },
  tableCell_rank: {
    width: 50,
  },
  tableCell_name: {
    flex: 2.5,
  },
  tableCell_submitted: {
    flex: 1.2,
    alignItems: 'center',
  },
  tableCell_approved: {
    flex: 1.2,
    alignItems: 'center',
  },
  tableCell_rate: {
    flex: 1,
    alignItems: 'center',
  },
  tableCell_points: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  tableCellText: {
    fontSize: 13,
    color: '#0c2d4c',
    fontWeight: '500',
  },
  tableCellNameText: {
    fontWeight: '600',
  },
  tableUserName: {
    color: '#0369a1',
    fontWeight: '700',
  },
  userLabel: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
  },
  tableCellBadge: {
    backgroundColor: '#dbeafe',
    color: '#0369a1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '600',
  },
  tableCellBadgeGreen: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '600',
  },
  tableCellBadgeBlue: {
    backgroundColor: '#ede9fe',
    color: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '600',
  },
  tableCellPointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369a1',
  },
});