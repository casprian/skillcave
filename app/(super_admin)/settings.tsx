import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    pointsPerAttendance: 10,
    pointsPerSkill: 50,
    attendanceRequired: 80,
    enableNotifications: true,
    enableLeaderboard: true,
    enableBadges: true,
    streakMultiplier: 1.5,
  });

  const [changed, setChanged] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setChanged(true);
  };

  const handleNumberChange = (key: keyof typeof settings, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({
      ...prev,
      [key]: numValue
    }));
    setChanged(true);
  };

  const handleSave = () => {
    Alert.alert('Success', 'Settings saved successfully!');
    setChanged(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Points Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Points Configuration</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>Points Per Attendance</Text>
                <TextInput
                  style={styles.numberInput}
                  value={settings.pointsPerAttendance.toString()}
                  onChangeText={(val) => handleNumberChange('pointsPerAttendance', val)}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={styles.settingDesc}>Points awarded for marking attendance</Text>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>Points Per Skill</Text>
                <TextInput
                  style={styles.numberInput}
                  value={settings.pointsPerSkill.toString()}
                  onChangeText={(val) => handleNumberChange('pointsPerSkill', val)}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={styles.settingDesc}>Points awarded for skill completion</Text>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>Streak Multiplier</Text>
                <TextInput
                  style={styles.numberInput}
                  value={settings.streakMultiplier.toString()}
                  onChangeText={(val) => handleNumberChange('streakMultiplier', val)}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.settingDesc}>Multiplier for consecutive days</Text>
            </View>
          </View>

          {/* Attendance Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Attendance Rules</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>Required Attendance %</Text>
                <TextInput
                  style={styles.numberInput}
                  value={settings.attendanceRequired.toString()}
                  onChangeText={(val) => handleNumberChange('attendanceRequired', val)}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={styles.settingDesc}>Minimum attendance percentage required</Text>
            </View>
          </View>

          {/* Feature Toggles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Feature Toggles</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Enable Leaderboard</Text>
                  <Text style={styles.settingDesc}>Display student rankings</Text>
                </View>
                <Switch
                  value={settings.enableLeaderboard}
                  onValueChange={() => handleToggle('enableLeaderboard')}
                  trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                  thumbColor={settings.enableLeaderboard ? '#10b981' : '#94a3b8'}
                />
              </View>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Enable Badges</Text>
                  <Text style={styles.settingDesc}>Award achievement badges</Text>
                </View>
                <Switch
                  value={settings.enableBadges}
                  onValueChange={() => handleToggle('enableBadges')}
                  trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                  thumbColor={settings.enableBadges ? '#10b981' : '#94a3b8'}
                />
              </View>
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Enable Notifications</Text>
                  <Text style={styles.settingDesc}>Send user notifications</Text>
                </View>
                <Switch
                  value={settings.enableNotifications}
                  onValueChange={() => handleToggle('enableNotifications')}
                  trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                  thumbColor={settings.enableNotifications ? '#10b981' : '#94a3b8'}
                />
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoBanner}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>These settings apply globally across all organizations. Changes take effect immediately.</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Save Button */}
      {changed && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.discardBtn}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.discardBtnText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveBtn}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingVertical: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  numberInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
    minWidth: 70,
    textAlign: 'right',
  },
  settingDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '400',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSection: {
    marginTop: 20,
  },
  infoBanner: {
    backgroundColor: '#e0f2fe',
    borderLeftWidth: 4,
    borderLeftColor: '#0369a1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  discardBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
});
