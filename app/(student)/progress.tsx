import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function ProgressPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('overview');

  const skills = [
    { id: 1, name: 'React Fundamentals', progress: 85, level: 'Intermediate', status: 'In Progress' },
    { id: 2, name: 'TypeScript', progress: 70, level: 'Beginner', status: 'In Progress' },
    { id: 3, name: 'State Management', progress: 60, level: 'Beginner', status: 'In Progress' },
    { id: 4, name: 'CSS Grid & Flexbox', progress: 100, level: 'Advanced', status: 'Completed' },
    { id: 5, name: 'JavaScript ES6+', progress: 95, level: 'Advanced', status: 'Completed' },
    { id: 6, name: 'API Integration', progress: 75, level: 'Intermediate', status: 'In Progress' },
  ];

  const milestones = [
    { id: 1, title: '🎓 Complete React Basics', status: 'completed', date: 'Feb 15, 2026' },
    { id: 2, title: '⭐ 50 Learning Logs Submitted', status: 'in-progress', date: '35/50' },
    { id: 3, title: '🔥 Maintain 14-Day Learning Streak', status: 'in-progress', date: '14/14' },
    { id: 4, title: '✅ Mentor Review 5 Skills', status: 'completed', date: 'Mar 5, 2026' },
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? '#d1fae5' : status === 'in-progress' ? '#fef3c7' : '#fee2e2';
  };

  const getStatusTextColor = (status: string) => {
    return status === 'completed' ? '#10b981' : status === 'in-progress' ? '#f59e0b' : '#ef4444';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Overall Progress */}
        <View style={styles.overallCard}>
          <Text style={styles.overallTitle}>Overall Progress</Text>
          <Text style={styles.overallPercentage}>78%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '78%' }]} />
          </View>
          <Text style={styles.overallSubtitle}>5 out of 6 skills in progress</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
              Skills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'milestones' && styles.tabActive]}
            onPress={() => setSelectedTab('milestones')}
          >
            <Text style={[styles.tabText, selectedTab === 'milestones' && styles.tabTextActive]}>
              Milestones
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skills Tab */}
        {selectedTab === 'overview' && (
          <View style={styles.skillsContainer}>
            {skills.map((skill) => (
              <View key={skill.id} style={styles.skillCard}>
                <View style={styles.skillHeader}>
                  <View style={styles.skillInfo}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <Text style={styles.skillLevel}>{skill.level}</Text>
                  </View>
                  <Text style={[
                    styles.skillProgress,
                    { color: getProgressColor(skill.progress) }
                  ]}>
                    {skill.progress}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${skill.progress}%`, backgroundColor: getProgressColor(skill.progress) }
                  ]} />
                </View>
                <View style={styles.skillFooter}>
                  <Text style={styles.skillStatus}>{skill.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Milestones Tab */}
        {selectedTab === 'milestones' && (
          <View style={styles.milestonesContainer}>
            {milestones.map((milestone) => (
              <View key={milestone.id} style={styles.milestoneCard}>
                <View style={[
                  styles.milestoneStatus,
                  { backgroundColor: getStatusColor(milestone.status) }
                ]}>
                  <Text style={[
                    styles.milestoneStatusText,
                    { color: getStatusTextColor(milestone.status) }
                  ]}>
                    {milestone.status === 'completed' ? '✓' : '→'}
                  </Text>
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <Text style={styles.milestoneDate}>{milestone.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>6</Text>
            <Text style={styles.statLabel}>Total Skills</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Learning Tips</Text>
          <Text style={styles.tipText}>• Focus on one skill at a time for better retention</Text>
          <Text style={styles.tipText}>• Practice regularly to maintain your streak</Text>
          <Text style={styles.tipText}>• Get feedback from mentors to improve faster</Text>
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
  overallCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderTopWidth: 3,
    borderTopColor: '#0369a1',
  },
  overallTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  overallPercentage: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 5,
  },
  overallSubtitle: {
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: 'white',
  },
  skillsContainer: {
    marginBottom: 24,
  },
  skillCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  skillLevel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  skillProgress: {
    fontSize: 16,
    fontWeight: '800',
  },
  skillFooter: {
    marginTop: 10,
  },
  skillStatus: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  milestonesContainer: {
    marginBottom: 24,
  },
  milestoneCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  milestoneStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneStatusText: {
    fontSize: 20,
    fontWeight: '800',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
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
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#ecf7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 6,
    lineHeight: 18,
  },
});
