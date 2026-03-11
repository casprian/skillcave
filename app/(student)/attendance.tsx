import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AttendancePage() {
  const router = useRouter();
  const [logMode, setLogMode] = useState<'quick' | 'advanced'>('quick');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Quick logging
  const [isLogging, setIsLogging] = useState(false);
  
  // Advanced logging
  const [loginTime, setLoginTime] = useState('09:00');
  const [logoutTime, setLogoutTime] = useState('17:00');
  const [breakDuration, setBreakDuration] = useState('60');
  const [taskSummary, setTaskSummary] = useState('');
  const [location, setLocation] = useState('Office');
  const [notes, setNotes] = useState('');
  const [projectName, setProjectName] = useState('');
  const [productivityLevel, setProductivityLevel] = useState<'high' | 'medium' | 'low'>('high');
  
  // UI state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0, rate: 0 });

  // Initialize user session and load attendance
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUserId(authUser.id);
          // Fetch attendance records for this user
          const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', authUser.id)
            .order('attendance_date', { ascending: false })
            .limit(30);

          if (!error && data) {
            setAttendanceRecords(data);
            calculateStats(data);
          }
        } else {
          alert('Not authenticated. Please login first.');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        alert('Error loading user session');
      }
    };
    initUser();
  }, []);

  // Fetch attendance records from database
  const fetchAttendanceRecords = async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .order('attendance_date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching attendance:', error);
        return;
      }

      if (data) {
        setAttendanceRecords(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error in fetchAttendanceRecords:', error);
    }
  };

  // Calculate stats from attendance records
  const calculateStats = (records: any[]) => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    setStats({ present, absent, late, total, rate });
  };

  // Calculate working hours from login/logout times
  const calculateWorkingHours = () => {
    const [loginH, loginM] = loginTime.split(':').map(Number);
    const [logoutH, logoutM] = logoutTime.split(':').map(Number);
    
    const loginTotalMinutes = loginH * 60 + loginM;
    const logoutTotalMinutes = logoutH * 60 + logoutM;
    
    let duration = logoutTotalMinutes - loginTotalMinutes;
    const breakMins = parseInt(breakDuration) || 0;
    duration -= breakMins;
    
    const hours = Math.round((duration / 60) * 10) / 10;
    return Math.max(0, hours);
  };

  // Quick logging - same day attendance
  const handleQuickLog = async () => {
    if (!userId) {
      alert('User not logged in');
      return;
    }

    setIsLogging(true);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const workingHours = calculateWorkingHours();

      const { error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: userId,
            attendance_date: dateStr,
            hours: workingHours,
            attendance_type: 'logged',
            status: 'present',
            login_time: loginTime,
            logout_time: logoutTime,
            break_duration: parseInt(breakDuration),
            notes: taskSummary,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Error saving attendance:', error);
        alert('Error saving attendance. Please try again.');
        setIsLogging(false);
        return;
      }

      setSuccessMessage(`✓ Logged successfully!\n${workingHours}h work logged\n${formatDateFull(dateStr)}`);
      setShowSuccessModal(true);

      resetQuickForm();
      await fetchAttendanceRecords();

      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Error logging attendance:', error);
      alert('Error logging attendance. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  // Advanced logging - detailed information
  const handleAdvancedLog = async () => {
    if (!userId) {
      alert('User not logged in');
      return;
    }

    if (!taskSummary.trim()) {
      alert('Please enter a task summary');
      return;
    }

    setIsLogging(true);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const workingHours = calculateWorkingHours();

      const { error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: userId,
            attendance_date: dateStr,
            hours: workingHours,
            attendance_type: 'detailed',
            status: 'present',
            login_time: loginTime,
            logout_time: logoutTime,
            break_duration: parseInt(breakDuration),
            project_name: projectName,
            location: location,
            task_summary: taskSummary,
            productivity_level: productivityLevel,
            notes: notes,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Error saving detailed attendance:', error);
        alert('Error saving attendance. Please try again.');
        setIsLogging(false);
        return;
      }

      setSuccessMessage(`✓ Detailed log saved!\n${workingHours}h on ${projectName}\n${formatDateFull(dateStr)}`);
      setShowSuccessModal(true);

      resetAdvancedForm();
      await fetchAttendanceRecords();

      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Error logging detailed attendance:', error);
      alert('Error logging attendance. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const resetQuickForm = () => {
    const now = new Date();
    setLoginTime('09:00');
    setLogoutTime('17:00');
    setBreakDuration('60');
    setTaskSummary('');
    setSelectedDate(new Date());
  };

  const resetAdvancedForm = () => {
    const now = new Date();
    setLoginTime('09:00');
    setLogoutTime('17:00');
    setBreakDuration('60');
    setTaskSummary('');
    setProjectName('');
    setLocation('Office');
    setNotes('');
    setProductivityLevel('high');
    setSelectedDate(new Date());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('en-US', options);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
            isToday && styles.calendarDayToday
          ]}
          onPress={() => {
            setSelectedDate(date);
            setShowCalendar(false);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            isToday && styles.calendarDayTextToday
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance Log</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
              <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
              <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.late}</Text>
              <Text style={styles.statLabel}>Late</Text>
              <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#0369a1' }]}>{stats.rate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
              <View style={[styles.statDot, { backgroundColor: '#0369a1' }]} />
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <Text style={styles.dateLabel}>Logging for:</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
              <Text style={styles.dateButtonIcon}>📅</Text>
              <Text style={styles.dateButtonText}>{formatDate(selectedDate.toISOString().split('T')[0])}</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Modal */}
          <Modal
            transparent={true}
            animationType="fade"
            visible={showCalendar}
            onRequestClose={() => setShowCalendar(false)}
          >
            <View style={styles.calendarOverlay}>
              <View style={styles.calendarModal}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}>
                    <Text style={styles.calendarNav}>‹ Prev</Text>
                  </TouchableOpacity>
                  <Text style={styles.calendarMonth}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}>
                    <Text style={styles.calendarNav}>Next ›</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekdays}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Text key={day} style={styles.weekdayText}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {renderCalendar()}
                </View>

                <TouchableOpacity style={styles.calendarClose} onPress={() => setShowCalendar(false)}>
                  <Text style={styles.calendarCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, logMode === 'quick' && styles.modeButtonActive]}
              onPress={() => setLogMode('quick')}
            >
              <Text style={[styles.modeIcon, logMode === 'quick' && { color: 'white' }]}>⚡</Text>
              <Text style={[styles.modeText, logMode === 'quick' && styles.modeTextActive]}>
                Quick Log
              </Text>
              <Text style={[styles.modeDesc, logMode === 'quick' && styles.modeDescActive]}>
                Fast entry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, logMode === 'advanced' && styles.modeButtonActive]}
              onPress={() => setLogMode('advanced')}
            >
              <Text style={[styles.modeIcon, logMode === 'advanced' && { color: 'white' }]}>🎯</Text>
              <Text style={[styles.modeText, logMode === 'advanced' && styles.modeTextActive]}>
                Detailed Log
              </Text>
              <Text style={[styles.modeDesc, logMode === 'advanced' && styles.modeDescActive]}>
                Full details
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Logging Form */}
          {logMode === 'quick' && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>⚡ Quick Time Log</Text>
              <Text style={styles.formSubtitle}>Log your work hours in seconds</Text>

              {/* Time Inputs */}
              <View style={styles.timeGrid}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Login Time</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={loginTime}
                    onChangeText={setLoginTime}
                    placeholder="09:00"
                    placeholderTextColor="#ccc"
                  />
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Logout Time</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={logoutTime}
                    onChangeText={setLogoutTime}
                    placeholder="17:00"
                    placeholderTextColor="#ccc"
                  />
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Break (min)</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={breakDuration}
                    onChangeText={setBreakDuration}
                    placeholder="60"
                    placeholderTextColor="#ccc"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Quick Summary */}
              <View style={styles.quickInfo}>
                <Text style={styles.quickInfoLabel}>Working Hours:</Text>
                <Text style={styles.quickInfoValue}>{calculateWorkingHours()} hrs</Text>
              </View>

              <TextInput
                style={styles.taskInput}
                value={taskSummary}
                onChangeText={setTaskSummary}
                placeholder="Brief summary of work done (optional)"
                placeholderTextColor="#ccc"
                multiline={true}
                numberOfLines={2}
              />

              <TouchableOpacity
                style={[styles.logButton, isLogging && styles.logButtonDisabled]}
                onPress={handleQuickLog}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.logButtonIcon}>✓</Text>
                    <Text style={styles.logButtonText}>Log Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Advanced Logging Form */}
          {logMode === 'advanced' && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>🎯 Detailed Work Log</Text>
              <Text style={styles.formSubtitle}>Log comprehensive work details</Text>

              {/* Time Inputs */}
              <View style={styles.timeGrid}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Login</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={loginTime}
                    onChangeText={setLoginTime}
                    placeholder="09:00"
                  />
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Logout</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={logoutTime}
                    onChangeText={setLogoutTime}
                    placeholder="17:00"
                  />
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Break</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={breakDuration}
                    onChangeText={setBreakDuration}
                    placeholder="60"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Project & Location */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailsInput}>
                  <Text style={styles.inputLabel}>Project Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={projectName}
                    onChangeText={setProjectName}
                    placeholder="e.g., Mobile App, Website"
                    placeholderTextColor="#ccc"
                  />
                </View>

                <View style={styles.detailsInput}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.textInput}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Office / Remote / Hybrid"
                    placeholderTextColor="#ccc"
                  />
                </View>
              </View>

              {/* Task Summary */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Tasks Completed *</Text>
                <TextInput
                  style={[styles.textInput, { height: 80 }]}
                  value={taskSummary}
                  onChangeText={setTaskSummary}
                  placeholder="List main tasks you completed..."
                  placeholderTextColor="#ccc"
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              {/* Productivity Level */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Productivity Level</Text>
                <View style={styles.productivityGrid}>
                  {['high', 'medium', 'low'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.productivityButton,
                        productivityLevel === level && styles.productivityButtonActive
                      ]}
                      onPress={() => setProductivityLevel(level as 'high' | 'medium' | 'low')}
                    >
                      <Text style={[
                        styles.productivityText,
                        productivityLevel === level && styles.productivityTextActive
                      ]}>
                        {level === 'high' ? '🔥 High' : level === 'medium' ? '⚡ Medium' : '📌 Low'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Additional Notes */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Additional Notes</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any blockers, achievements, or notes..."
                  placeholderTextColor="#ccc"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              {/* Working Hours Info */}
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>📊 Work Summary</Text>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Total Hours:</Text>
                  <Text style={styles.infoValue}>{calculateWorkingHours()}h</Text>
                </View>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Project:</Text>
                  <Text style={styles.infoValue}>{projectName || '(Not set)'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.logButton, isLogging && styles.logButtonDisabled]}
                onPress={handleAdvancedLog}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.logButtonIcon}>✓</Text>
                    <Text style={styles.logButtonText}>Save Log</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Recent Logs */}
          <Text style={styles.recentTitle}>📋 Recent Logs</Text>
          {attendanceRecords.length > 0 ? (
            <View style={styles.logsContainer}>
              {attendanceRecords.slice(0, 10).map((record, idx) => (
                <View key={idx} style={styles.logEntry}>
                  <View style={styles.logEntryLeft}>
                    <Text style={styles.logDate}>{formatDate(record.attendance_date)}</Text>
                    {record.attendance_type === 'detailed' && (
                      <Text style={styles.logProject}>{record.project_name || 'General'}</Text>
                    )}
                    {record.login_time && (
                      <Text style={styles.logTime}>
                        {record.login_time} - {record.logout_time}
                      </Text>
                    )}
                  </View>
                  <View style={styles.logEntryRight}>
                    <View style={styles.logHoursBadge}>
                      <Text style={styles.logHours}>{record.hours}h</Text>
                    </View>
                    <View style={[
                      styles.logTypeBadge,
                      record.attendance_type === 'detailed' ? styles.logTypeDetailed : styles.logTypeQuick
                    ]}>
                      <Text style={styles.logTypeText}>
                        {record.attendance_type === 'detailed' ? '🎯' : '⚡'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No logs yet</Text>
              <Text style={styles.emptySubtext}>Start logging your work to track attendance</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Logged Successfully!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
    </>
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
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dateSelector: {
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
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  dateButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNav: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    color: '#64748b',
    fontSize: 11,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0c2d4c',
  },
  calendarDaySelected: {
    backgroundColor: '#0369a1',
    borderRadius: 8,
  },
  calendarDayTextSelected: {
    color: 'white',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#0369a1',
  },
  calendarDayTextToday: {
    color: '#0369a1',
  },
  calendarClose: {
    backgroundColor: '#0369a1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  calendarCloseText: {
    color: 'white',
    fontWeight: '700',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  modeButtonActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  modeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  modeTextActive: {
    color: 'white',
  },
  modeDesc: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  modeDescActive: {
    color: 'rgba(255, 255, 255, 0.9)',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  timeInput: {
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#0c2d4c',
    textAlign: 'center',
  },
  quickInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0369a1',
  },
  quickInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0369a1',
  },
  taskInput: {
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0c2d4c',
    marginBottom: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailsInput: {
    flex: 1,
  },
  formSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0c2d4c',
    textAlignVertical: 'top',
  },
  productivityGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  productivityButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  productivityButtonActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  productivityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  productivityTextActive: {
    color: 'white',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0369a1',
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 8,
  },
  infoPair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0c2d4c',
  },
  logButton: {
    backgroundColor: '#0369a1',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonIcon: {
    fontSize: 16,
  },
  logButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 12,
  },
  logsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  logEntry: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logEntryLeft: {
    flex: 1,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 2,
  },
  logProject: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  logEntryRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  logHoursBadge: {
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logHours: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  logTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logTypeQuick: {
    backgroundColor: '#fef3c7',
  },
  logTypeDetailed: {
    backgroundColor: '#dcfce7',
  },
  logTypeText: {
    fontSize: 14,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#10b981',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c2d4c',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});
