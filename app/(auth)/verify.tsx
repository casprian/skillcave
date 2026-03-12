import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Conditionally import AsyncStorage (React Native only)
let AsyncStorage: any = null;
const isReactNative = typeof navigator === 'undefined' && typeof window === 'undefined' && typeof document === 'undefined';
if (isReactNative) {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    console.warn('AsyncStorage not available');
  }
}



export default function VerifyScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please try enrolling again.');
      return;
    }

    setLoading(true);
    try {
      // Demo: Check against demo OTP (123456)
      if (otp === '123456') {
        console.log('Demo OTP verified:', email);
        
        Alert.alert('Success', 'Email verified! Redirecting to dashboard...');
        setTimeout(() => {
          router.replace('/(student)');
        }, 500);
        return;
      }

      // Real OTP verification (when SMTP is configured)
      // Uncomment this when ready to use real Supabase OTP
      /*
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        router.replace('/(student)');
      }
      */
      
      Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Use 123456 for demo.');
    } catch (error: any) {
      console.log('Verify error:', error);
      Alert.alert('Error', error?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
      <Text style={styles.email}>{email}</Text>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="000000"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          style={[styles.input, styles.otpInput]}
          editable={!loading}
          placeholderTextColor="#bbb"
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton}
          onPress={() => router.back()}
        >
          <Text style={styles.resendText}>Didn't receive code? Go back to enroll</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 36,
    marginTop: 24,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '400',
  },
  email: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369a1',
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    fontSize: 16,
    color: '#0c2d4c',
    backgroundColor: '#fff',
  },
  otpInput: {
    fontSize: 32,
    letterSpacing: 12,
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#0369a1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
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
  resendButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  resendText: {
    color: '#0369a1',
    fontSize: 14,
    fontWeight: '600',
  },
});