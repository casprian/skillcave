import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, FlatList, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  description?: string;
  admin_email?: string; // Fetched from auth.users, not stored in DB
  organization_code?: string;
  created_at: string;
  is_active: boolean;
}

export default function OrganizationsScreen() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich organizations with admin email from auth.users
      const { data: usersData } = await supabase.auth.admin.listUsers();
      
      const userMap = (usersData || []).reduce((acc: any, user: any) => {
        acc[user.id] = user.email;
        return acc;
      }, {});

      const enrichedOrgs = (data || []).map((org: any) => ({
        ...org,
        admin_email: userMap[org.created_by] || 'Unknown',
      }));

      setOrganizations(enrichedOrgs);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      Alert.alert('Error', 'Organization name is required');
      return;
    }
    if (!adminEmail.trim()) {
      Alert.alert('Error', 'Admin email is required');
      return;
    }
    if (!adminName.trim()) {
      Alert.alert('Error', 'Admin name is required');
      return;
    }
    if (!adminPhone.trim()) {
      Alert.alert('Error', 'Admin phone is required');
      return;
    }
    if (!adminPassword.trim() || adminPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setCreating(true);

      // Generate organization code: first 3 chars of name + 3 random digits
      const orgCodePrefix = orgName.substring(0, 3).toUpperCase();
      const randomSuffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const organizationCode = `${orgCodePrefix}${randomSuffix}`;

      // 1. Create admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {name: adminName.trim(), phone: adminPhone.trim(), role: "admin"}
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create organization with code (don't store admin_email - get from auth.users via created_by)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          description: orgDescription,
          created_by: authData.user.id,
          is_active: true,
          organization_code: organizationCode,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Update auth user metadata with name and phone
      const { error: updateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
        user_metadata: { 
          name: adminName.trim(),
          phone: adminPhone.trim(),
        }
      });

      if (updateError) throw updateError;

      // 4. Create or update admin profile (don't store email/name - they're in auth.users)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authData.user.id,
            role: 'admin',
            organization_id: orgData.id,
          },
          { onConflict: 'id' }
        );

      if (profileError) throw profileError;

      // 5. Create organization_admin record
      const { error: adminError } = await supabase
        .from('organization_admins')
        .insert({
          organization_id: orgData.id,
          user_id: authData.user.id,
          created_at: new Date().toISOString(),
        });

      if (adminError) throw adminError;

      Alert.alert(
        'Success', 
        `Organization "${orgName}" created successfully!\n\n📋 Organization Code: ${organizationCode}\n\n✅ Admin profile created for ${adminEmail}\nThis account can now login as organization admin.`
      );
      
      // Reset form and reload
      setOrgName('');
      setOrgDescription('');
      setAdminEmail('');
      setAdminName('');
      setAdminPhone('');
      setAdminPassword('');
      setShowCreateModal(false);
      loadOrganizations();

    } catch (error: any) {
      console.error('Error creating organization:', error);
      Alert.alert('Error', error.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrganization = (org: Organization) => {
    Alert.alert(
      'Delete Organization',
      `Are you sure you want to delete "${org.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('organizations')
                .delete()
                .eq('id', org.id);

              if (error) throw error;
              
              Alert.alert('Success', 'Organization deleted');
              loadOrganizations();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete organization');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.admin_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organizations</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search organizations..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Create Button */}
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createBtnIcon}>+</Text>
            <Text style={styles.createBtnText}>Create Organization</Text>
          </TouchableOpacity>

          {/* Organizations List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0369a1" />
            </View>
          ) : filteredOrgs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyTitle}>No Organizations</Text>
              <Text style={styles.emptyDesc}>Create your first organization to get started</Text>
            </View>
          ) : (
            <View>
              {filteredOrgs.map((org) => (
                <View key={org.id} style={styles.orgCard}>
                  <View style={styles.orgCardContent}>
                    <View style={styles.orgInitial}>
                      <Text style={styles.orgInitialText}>
                        {org.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>{org.name}</Text>
                      <Text style={styles.orgAdmin}>{org.admin_email}</Text>
                      {(org as any).organization_code && (
                        <View style={styles.orgCodeBadge}>
                          <Text style={styles.orgCode}>📋 Code: {(org as any).organization_code}</Text>
                        </View>
                      )}
                      {org.description && (
                        <Text style={styles.orgDesc} numberOfLines={1}>{org.description}</Text>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.orgActions}>
                    <TouchableOpacity
                      style={styles.actionBtn_view}
                      onPress={() => router.navigate({
                        pathname: '/(super_admin)/organization-detail' as any,
                        params: { id: org.id }
                      } as any)}
                    >
                      <Text style={styles.actionBtnText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn_delete}
                      onPress={() => handleDeleteOrganization(org)}
                    >
                      <Text style={styles.actionBtnText_delete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Create Organization Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Organization</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Organization Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Organization Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter organization name"
                  placeholderTextColor="#cbd5e1"
                  value={orgName}
                  onChangeText={setOrgName}
                  editable={!creating}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 80 }]}
                  placeholder="Enter organization description"
                  placeholderTextColor="#cbd5e1"
                  value={orgDescription}
                  onChangeText={setOrgDescription}
                  multiline
                  editable={!creating}
                />
              </View>

              {/* Admin Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Admin Email *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="admin@example.com"
                  placeholderTextColor="#cbd5e1"
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!creating}
                />
              </View>

              {/* Admin Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Admin Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter admin's full name"
                  placeholderTextColor="#cbd5e1"
                  value={adminName}
                  onChangeText={setAdminName}
                  editable={!creating}
                />
              </View>

              {/* Admin Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Admin Phone *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter admin's phone number"
                  placeholderTextColor="#cbd5e1"
                  value={adminPhone}
                  onChangeText={setAdminPhone}
                  keyboardType="phone-pad"
                  editable={!creating}
                />
              </View>

              {/* Admin Password */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Admin Password *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#cbd5e1"
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  secureTextEntry
                  editable={!creating}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}
                disabled={creating}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, creating && styles.submitBtnDisabled]}
                onPress={handleCreateOrganization}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Create</Text>
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
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#0c2d4c',
    fontSize: 14,
  },
  createBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    elevation: 2,
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  createBtnIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  orgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  orgCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orgInitial: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgInitialText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  orgAdmin: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  orgDesc: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '400',
  },
  orgActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn_view: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn_delete: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  actionBtnText_delete: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
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
  orgCodeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  orgCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
  },
});
