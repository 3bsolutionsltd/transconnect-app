import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function EmailVerificationScreen({ route, navigation }: any) {
  const { setAuthSession } = useAuth();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email = useMemo(() => {
    const rawEmail = route?.params?.email || '';
    return String(rawEmail).trim().toLowerCase();
  }, [route?.params?.email]);

  const maskedEmail = useMemo(() => {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0] || ''}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }, [email]);

  const handleVerify = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'No email found for verification. Please register again.');
      navigation.navigate('Register');
      return;
    }

    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsVerifying(true);
      const response = await authApi.verifyEmailOtp({ email, otp: code });
      const { user, token, expiresAt } = response.data || {};

      if (user && token) {
        await setAuthSession({ user, token, expiresAt });
      }

      Alert.alert('Success', 'Email verified successfully. You are now logged in.');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to verify code. Please try again.';
      Alert.alert('Verification Failed', message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'No email found for verification. Please register again.');
      return;
    }

    try {
      setIsResending(true);
      const response = await authApi.resendEmailVerification(email);
      const message = response?.data?.message || 'Verification code sent.';
      Alert.alert('Verification Sent', message);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to resend verification code.';
      Alert.alert('Resend Failed', message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Ionicons name="mail-open-outline" size={42} color="#2563EB" />
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {maskedEmail || email}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isVerifying && styles.disabledButton]}
              onPress={handleVerify}
              disabled={isVerifying}
            >
              <Text style={styles.primaryButtonText}>
                {isVerifying ? 'Verifying...' : 'Verify Email'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, isResending && styles.disabledSecondaryButton]}
              onPress={handleResend}
              disabled={isResending}
            >
              <Text style={styles.secondaryButtonText}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    letterSpacing: 2,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  disabledSecondaryButton: {
    borderColor: '#9CA3AF',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 4,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
