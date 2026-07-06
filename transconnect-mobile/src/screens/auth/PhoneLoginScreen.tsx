import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const OTP_LENGTH = 6;

export default function PhoneLoginScreen({ navigation }: any) {
  const { login } = useAuth();

  // Step 1: phone entry  |  Step 2: OTP verification
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<TextInput[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Phone formatting ---
  const formatPhone = (raw: string) => {
    // Strip everything except digits and leading +
    return raw.replace(/[^\d+]/g, '');
  };

  // --- Request OTP ---
  const handleRequestOTP = async () => {
    const cleaned = formatPhone(phone);
    if (cleaned.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number (e.g. +256700123456).');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/request-otp', { phoneNumber: cleaned });
      setStep('otp');
      startResendTimer();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Resend countdown ---
  const startResendTimer = () => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- OTP input ---
  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // --- Verify OTP ---
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete', `Please enter all ${OTP_LENGTH} digits.`);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/verify-otp', {
        phoneNumber: formatPhone(phone),
        otp: code,
      });
      
      // Backend returns: { user, token, expiresIn, expiresAt, isNewUser, message }
      const { token, user, expiresAt, expiresIn, isNewUser } = response.data;
      
      // Store token and user data
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      if (expiresAt) {
        await SecureStore.setItemAsync('token_expires_at', expiresAt);
      }
      
      // Navigate using login context or direct navigation
      if (login && typeof login === 'function') {
        // If login function is available from AuthContext, use it
        await login({ email: user.email, password: '' }, token, user);
      }
      
      // Show welcome message for new users
      if (isNewUser) {
        Alert.alert(
          'Welcome to TransConnect!',
          'Your account has been created successfully. You can now book bus tickets and rides.',
          [{ text: 'Get Started', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        navigation.navigate('Home');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Invalid or expired OTP. Please try again.';
      Alert.alert('Verification Failed', msg);
      setOtp(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (step === 'otp') { setStep('phone'); setOtp(Array(OTP_LENGTH).fill('')); }
            else navigation.goBack();
          }}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={36} color="#3B82F6" />
            </View>
            <Text style={styles.title}>
              {step === 'phone' ? 'Phone Login' : 'Enter OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Enter your mobile number to receive a verification code'
                : `We sent a ${OTP_LENGTH}-digit code to\n${phone}`}
            </Text>
          </View>

          {/* Step 1: Phone Number */}
          {step === 'phone' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+256 700 123 456"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={(t) => setPhone(formatPhone(t))}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleRequestOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.switchText}>Use Email & Password instead</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <View style={styles.form}>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { if (ref) otpRefs.current[index] = ref; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, index)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Login</Text>
                )}
              </TouchableOpacity>

              {/* Resend */}
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => { if (resendTimer === 0) handleRequestOTP(); }}
                disabled={resendTimer > 0}
              >
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContainer: { flexGrow: 1, padding: 24 },
  backBtn: { marginBottom: 8, padding: 4, alignSelf: 'flex-start' },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  primaryBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#93C5FD' },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  switchBtn: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: '#6B7280', textDecorationLine: 'underline' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#FFF',
    color: '#1F2937',
  },
  otpBoxFilled: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  resendText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  resendTextDisabled: { color: '#9CA3AF' },
});
