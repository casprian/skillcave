import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function AttendancePage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState('March 2026');
  const [attendanceType, setAttendanceType] = useState('full');
  const [customHours, setCustomHours] = useState('');
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  const attendanceTypes = [
    { id: 'full', label: 'Full Day', hours: '8 hours', icon: '✓' },
    { id: 'half', label: 'Half Day', hours: '4 hours', icon: '◐' },
    { id: 'quarter', label: 'Quarter Day', hours: '2 hours', icon: '◑' },
    { id: 'custom', label: 'Custom Hours', hours: 'Enter hours', icon: '⚙️' },
  ];

  const attendanceData = [
    { date: 'Mar 8', day: 'Fri', status: 'present', hours: 8 },
    { date: 'Mar 7', day: 'Thu', status: 'present', hours: 4 },
    { date: 'Mar 6', day: 'Wed', status: 'absent', hours: 0 },
    { date: 'Mar 5', day: 'Tue', status: 'present', hours: 8 },
    { date: 'Mar 4', day: 'Mon', status: 'present', hours: 8 },
    { date: 'Mar 3', day: 'Sun', status: 'holiday', hours: 0 },
    { date: 'Mar 2', day: 'Sat', status: 'present', hours: 8 },
    { date: 'Mar 1', day: 'Fri', status: 'present', hours: 2 },
  ];

  const stats = [
    { label: 'Present', value: '12', color: '#10b981', bgColor: '#d1fae5' },
    { label: 'Absent', value: '2', color: '#ef4444', bgColor: '#fee2e2' },
    { label: 'Late', value: '1', color: '#f59e0b', bgColor: '#fef3c7' },
    { label: 'Total Days', value: '15', color: '#0369a1', bgColor: '#ecf7ff' },
  ];

  const handleMarkAttendance = async () => {
    if (attendanceType === 'custom' && !customHours) {
      alert('Please enter custom hours');
      return;
    }
    
    setIsMarkingAttendance(true);
    const hours = attendanceType === 'custom' 
      ? customHours 
      : attendanceTypes.find(t => t.id === attendanceType)?.hours || '8 hours';
    
    setTimeout(() => {
      alert(`Attendance marked!\n${attendanceTypes.find(t => t.id === attendanceType)?.label} - ${hours}`);
      setIsMarkingAttendance(false);
      setCustomHours('');
      setAttendanceType('full');
    }, 500);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statBox}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Mark Attendance Card */}
        <View style={styles.markAttendanceCard}>
          <Text style={styles.cardTitle}>📍 Mark Today's Attendance</Text>
          
          <Text style={styles.subtitleText}>Select attendance type:</Text>
          <View style={styles.attendanceTypesGrid}>
            {attendanceTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  attendanceType === type.id && styles.typeButtonActive
                ]}
                onPress={() => setAttendanceType(type.id)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.typeLabel,
                  attendanceType === type.id && styles.typeLabelActive
                ]}>
                  {type.label}
                </Text>
                <Text style={[
                  styles.typeHours,
                  attendanceType === type.id && styles.typeHoursActive
                ]}>
                  {type.hours}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {attendanceType === 'custom' && (
            <TextInput
              placeholder="Enter hours (e.g., 3.5)"
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="decimal-pad"
              style={styles.customHoursInput}
              placeholderTextColor="#999"
            />
          )}

          <TouchableOpacity
            style={[styles.markButton, isMarkingAttendance && styles.markButtonDisabled]}
            onPress={handleMarkAttendance}
            disabled={isMarkingAttendance}
          >
            <Text style={styles.markButtonText}>
              {isMarkingAttendance ? 'Marking...' : 'Mark Attendance'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Rate */}
        <View style={styles.rateCard}>
          <Text style={styles.rateTitle}>Attendance Rate</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '80%' }]} />
          </View>
          <Text style={styles.rateText}>80% • 12 out of 15 days</Text>
        </View>

        {/* Month Header */}
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{selectedMonth}</Text>
          <Text style={styles.monthSubtitle}>Recent attendance</Text>
        </View>

        {/* Attendance List */}
        <View style={styles.attendanceList}>
          {attendanceData.map((item, idx) => (
            <View key={idx} style={styles.attendanceItem}>
              <View style={styles.dateInfo}>
                <Text style={styles.itemDate}>{item.date}</Text>
                <Text style={styles.itemDay}>{item.day}</Text>
              </View>
              <View style={styles.hoursInfo}>
                {item.hours > 0 && (
                  <Text style={styles.hoursText}>{item.hours}h</Text>
                )}
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: item.status === 'present' ? '#d1fae5' : 
                                    item.status === 'absent' ? '#fee2e2' : '#f3f4f6'
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  {
                    color: item.status === 'present' ? '#10b981' : 
                           item.status === 'absent' ? '#ef4444' : '#6b7280'
                  }
                ]}>
                  {item.status === 'present' ? '✓ Present' : 
                   item.status === 'absent' ? '✗ Absent' : 'Holiday'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Attendance Tips</Text>
          <Text style={styles.tipText}>• Maintain 75% attendance for better grades</Text>
          <Text style={styles.tipText}>• Notify your tutor of any absences</Text>
          <Text style={styles.tipText}>• Consistent attendance improves learning</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  markAttendanceCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 14,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  attendanceTypesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  typeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  typeLabelActive: {
    color: 'white',
  },
  typeHours: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  typeHoursActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  customHoursInput: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#0c2d4c',
    fontWeight: '500',
  },
  markButton: {
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
  markButtonDisabled: {
    opacity: 0.6,
  },
  markButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  rateCard: {
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
  rateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  rateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  monthHeader: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  monthSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  attendanceList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  dateInfo: {
    flex: 1,
  },
  itemDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  itemDay: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  hoursInfo: {
    marginRight: 12,
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: '#ecf7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 12,
    padding: 16,
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
