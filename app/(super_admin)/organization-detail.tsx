import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  admin_email?: string; // Fetched from auth.users, not stored in DB
}

interface Admin {
  id: string;
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

export default function OrganizationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadOrganizationDetail();
  }, [id]);

  const loadOrganizationDetail = async () => {
    try {
      setLoading(true);
      
      if (!id) {
        Alert.alert('Error', 'Organization ID not found');
        router.back();
        return;
      }

      // Load organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (orgError) throw orgError;

      // Load organization admins and auth users in parallel
      const [adminsRes, usersRes] = await Promise.all([
        supabase
          .from('organization_admins')
          .select('*')
          .eq('organization_id', id),
        supabase.auth.admin.listUsers(),
      ]);

      const { data: adminsData, error: adminsError } = adminsRes;
      const { data: usersData } = usersRes;

      if (adminsError) throw adminsError;

      // Build user map for emails and names
      const userMap = (usersData || []).reduce((acc: any, user: any) => {
        acc[user.id] = {
          email: user.email || 'Unknown',
          name: user.user_metadata?.name || 'Unknown',
        };
        return acc;
      }, {});

      // Enrich organization with creator email
      const enrichedOrg = {
        ...orgData,
        admin_email: userMap[orgData.created_by]?.email || 'Unknown',
      };
      setOrganization(enrichedOrg);

      const formattedAdmins = (adminsData || []).map((admin: any) => ({
        id: admin.id,
        user_id: admin.user_id,
        email: userMap[admin.user_id]?.email || 'Unknown',
        name: userMap[admin.user_id]?.name || 'Unknown',
        created_at: admin.created_at,
      }));

      setAdmins(formattedAdmins);
    } catch (error: any) {
      console.error('Error loading organization detail:', error);
      Alert.alert('Error', error.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (!adminName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!adminPassword.trim() || adminPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setAdding(true);

      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: adminEmail,
          name: adminName,
          role: 'organization_admin',
          organization_id: organization?.id,
        });

      if (profileError) throw profileError;

      // 3. Add to organization_admins
      const { error: adminError } = await supabase
        .from('organization_admins')
        .insert({
          organization_id: organization?.id,
          user_id: authData.user.id,
          created_at: new Date().toISOString(),
        });

      if (adminError) throw adminError;

      Alert.alert('Success', `Admin ${adminName} added successfully!`);
      
      // Reset form and reload
      setAdminEmail('');
      setAdminPassword('');
      setAdminName('');
      setShowAddAdminModal(false);
      loadOrganizationDetail();

    } catch (error: any) {
      console.error('Error adding admin:', error);
      Alert.alert('Error', error.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = (admin: Admin) => {
    Alert.alert(
      'Remove Admin',
      `Are you sure you want to remove ${admin.name} as admin?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('organization_admins')
                .delete()
                .eq('id', admin.id);

              if (error) throw error;
              
              Alert.alert('Success', 'Admin removed');
              loadOrganizationDetail();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove admin');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleToggleOrganization = () => {
    const action = organization?.is_active ? 'disable' : 'enable';
    const message = organization?.is_active 
      ? `Are you sure you want to disable ${organization?.name}? Members will no longer have access.`
      : `Are you sure you want to enable ${organization?.name}? Members will regain access.`;

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Organization`,
      message,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('organizations')
                .update({ is_active: !organization?.is_active })
                .eq('id', organization?.id);

              if (error) throw error;
              
              Alert.alert('Success', `Organization ${action}d successfully`);
              loadOrganizationDetail();
            } catch (error: any) {
              Alert.alert('Error', error.message || `Failed to ${action} organization`);
            }
          },
          style: action === 'disable' ? 'destructive' : 'default',
        },
      ]
    );
  };

  const handleDeleteOrganization = () => {
    Alert.alert(
      'Delete Organization',
      `⚠️ This action is irreversible. All data associated with "${organization?.name}" will be permanently deleted. Are you absolutely sure?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setLoading(true);
              console.log(`[DELETE ORG] Starting deletion of organization: ${organization?.id}`);

              // Use the RPC function for server-side deletion
              const { data, error } = await supabase.rpc('delete_organization', {
                org_id: organization?.id,
              });

              if (error) {
                console.error('[DELETE ORG] RPC error:', error);
                throw error;
              }

              if (!data?.success) {
                throw new Error(data?.message || 'Failed to delete organization');
              }

              console.log('[DELETE ORG] Organization deleted successfully via RPC');
              Alert.alert('Success', 'Organization deleted successfully');
              router.navigate('/(super_admin)' as any);
            } catch (error: any) {
              console.error('[DELETE ORG] Fatal error:', error);
              Alert.alert('Error', error.message || 'Failed to delete organization');
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organization Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0369a1" />
        </View>
      </View>
    );
  }

  if (!organization) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Organization Details</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Organization not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organization</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Organization Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.orgInitial}>
              <Text style={styles.orgInitialText}>
                {organization.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.orgInfoContent}>
              <Text style={styles.orgName}>{organization.name}</Text>
              <Text style={styles.orgEmail}>{organization.admin_email}</Text>
              {organization.description && (
                <Text style={styles.orgDescription}>{organization.description}</Text>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>

          {/* Admins Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Organization Admins</Text>
              <TouchableOpacity
                style={styles.addAdminBtn}
                onPress={() => setShowAddAdminModal(true)}
              >
                <Text style={styles.addAdminBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {admins.length === 0 ? (
              <View style={styles.emptyAdmins}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={styles.emptyTitle}>No Admins</Text>
                <Text style={styles.emptyDesc}>Add an admin to manage this organization</Text>
              </View>
            ) : (
              <View>
                {admins.map((admin) => (
                  <View key={admin.id} style={styles.adminCard}>
                    <View style={styles.adminCardContent}>
                      <View style={styles.adminAvatar}>
                        <Text style={styles.adminInitial}>
                          {admin.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.adminInfo}>
                        <Text style={styles.adminName}>{admin.name}</Text>
                        <Text style={styles.adminEmail}>{admin.email}</Text>
                        <Text style={styles.adminRole}>Organization Admin</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeAdminBtn}
                      onPress={() => handleRemoveAdmin(admin)}
                    >
                      <Text style={styles.removeAdminBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Settings Preview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity 
              style={styles.settingsCard}
              onPress={() => router.navigate('/(super_admin)/settings' as any)}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Configure Application Settings</Text>
                <Text style={styles.settingsDesc}>Manage global app configuration</Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone Section */}
          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>⚠️ Organization Management</Text>
            
            {/* Disable/Enable Organization */}
            <TouchableOpacity
              style={[styles.actionBtn, organization.is_active ? styles.disableBtn : styles.enableBtn]}
              onPress={() => handleToggleOrganization()}
            >
              <Text style={styles.actionBtnIcon}>{organization.is_active ? '🔒' : '🔓'}</Text>
              <View style={styles.actionBtnContent}>
                <Text style={styles.actionBtnTitle}>
                  {organization.is_active ? 'Disable Organization' : 'Enable Organization'}
                </Text>
                <Text style={styles.actionBtnDesc}>
                  {organization.is_active 
                    ? 'Members cannot access this organization' 
                    : 'Members can access this organization'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Delete Organization */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteOrganization()}
            >
              <Text style={styles.deleteBtnIcon}>🗑️</Text>
              <View style={styles.actionBtnContent}>
                <Text style={styles.deleteBtnTitle}>Delete Organization</Text>
                <Text style={styles.deleteBtnDesc}>Permanently delete this organization</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Add Admin Modal */}
      <Modal
        visible={showAddAdminModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Organization Admin</Text>
              <TouchableOpacity onPress={() => setShowAddAdminModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter admin name"
                  placeholderTextColor="#cbd5e1"
                  value={adminName}
                  onChangeText={setAdminName}
                  editable={!adding}
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="admin@example.com"
                  placeholderTextColor="#cbd5e1"
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!adding}
                />
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Password *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#cbd5e1"
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  secureTextEntry
                  editable={!adding}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddAdminModal(false)}
                disabled={adding}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, adding && styles.submitBtnDisabled]}
                onPress={handleAddAdmin}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Add Admin</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backBtn: {
    fontSize: 28,
    color: 'white',
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orgInitial: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  orgInitialText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  orgInfoContent: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  orgEmail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  orgDescription: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  addAdminBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addAdminBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  emptyAdmins: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  adminCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adminCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369a1',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  adminRole: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: '600',
  },
  removeAdminBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAdminBtnText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  settingsDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  settingsChevron: {
    fontSize: 20,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c2d4c',
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: '400',
    color: '#94a3b8',
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0c2d4c',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  dangerSection: {
    marginBottom: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  disableBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  enableBtn: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  actionBtnIcon: {
    fontSize: 20,
    marginRight: 10,
    width: 24,
  },
  actionBtnContent: {
    flex: 1,
  },
  actionBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  actionBtnDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteBtnIcon: {
    fontSize: 20,
    marginRight: 10,
    width: 24,
  },
  deleteBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  deleteBtnDesc: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: '500',
    marginTop: 2,
  },
});
