import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SkillsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('learned');

  const skillsLearned = [
    {
      id: 1,
      name: 'React Fundamentals',
      proficiency: 'Expert',
      icon: '⚛️',
      learntDate: 'Jan 20, 2026',
      topics: ['Hooks', 'Components', 'JSX', 'Props', 'State']
    },
    {
      id: 2,
      name: 'JavaScript ES6+',
      proficiency: 'Expert',
      icon: '🟨',
      learntDate: 'Dec 28, 2025',
      topics: ['Async/Await', 'Destructuring', 'Arrow Functions', 'Spread Operator']
    },
    {
      id: 3,
      name: 'CSS Grid & Flexbox',
      proficiency: 'Advanced',
      icon: '🎨',
      learntDate: 'Jan 5, 2026',
      topics: ['Responsive Design', 'Layouts', 'Animations', 'Media Queries']
    },
    {
      id: 4,
      name: 'TypeScript Basics',
      proficiency: 'Intermediate',
      icon: '💙',
      learntDate: 'Feb 10, 2026',
      topics: ['Types', 'Interfaces', 'Generics', 'Decorators']
    },
  ];

  const skillsReviewedByMentors = [
    {
      id: 1,
      name: 'React Fundamentals',
      rating: 4.8,
      reviewDate: 'Mar 5, 2026',
      mentorFeedback: 'Excellent grasp of core concepts! Your component architecture is clean.',
      icon: '⚛️',
    },
    {
      id: 2,
      name: 'JavaScript ES6+',
      rating: 4.6,
      reviewDate: 'Feb 28, 2026',
      mentorFeedback: 'Strong understanding. Practice more with edge cases.',
      icon: '🟨',
    },
    {
      id: 3,
      name: 'CSS Grid & Flexbox',
      rating: 4.9,
      reviewDate: 'Feb 20, 2026',
      mentorFeedback: 'Outstanding! Your layouts are responsive and efficient.',
      icon: '🎨',
    },
    {
      id: 4,
      name: 'API Integration',
      rating: 4.5,
      reviewDate: 'Mar 1, 2026',
      mentorFeedback: 'Good progress. Work on error handling and optimization.',
      icon: '🔌',
    },
  ];

  const getRatingColor = (rating) => {
    if (rating >= 4.7) return '#10b981';
    if (rating >= 4.0) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skills</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Summary Stats */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>6</Text>
            <Text style={styles.summaryLabel}>Learnt</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>4</Text>
            <Text style={styles.summaryLabel}>Reviewed</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>4.7★</Text>
            <Text style={styles.summaryLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'learned' && styles.tabActive]}
            onPress={() => setSelectedTab('learned')}
          >
            <Text style={[styles.tabText, selectedTab === 'learned' && styles.tabTextActive]}>
              Skills Learnt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'reviewed' && styles.tabActive]}
            onPress={() => setSelectedTab('reviewed')}
          >
            <Text style={[styles.tabText, selectedTab === 'reviewed' && styles.tabTextActive]}>
              Reviewed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skills Learnt Tab */}
        {selectedTab === 'learned' && (
          <View style={styles.skillsContainer}>
            {skillsLearned.map((skill) => (
              <View key={skill.id} style={styles.skillCard}>
                <View style={styles.skillHeader}>
                  <View style={styles.skillIconBox}>
                    <Text style={styles.skillIcon}>{skill.icon}</Text>
                  </View>
                  <View style={styles.skillHeaderInfo}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <Text style={styles.skillProficiency}>Proficiency: {skill.proficiency}</Text>
                  </View>
                  <Text style={styles.skillDate}>{skill.learntDate}</Text>
                </View>

                <View style={styles.topicsContainer}>
                  {skill.topics.map((topic, idx) => (
                    <View key={idx} style={styles.topicTag}>
                      <Text style={styles.topicText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills Reviewed Tab */}
        {selectedTab === 'reviewed' && (
          <View style={styles.reviewedContainer}>
            {skillsReviewedByMentors.map((skill) => (
              <View key={skill.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewIconBox}>
                    <Text style={styles.reviewIcon}>{skill.icon}</Text>
                  </View>
                  <View style={styles.reviewHeaderInfo}>
                    <Text style={styles.reviewSkillName}>{skill.name}</Text>
                    <Text style={styles.reviewDate}>{skill.reviewDate}</Text>
                  </View>
                  <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(skill.rating) + '20' }]}>
                    <Text style={[styles.ratingText, { color: getRatingColor(skill.rating) }]}>
                      {skill.rating}★
                    </Text>
                  </View>
                </View>

                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackLabel}>Mentor Feedback:</Text>
                  <Text style={styles.feedbackText}>{skill.mentorFeedback}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>🎯 Next Steps</Text>
          <Text style={styles.recommendItem}>• Continue practicing API Integration</Text>
          <Text style={styles.recommendItem}>• Start learning State Management patterns</Text>
          <Text style={styles.recommendItem}>• Request mentor review for TypeScript</Text>
          <Text style={styles.recommendItem}>• Build a full-stack project combining learned skills</Text>
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
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
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 4,
  },
  summaryLabel: {
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skillIconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  skillIcon: {
    fontSize: 24,
  },
  skillHeaderInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  skillProficiency: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  skillDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicTag: {
    backgroundColor: '#ecf7ff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '700',
  },
  reviewedContainer: {
    marginBottom: 24,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewIconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewIcon: {
    fontSize: 24,
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  reviewSkillName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
  recommendCard: {
    backgroundColor: '#ecf7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
  },
  recommendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 10,
  },
  recommendItem: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 6,
  },
});
