import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function LearningLogPage() {
  const router = useRouter();
  const [logTitle, setLogTitle] = useState('');
  const [logContent, setLogContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submittedLogs = [
    {
      id: 1,
      title: 'Learned React Hooks',
      date: 'Mar 7, 2026',
      time: '2:30 PM',
      status: 'approved',
      feedback: 'Great understanding! Well explained.'
    },
    {
      id: 2,
      title: 'TypeScript Basics',
      date: 'Mar 5, 2026',
      time: '3:15 PM',
      status: 'approved',
      feedback: 'Excellent work!'
    },
    {
      id: 3,
      title: 'State Management Practice',
      date: 'Mar 3, 2026',
      time: '1:45 PM',
      status: 'pending',
      feedback: 'Awaiting mentor review...'
    },
  ];

  const handleSubmit = async () => {
    if (!logTitle || !logContent) {
      alert('Please fill all fields');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      alert('Learning log submitted successfully!');
      setLogTitle('');
      setLogContent('');
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Log</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Submit Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>📝 Submit Today's Log</Text>
          
          <TextInput
            placeholder="What did you learn today?"
            value={logTitle}
            onChangeText={setLogTitle}
            style={styles.titleInput}
            placeholderTextColor="#999"
          />
          
          <TextInput
            placeholder="Write your learning notes, challenges faced, and key takeaways..."
            value={logContent}
            onChangeText={setLogContent}
            style={styles.contentInput}
            multiline
            numberOfLines={6}
            placeholderTextColor="#999"
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Log'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>📋 What to Include</Text>
          <Text style={styles.guidelineText}>• Topics covered today</Text>
          <Text style={styles.guidelineText}>• Key concepts learned</Text>
          <Text style={styles.guidelineText}>• Challenges encountered</Text>
          <Text style={styles.guidelineText}>• Resources used</Text>
          <Text style={styles.guidelineText}>• Questions for mentor</Text>
        </View>

        {/* Submitted Logs */}
        <View style={styles.logsSection}>
          <Text style={styles.logsTitle}>📚 Recent Submissions</Text>
          
          {submittedLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logInfo}>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={styles.logDate}>{log.date} at {log.time}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: log.status === 'approved' ? '#d1fae5' : '#fef3c7' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: log.status === 'approved' ? '#10b981' : '#f59e0b' }
                  ]}>
                    {log.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                  </Text>
                </View>
              </View>
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackLabel}>Mentor Feedback:</Text>
                <Text style={styles.feedbackText}>{log.feedback}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Logs Submitted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>10</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Pending</Text>
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
  formCard: {
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
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 14,
  },
  titleInput: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#0c2d4c',
    fontWeight: '500',
  },
  contentInput: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#0c2d4c',
    fontWeight: '500',
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#0369a1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  guidelinesCard: {
    backgroundColor: '#ecf7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 10,
  },
  guidelineText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 6,
  },
  logsSection: {
    marginBottom: 24,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 14,
  },
  logCard: {
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
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
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e7ff',
  },
});
