import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { transfersApi } from '../../services/api';

type TransferReason =
  | 'SCHEDULE_CONFLICT'
  | 'EMERGENCY'
  | 'PERSONAL_PREFERENCE'
  | 'PRICE_DIFFERENCE'
  | 'OTHER';

const REASON_LABELS: Record<TransferReason, string> = {
  SCHEDULE_CONFLICT: 'Schedule Conflict',
  EMERGENCY: 'Emergency',
  PERSONAL_PREFERENCE: 'Personal Preference',
  PRICE_DIFFERENCE: 'Price Difference',
  OTHER: 'Other',
};

export default function TransferRequestScreen({ route, navigation }: any) {
  const { booking } = route.params as { booking: any };
  const queryClient = useQueryClient();

  const [targetDate, setTargetDate] = useState('');
  const [reason, setReason] = useState<TransferReason>('SCHEDULE_CONFLICT');
  const [reasonDetails, setReasonDetails] = useState('');
  const [dateError, setDateError] = useState('');

  const transferMutation = useMutation({
    mutationFn: () =>
      transfersApi.requestTransfer(booking.id, {
        targetTravelDate: targetDate || undefined,
        reason,
        reasonDetails: reasonDetails.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-transfers'] });
      Alert.alert(
        'Transfer Requested',
        'Your transfer request has been submitted. You will be notified once it is reviewed.',
        [{ text: 'OK', onPress: () => navigation.navigate('MyTransfers') }],
      );
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to submit transfer request. Please try again.';
      Alert.alert('Error', message);
    },
  });

  const validateDate = (value: string) => {
    setTargetDate(value);
    if (!value) {
      setDateError('');
      return;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      setDateError('Enter a valid date (YYYY-MM-DD)');
    } else if (parsed < new Date()) {
      setDateError('Date must be in the future');
    } else {
      setDateError('');
    }
  };

  const handleSubmit = () => {
    if (dateError) return;
    Alert.alert(
      'Confirm Transfer Request',
      `Submit a transfer request for booking #${booking.id.slice(0, 8)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => transferMutation.mutate() },
      ],
    );
  };

  const canSubmit = !transferMutation.isPending && !dateError;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Transfer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Booking</Text>
          <View style={styles.bookingRow}>
            <Ionicons name="bus-outline" size={18} color="#6B7280" />
            <Text style={styles.bookingText}>
              {booking.route?.origin || booking.boardingStop} →{' '}
              {booking.route?.destination || booking.alightingStop}
            </Text>
          </View>
          <View style={styles.bookingRow}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.bookingText}>
              {format(new Date(booking.travelDate), 'EEE, MMM dd yyyy')}
            </Text>
          </View>
          <View style={styles.bookingRow}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.bookingText}>
              {booking.route?.departureTime || 'TBA'}
            </Text>
          </View>
        </View>

        {/* New Travel Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Preferred New Date (optional)</Text>
          <TextInput
            style={[styles.input, dateError ? styles.inputError : null]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={targetDate}
            onChangeText={validateDate}
            keyboardType="default"
          />
          {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
          <Text style={styles.hint}>
            Leave blank if you want the operator to suggest an alternative.
          </Text>
        </View>

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.label}>Reason for Transfer</Text>
          {(Object.keys(REASON_LABELS) as TransferReason[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.reasonOption, reason === key && styles.reasonSelected]}
              onPress={() => setReason(key)}
            >
              <View style={[styles.radio, reason === key && styles.radioSelected]} />
              <Text style={[styles.reasonText, reason === key && styles.reasonTextSelected]}>
                {REASON_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.label}>Additional Details (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide any extra information to help process your request..."
            placeholderTextColor="#9CA3AF"
            value={reasonDetails}
            onChangeText={setReasonDetails}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
          <Text style={styles.infoText}>
            Transfer requests are reviewed by our team. You'll receive a notification once approved or rejected.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {transferMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="swap-horizontal-outline" size={20} color="#FFF" />
              <Text style={styles.submitText}>Submit Transfer Request</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bookingText: { fontSize: 15, color: '#1F2937' },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  inputError: { borderColor: '#EF4444' },
  textArea: { height: 100, paddingTop: 12 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  reasonSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioSelected: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' },
  reasonText: { fontSize: 15, color: '#374151' },
  reasonTextSelected: { color: '#1D4ED8', fontWeight: '500' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 20 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
