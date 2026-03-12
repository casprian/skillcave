import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Tutor {
  id: string;
  name: string;
  email: string;
  auth_id?: string | null;
}

// Helper function to get tutor's auth UUID from tutor ID
// Since profiles no longer has email, we now use the ID directly
// auth_id should be populated when tutors are fetched
async function getTutorAuthId(tutorId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('auth_id')
      .eq('id', tutorId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching tutor auth_id:', error);
      return null;
    }
    
    return data?.auth_id || null;
  } catch (err) {
    console.error('Exception fetching tutor auth_id:', err);
    return null;
  }
}

export default function LearningLogPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Form states
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [description, setDescription] = useState('');
  const [submitType, setSubmitType] = useState<'open' | 'specific'>('open');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutorModalVisible, setTutorModalVisible] = useState(false);
  const [submittedLogs, setSubmittedLogs] = useState<any[]>([]);

  const topics = [
    'React Native',
    'TypeScript',
    'State Management',
    'UI/UX Design',
    'Backend API',
    'Database Design',
    'Testing',
    'Performance Optimization',
    'Security',
    'Other'
  ];

  useEffect(() => {
    const loadUserAndTutors = async () => {
      try {
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profileData) {
            setProfile(profileData);
          }

          // Fetch all tutors
          console.log('Attempting to fetch tutors...');
          const { data: tutorsData, error: tutorsError } = await supabase
            .from('profiles')
            .select('id, auth_id')
            .eq('role', 'tutor');

          console.log('Tutors query result:', { tutorsData, tutorsError, length: tutorsData?.length });

          if (tutorsError) {
            console.error('Error fetching tutors:', tutorsError);
            setTutors([]);
          } else if (tutorsData && tutorsData.length > 0) {
            // Fetch auth user data for names
            const tutorIds = tutorsData.map((t: any) => t.id);
            const { data: usersData } = await supabase.auth.admin.listUsers();
            
            const userMap = (usersData || []).reduce((acc: any, user: any) => {
              acc[user.id] = {
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Tutor',
                email: user.email || 'Unknown',
              };
              return acc;
            }, {});

            const enrichedTutors = tutorsData.map((tutor: any) => ({
              ...tutor,
              name: userMap[tutor.id]?.name || 'Tutor',
              email: userMap[tutor.id]?.email || 'Unknown',
            }));

            console.log('Setting tutors:', enrichedTutors);
            setTutors(enrichedTutors);
          } else {
            console.log('No tutors found in database');
            setTutors([]);
          }

          // Fetch submitted logs
          fetchSubmittedLogs(authUser.id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadUserAndTutors();
  }, []);

  const fetchSubmittedLogs = async (studentId: string) => {
    try {
      console.log('🔍 FETCH SUBMITTED LOGS - Student ID:', studentId, 'Type:', typeof studentId);
      
      // Log the current authenticated session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Current session user ID:', session?.user?.id);
      console.log('📋 Session user email:', session?.user?.email);
      console.log('🔗 Comparing: student_id (', studentId, ') === session.user.id (', session?.user?.id, ')?', studentId === session?.user?.id);
      
      const { data, error } = await supabase
        .from('learning_submissions')
        .select(`
          id,
          title,
          topic,
          description,
          submitted_at,
          status,
          tutor_feedback,
          submitted_to_tutor
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ ERROR fetching logs:', {
          code: error.code,
          message: error.message,
          details: error.details,
          statusCode: error.status,
          fullError: error
        });
        console.error('⚠️  This usually means RLS policy is blocking access');
        console.error('    - Check if student_id matches auth.uid()');
        console.error('    - Check if RLS policies are enabled');
        setSubmittedLogs([]);
      } else {
        console.log('✅ SUCCESS - Found', data?.length || 0, 'submissions');
        if (data && data.length > 0) {
          console.log('📝 Sample submission:', data[0]);
        }
        setSubmittedLogs(data || []);
      }
    } catch (err) {
      console.error('💥 EXCEPTION:', err);
      setSubmittedLogs([]);
    }
  };

  const handleSubmit = async () => {
    if (!submissionTitle || !selectedTopic || !description) {
      alert('Please fill all required fields');
      return;
    }

    if (submitType === 'specific' && !selectedTutor) {
      alert('Please select a tutor');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate user is authenticated
      if (!user?.id) {
        alert('User not authenticated. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      // For submitted_to_tutor, use auth_id (UUID) if available, otherwise fetch it
      let tutorUUID: string | null = null;
      if (submitType === 'specific' && selectedTutor) {
        tutorUUID = selectedTutor.auth_id || await getTutorAuthId(selectedTutor.id);
      }
      
      const submissionData = {
        student_id: user.id, // Use user.id directly (it's already a UUID)
        title: submissionTitle,
        topic: selectedTopic,
        description: description,
        submitted_at: new Date().toISOString(),
        status: 'pending',
        submission_type: submitType,
        submitted_to_tutor: tutorUUID,
        tutor_feedback: null,
      };

      const { error } = await supabase
        .from('learning_submissions')
        .insert([submissionData]);

      if (error) {
        console.error('Error submitting:', error);
        alert('Error submitting learning log');
      } else {
        alert('Learning submission sent successfully!');
        setSubmissionTitle('');
        setSelectedTopic('');
        setDescription('');
        setSelectedTutor(null);
        setSubmitType('open');
        
        // Refresh logs
        if (user?.id) {
          fetchSubmittedLogs(user.id);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Submission</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Submission Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>📚 Submit Your Learning</Text>
          <Text style={styles.formSubtitle}>Share what you&apos;ve learned with your mentor</Text>

          {/* Submission Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Submission Title *</Text>
            <TextInput
              placeholder="e.g., 'React Hooks Implementation Challenge'"
              value={submissionTitle}
              onChangeText={setSubmissionTitle}
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Topic Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Topic *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.topicScroll}
            >
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic}
                  style={[
                    styles.topicButton,
                    selectedTopic === topic && styles.topicButtonActive
                  ]}
                  onPress={() => setSelectedTopic(topic)}
                >
                  <Text
                    style={[
                      styles.topicButtonText,
                      selectedTopic === topic && styles.topicButtonTextActive
                    ]}
                  >
                    {topic}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              placeholder="Describe your learning, challenges faced, key concepts, and resources used..."
              value={description}
              onChangeText={setDescription}
              style={styles.textArea}
              multiline
              numberOfLines={6}
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/1000</Text>
          </View>

          {/* Submission Type Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Submit To *</Text>
            <View style={styles.submissionTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  submitType === 'open' && styles.typeButtonActive
                ]}
                onPress={() => setSubmitType('open')}
              >
                <Text style={[
                  styles.typeButtonText,
                  submitType === 'open' && styles.typeButtonTextActive
                ]}>
                  🌐 Open Submission
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  submitType === 'specific' && styles.typeButtonActive
                ]}
                onPress={() => setSubmitType('specific')}
              >
                <Text style={[
                  styles.typeButtonText,
                  submitType === 'specific' && styles.typeButtonTextActive
                ]}>
                  👤 Select Tutor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tutor Selection (if specific) */}
          {submitType === 'specific' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Choose Tutor *</Text>
              <TouchableOpacity
                style={styles.tutorSelectButton}
                onPress={() => setTutorModalVisible(true)}
              >
                <Text style={styles.tutorSelectText}>
                  {selectedTutor ? selectedTutor.name : 'Select a tutor...'}
                </Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {submitType === 'open' 
                ? '📢 Open submissions are visible to all tutors in your learning community.'
                : '🔒 Your submission will be sent directly to the selected tutor.'}
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Learning'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submitted Logs Section */}
        <View style={styles.logsSection}>
          <Text style={styles.sectionTitle}>📝 Your Submissions</Text>
          
          {submittedLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📚</Text>
              <Text style={styles.emptyStateText}>No submissions yet</Text>
              <Text style={styles.emptyStateSubtext}>Submit your first learning to get started!</Text>
            </View>
          ) : (
            submittedLogs.map((log) => (
              <View key={log.id} style={styles.submissionCard}>
                {/* Header */}
                <View style={styles.submissionHeader}>
                  <View style={styles.submissionInfo}>
                    <Text style={styles.submissionTitle}>{log.title}</Text>
                    <Text style={styles.submissionTopic}>📌 {log.topic}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          log.status === 'approved'
                            ? '#d1fae5'
                            : log.status === 'rejected'
                            ? '#fee2e2'
                            : '#fef3c7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            log.status === 'approved'
                              ? '#10b981'
                              : log.status === 'rejected'
                              ? '#ef4444'
                              : '#f59e0b',
                        },
                      ]}
                    >
                      {log.status === 'approved'
                        ? '✓ Approved'
                        : log.status === 'rejected'
                        ? '✗ Rejected'
                        : '⏳ Pending'}
                    </Text>
                  </View>
                </View>

                {/* Meta Info */}
                <View style={styles.metaInfo}>
                  <Text style={styles.metaText}>
                    📅 {new Date(log.submitted_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.metaText}>
                    🎯 {log.submission_type === 'open' ? 'Open Submission' : `Submitted to ${log.tutor?.full_name || 'Unknown'}`}
                  </Text>
                </View>

                {/* Description Preview */}
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionLabel}>Your Submission:</Text>
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {log.description}
                  </Text>
                </View>

                {/* Feedback */}
                {log.tutor_feedback && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>💬 Tutor Feedback:</Text>
                    <Text style={styles.feedbackText}>{log.tutor_feedback}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Tutor Selection Modal */}
      <Modal
        visible={tutorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTutorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Tutor</Text>
              <TouchableOpacity onPress={() => setTutorModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={tutors}
              keyExtractor={(item) => item.id}
              renderItem={({ item: tutor }) => (
                <TouchableOpacity
                  style={[
                    styles.tutorItem,
                    selectedTutor?.id === tutor.id && styles.tutorItemActive
                  ]}
                  onPress={() => {
                    setSelectedTutor(tutor);
                    setTutorModalVisible(false);
                  }}
                >
                  <View style={styles.tutorItemContent}>
                    <Text style={styles.tutorName}>{tutor.name}</Text>
                    <Text style={styles.tutorEmail}>{tutor.email}</Text>
                  </View>
                  {selectedTutor?.id === tutor.id && (
                    <Text style={styles.selectedCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              scrollEnabled
              style={{ maxHeight: 400 }}
            />
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
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0c2d4c',
    fontWeight: '500',
  },
  topicScroll: {
    marginBottom: 8,
  },
  topicButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  topicButtonActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  topicButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0c4a6e',
  },
  topicButtonTextActive: {
    color: 'white',
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0c2d4c',
    fontWeight: '500',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'right',
  },
  submissionTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0c4a6e',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  tutorSelectButton: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  tutorSelectText: {
    fontSize: 14,
    color: '#0c4a6e',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    color: '#0369a1',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#ecf7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#0c4a6e',
    fontWeight: '500',
    lineHeight: 18,
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
  logsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2d4c',
    marginBottom: 14,
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
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  submissionTopic: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c4a6e',
  },
  closeButton: {
    fontSize: 20,
    color: '#0369a1',
    fontWeight: '700',
  },
  tutorItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tutorItemActive: {
    backgroundColor: '#ecf7ff',
  },
  tutorItemContent: {
    flex: 1,
  },
  tutorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  tutorEmail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedCheckmark: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '700',
  },
});
