import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    console.log('🔴 Login attempt started');
    
    if (!email.trim()) {
      console.log('❌ Email is empty');
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!password) {
      console.log('❌ Password is empty');
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Attempting login with email:', email.toLowerCase());
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      console.log('📬 Login response received');
      console.log('data:', data);
      console.log('error:', error);

      if (error) {
        console.error('❌ Login error:', error.message);
        Alert.alert('Error', error.message || 'Login failed');
        return;
      }

      if (data.user) {
        console.log('✅ Login successful for:', data.user.email);
        console.log('User ID:', data.user.id);
        console.log('📦 Session data:', {
          sessionToken: data.session ? '✅ Present' : '❌ Missing',
          sessionExpires: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'N/A',
          accessToken: data.session?.access_token ? '✅ Present' : '❌ Missing',
        });
        
        // Fetch user role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('email', data.user.email)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }
        
        console.log('User role:', profileData?.role || 'student');
        
        // Verify session was saved
        const { data: { session: savedSession }, error: sessionError } = await supabase.auth.getSession();
        console.log('📝 [Login] Verifying session save:');
        if (sessionError) {
          console.error('   ❌ Error retrieving session:', sessionError.message);
        } else if (savedSession?.user?.email === data.user.email) {
          console.log('   ✅ Session saved for:', savedSession.user.email);
        } else {
          console.warn('   ⚠️ Session not found after login');
        }
        
        // Wait a moment for session to be established
        setTimeout(() => {
          const route = profileData?.role === 'tutor' ? '/(tutor)' : '/(student)';
          console.log('🔄 Navigating to dashboard:', route);
          router.replace(route);
        }, 500);
      } else {
        console.log('⚠️ No user data returned');
        Alert.alert('Error', 'Login failed - no user data returned');
      }
    } catch (error: any) {
      console.error('❌ Login exception:', error);
      console.error('Error message:', error?.message);
      Alert.alert('Error', error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    Alert.alert('Info', 'Password reset link would be sent to ' + email);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>🏫</Text>
        </View>
      </View>

      <Text style={styles.title}>SkillCave</Text>
      <Text style={styles.subtitle}>Welcome back!</Text>

      <View style={styles.formContainer}>
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
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          editable={!loading}
          placeholderTextColor="#999"
        />

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/enroll')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerText}>Secure login with Supabase Authentication</Text>
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
  forgotPasswordText: {
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'right',
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  signupLink: {
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
});
