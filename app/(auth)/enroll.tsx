import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, Picker } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function EnrollScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const roles = ['student', 'tutor', 'management', 'admin'];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEnroll = async () => {
    console.log('🔴 handleEnroll called - Button pressed!');
    console.log('Form data:', { name, email, phone, password: password ? '***' : '', confirmPassword: confirmPassword ? '***' : '' });

    // Validation checks
    if (!name.trim()) {
      console.log('❌ Name is empty');
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!email.trim()) {
      console.log('❌ Email is empty');
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!phone.trim()) {
      console.log('❌ Phone is empty');
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!password) {
      console.log('❌ Password is empty');
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (!confirmPassword) {
      console.log('❌ Confirm password is empty');
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    if (!validateEmail(email)) {
      console.log('❌ Email validation failed');
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.error('❌ Supabase client is null');
      Alert.alert('Error', 'Supabase is not configured. Please check your environment variables.');
      return;
    }

    console.log('✅ All validations passed, starting signup...');
    setLoading(true);
    
    try {
      console.log('📝 Attempting to sign up with email:', email.toLowerCase());
      console.log('Selected role:', role);
      
      // Create auth user ONLY - don't insert profile yet
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim(),
            role: role,
          }
        }
      });

      console.log('📬 SignUp response received');
      console.log('authData:', authData);
      console.log('authError:', authError);

      if (authError) {
        console.error('❌ Auth error:', authError.message);
        Alert.alert('Error', authError.message || 'Failed to create account');
        return;
      }

      if (authData.user) {
        console.log('✅ User created successfully:', authData.user.id);
        console.log('User email:', authData.user.email);
        
        // Create profile in database
        try {
          console.log('📝 Creating profile for user...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                email: email.toLowerCase(),
                name: name.trim(),
                phone: phone.trim(),
                role: role,
              }
            ])
            .select();

          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            // Don't fail signup if profile creation fails - still show success
          } else {
            console.log('✅ Profile created successfully:', profileData);
          }
        } catch (profileErr) {
          console.error('❌ Profile creation exception:', profileErr);
          // Continue anyway
        }
        
        // Show success message
        Alert.alert('Success', 'Account created! Please login to continue.', [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setEmail('');
              setPhone('');
              setPassword('');
              setConfirmPassword('');
              console.log('🔄 Navigating to login...');
              router.replace('/(auth)/login');
            }
          }
        ]);
      } else {
        console.log('⚠️ No user returned from signup');
        Alert.alert('Error', 'No user data returned from server');
      }
    } catch (error: any) {
      console.error('❌ Enrollment error:', error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      Alert.alert('Error', error?.message || 'Failed to enroll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>🏫</Text>
        </View>
      </View>

      <Text style={styles.title}>SkillCave</Text>
      <Text style={styles.subtitle}>Join our learning community</Text>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Create Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#999"
        />

        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Select Your Role</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={styles.picker}
              enabled={!loading}
            >
              <Picker.Item label="Student" value="student" />
              <Picker.Item label="Tutor" value="tutor" />
              <Picker.Item label="Management" value="management" />
              <Picker.Item label="Admin" value="admin" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={() => {
            console.log('🔵 Button onPress fired!');
            handleEnroll();
          }}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerText}>By continuing, you agree to our Terms of Service</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  contentContainer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 50,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '400',
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 32,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    padding: 16,
    marginBottom: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#0c2d4c',
    backgroundColor: '#fff',
    fontFamily: 'System',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0369a1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    elevation: 4,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '700',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
  roleContainer: {
    marginBottom: 14,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#0c2d4c',
  },
});