import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Modal, TextInput, FlatList } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function TutorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

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
          }
          
          if (profileData) {
            setProfile(profileData);
          }

          // Fetch assignments
          fetchAssignments();
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assignments:', error);
      } else {
        setAssignments(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedAssignment) return;
    
    try {
      setReviewingId(selectedAssignment.id);
      const { error } = await supabase
        .from('assignments')
        .update({
          status: 'approved',
          tutor_comments: comments,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', selectedAssignment.id);

      if (error) throw error;
      
      console.log('✅ Assignment approved');
      setModalVisible(false);
      setComments('');
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err) {
      console.error('Error approving:', err);
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAssignment) return;

    try {
      setReviewingId(selectedAssignment.id);
      const { error } = await supabase
        .from('assignments')
        .update({
          status: 'rejected',
          tutor_comments: comments,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', selectedAssignment.id);

      if (error) throw error;
      
      console.log('✅ Assignment rejected');
      setModalVisible(false);
      setComments('');
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err) {
      console.error('Error rejecting:', err);
    } finally {
      setReviewingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const openReviewModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setComments('');
    setModalVisible(true);
  };

  const renderAssignmentCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.assignmentCard}
      onPress={() => openReviewModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.assignmentHeader}>
        <Text style={styles.studentName}>{item.student_name || 'Student'}</Text>
        <Text style={styles.assignmentTitle}>{item.title || 'Assignment'}</Text>
      </View>
      
      <View style={styles.assignmentBody}>
        <Text style={styles.assignmentDescription}>{item.description || 'No description'}</Text>
      </View>

      <View style={styles.assignmentFooter}>
        <Text style={styles.submittedDate}>
          Submitted: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
        </Text>
      </View>

      <View style={styles.reviewButtonsContainer}>
        <TouchableOpacity
          style={[styles.reviewButton, styles.approveButton]}
          onPress={() => openReviewModal(item)}
        >
          <Text style={styles.reviewButtonText}>Review</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
        {/* Welcome Section with Role */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
          <Text style={styles.userEmail}>{user?.email || 'Tutor'}</Text>
          {profile?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Assignments Title */}
        <Text style={styles.sectionTitle}>📋 Pending Assignments for Review</Text>

        {/* Assignments Grid */}
        {assignments.length > 0 ? (
          <FlatList
            data={assignments}
            renderItem={renderAssignmentCard}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.assignmentsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Pending Assignments</Text>
            <Text style={styles.emptyStateText}>All assignments have been reviewed!</Text>
          </View>
        )}
      </View>

      {/* Review Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Assignment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAssignment && (
              <>
                <ScrollView style={styles.modalBody}>
                  <View style={styles.assignmentDetails}>
                    <Text style={styles.detailLabel}>Student Name:</Text>
                    <Text style={styles.detailValue}>{selectedAssignment.student_name}</Text>

                    <Text style={styles.detailLabel}>Assignment:</Text>
                    <Text style={styles.detailValue}>{selectedAssignment.title}</Text>

                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedAssignment.description}</Text>

                    <Text style={styles.detailLabel}>Submitted:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedAssignment.submitted_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsLabel}>Your Comments:</Text>
                    <TextInput
                      style={styles.commentsInput}
                      placeholder="Add comments or feedback..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={5}
                      value={comments}
                      onChangeText={setComments}
                      editable={reviewingId === null}
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectBtn]}
                    onPress={handleReject}
                    disabled={reviewingId !== null}
                  >
                    <Text style={[styles.actionButtonText, styles.rejectBtnText]}>
                      {reviewingId === selectedAssignment.id ? 'Processing...' : '❌ Reject'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveBtn]}
                    onPress={handleApprove}
                    disabled={reviewingId !== null}
                  >
                    <Text style={[styles.actionButtonText, styles.approveBtnText]}>
                      {reviewingId === selectedAssignment.id ? 'Processing...' : '✅ Approve'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 16,
    marginTop: 8,
  },
  assignmentsList: {
    paddingBottom: 20,
  },
  assignmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignmentHeader: {
    padding: 14,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  studentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    marginBottom: 4,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
  },
  assignmentBody: {
    padding: 14,
  },
  assignmentDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  assignmentFooter: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  submittedDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  reviewButtonsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    gap: 8,
  },
  reviewButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#0369a1',
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  assignmentDetails: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#0c4a6e',
    marginBottom: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  commentsInput: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0c2d4c',
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
    fontFamily: 'System',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
  },
  approveBtn: {
    backgroundColor: '#0369a1',
  },
  actionButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtnText: {
    color: '#dc2626',
  },
  approveBtnText: {
    color: 'white',
  },
});