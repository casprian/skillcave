import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Submission {
  id: string;
  title: string;
  topic: string;
  description: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  student_id: string;
  tutor_feedback: string | null;
  submission_type: 'open' | 'specific';
  submitted_to_tutor: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export default function TutorSubmissionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    const loadUserAndSubmissions = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          fetchSubmissions(authUser.id);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };

    loadUserAndSubmissions();
  }, []);

  const fetchSubmissions = async (tutorId: string) => {
    try {
      console.log('🔍 TUTOR: Fetching submissions for tutor:', tutorId);
      
      // Query needs to match the RLS policy:
      // Tutors can see:
      // 1. Submissions assigned to them (submitted_to_tutor = tutorId)
      // 2. Pending open submissions NOT assigned to anyone (submission_type='open' AND status='pending' AND submitted_to_tutor IS NULL)
      
      let query = supabase
        .from('learning_submissions')
        .select(`
          id,
          title,
          topic,
          description,
          submitted_at,
          status,
          tutor_feedback,
          submission_type,
          student_id,
          submitted_to_tutor,
          reviewed_at,
          reviewed_by
        `)
        // Filter: (submitted_to_tutor = tutorId) OR (open pending submissions with no tutor assigned)
        .or(`submitted_to_tutor.eq.${tutorId},and(submission_type.eq.open,status.eq.pending,submitted_to_tutor.is.null)`);

      const { data, error } = await query.order('submitted_at', { ascending: false });

      console.log('📋 Tutor submissions query result:', {
        error: error ? { code: error.code, message: error.message } : null,
        dataLength: data?.length || 0,
        sampleData: data?.[0] ? { id: data[0].id, title: data[0].title, status: data[0].status, submission_type: data[0].submission_type, submitted_to_tutor: data[0].submitted_to_tutor } : null
      });

      if (error) {
        console.error('❌ Error fetching submissions:', error);
        setSubmissions([]);
      } else {
        console.log('✅ SUCCESS - Found', data?.length || 0, 'submissions for tutor');
        setSubmissions(data || []);
      }
    } catch (err) {
      console.error('💥 Exception fetching submissions:', err);
      setSubmissions([]);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('learning_submissions')
        .update({
          status: 'approved',
          tutor_feedback: feedback,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Update local state immediately
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, status: 'approved', tutor_feedback: feedback, reviewed_at: new Date().toISOString(), reviewed_by: user?.id }
          : sub
      ));

      alert('Submission approved!');
      setFeedbackModalVisible(false);
      setFeedback('');
      setSelectedSubmission(null);

      // Refresh from server to ensure consistency
      if (user?.id) {
        setTimeout(() => fetchSubmissions(user.id), 500);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error approving submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('learning_submissions')
        .update({
          status: 'rejected',
          tutor_feedback: feedback,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Update local state immediately
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, status: 'rejected', tutor_feedback: feedback, reviewed_at: new Date().toISOString(), reviewed_by: user?.id }
          : sub
      ));

      alert('Submission rejected');
      setFeedbackModalVisible(false);
      setFeedback('');
      setSelectedSubmission(null);

      // Refresh from server to ensure consistency
      if (user?.id) {
        setTimeout(() => fetchSubmissions(user.id), 500);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error rejecting submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredSubmissions = () => {
    if (filterStatus === 'all') {
      return submissions;
    }
    return submissions.filter((sub) => sub.status === filterStatus);
  };

  const filteredSubmissions = getFilteredSubmissions();

  const statusStats = {
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    total: submissions.length,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Submissions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{statusStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {statusStats.approved}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              {statusStats.rejected}
            </Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#0284c7' }]}>
              {statusStats.total}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                filterStatus === status && styles.filterTabActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === status && styles.filterTabTextActive
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submissions List */}
        <View style={styles.submissionsSection}>
          {filteredSubmissions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>No submissions</Text>
              <Text style={styles.emptyStateSubtext}>
                {filterStatus === 'all'
                  ? 'No student submissions yet'
                  : `No ${filterStatus} submissions`}
              </Text>
            </View>
          ) : (
            filteredSubmissions.map((submission) => (
              <View key={submission.id} style={styles.submissionCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>Student Submission</Text>
                    <Text style={styles.studentEmail}>ID: {submission.student_id?.substring(0, 8)}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          submission.status === 'approved'
                            ? '#d1fae5'
                            : submission.status === 'rejected'
                            ? '#fee2e2'
                            : '#fef3c7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            submission.status === 'approved'
                              ? '#10b981'
                              : submission.status === 'rejected'
                              ? '#ef4444'
                              : '#f59e0b',
                        },
                      ]}
                    >
                      {submission.status === 'approved'
                        ? '✓ Approved'
                        : submission.status === 'rejected'
                        ? '✗ Rejected'
                        : '⏳ Pending'}
                    </Text>
                  </View>
                </View>

                {/* Submission Details */}
                <View style={styles.submissionContent}>
                  <Text style={styles.submissionTitle}>{submission.title}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Topic:</Text>
                    <Text style={styles.metaValue}>{submission.topic}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Type:</Text>
                    <Text style={styles.metaValue}>
                      {submission.submission_type === 'open' ? '🌐 Open' : '👤 Private'}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Date:</Text>
                    <Text style={styles.metaValue}>
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Description Preview */}
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionLabel}>Submission:</Text>
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {submission.description}
                  </Text>
                </View>

                {/* Existing Feedback */}
                {submission.tutor_feedback && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>💬 Your Feedback:</Text>
                    <Text style={styles.feedbackText}>{submission.tutor_feedback}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                {submission.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => {
                        setSelectedSubmission(submission);
                        setActionType('approve');
                        setFeedbackModalVisible(true);
                        setFeedback('');
                      }}
                    >
                      <Text style={styles.actionButtonText}>✓ Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => {
                        setSelectedSubmission(submission);
                        setActionType('reject');
                        setFeedbackModalVisible(true);
                        setFeedback('');
                      }}
                    >
                      <Text style={styles.actionButtonText}>✗ Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? '✓ Approve Submission' : '✗ Reject Submission'}
            </Text>
            <Text style={styles.modalSubtitle}>Provide feedback for the student</Text>

            <TextInput
              style={styles.feedbackInput}
              placeholder="Write your feedback, suggestions, or reason for rejection..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setFeedbackModalVisible(false);
                  setSelectedSubmission(null);
                  setFeedback('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitFeedbackButton,
                  actionType === 'reject' && styles.submitFeedbackButtonReject
                ]}
                onPress={actionType === 'approve' ? handleApprove : handleReject}
                disabled={isSubmitting}
              >
                <Text style={styles.submitFeedbackButtonText}>
                  {isSubmitting
                    ? 'Processing...'
                    : actionType === 'approve'
                    ? 'Approve'
                    : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  filterTabActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: 'white',
  },
  submissionsSection: {
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  submissionCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submissionContent: {
    marginBottom: 12,
  },
  submissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
    width: 60,
  },
  metaValue: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  descriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
  feedbackBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 6,
  },
  feedbackText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '500',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#d1fae5',
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c4a6e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c4a6e',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0c2d4c',
    fontWeight: '500',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
  },
  submitFeedbackButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  submitFeedbackButtonReject: {
    backgroundColor: '#ef4444',
  },
  submitFeedbackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
});
