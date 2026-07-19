import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { transfersApi } from '../../services/api';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PENDING:  { color: '#F59E0B', label: 'Pending Review', icon: 'time-outline' },
  APPROVED: { color: '#10B981', label: 'Approved', icon: 'checkmark-circle-outline' },
  REJECTED: { color: '#EF4444', label: 'Rejected', icon: 'close-circle-outline' },
  CANCELLED:{ color: '#6B7280', label: 'Cancelled', icon: 'ban-outline' },
  COMPLETED:{ color: '#3B82F6', label: 'Completed', icon: 'checkmark-done-outline' },
};

const REASON_LABELS: Record<string, string> = {
  SCHEDULE_CONFLICT: 'Schedule Conflict',
  EMERGENCY: 'Emergency',
  PERSONAL_PREFERENCE: 'Personal Preference',
  PRICE_DIFFERENCE: 'Price Difference',
  OTHER: 'Other',
};

export default function MyTransfersScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: transfers, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['my-transfers'],
    queryFn: async () => {
      const response = await transfersApi.getMyTransfers();
      return response.data?.transfers || response.data || [];
    },
    staleTime: 30000,
  });

  const cancelMutation = useMutation({
    mutationFn: (transferId: string) => transfersApi.cancelTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-transfers'] });
      Alert.alert('Cancelled', 'Your transfer request has been cancelled.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Failed to cancel. Please try again.';
      Alert.alert('Error', msg);
    },
  });

  const handleCancel = (transfer: any) => {
    Alert.alert(
      'Cancel Transfer',
      'Are you sure you want to cancel this transfer request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(transfer.id),
        },
      ],
    );
  };

  const renderTransfer = ({ item: transfer }: { item: any }) => {
    const status = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.PENDING;
    const isExpanded = expandedId === transfer.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedId(isExpanded ? null : transfer.id)}
        activeOpacity={0.85}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.transferId}>#{transfer.id.slice(0, 8)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Ionicons name={status.icon} size={13} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#9CA3AF"
          />
        </View>

        {/* Route */}
        <View style={styles.routeRow}>
          <Ionicons name="bus-outline" size={16} color="#6B7280" />
          <Text style={styles.routeText}>
            {transfer.booking?.route?.origin || '—'} → {transfer.booking?.route?.destination || '—'}
          </Text>
        </View>

        {/* Dates row */}
        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Original Date</Text>
            <Text style={styles.dateValue}>
              {transfer.booking?.travelDate
                ? format(new Date(transfer.booking.travelDate), 'MMM dd, yyyy')
                : '—'}
            </Text>
          </View>
          {transfer.targetTravelDate && (
            <>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Requested Date</Text>
                <Text style={[styles.dateValue, { color: '#3B82F6' }]}>
                  {format(new Date(transfer.targetTravelDate), 'MMM dd, yyyy')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Expanded details */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason</Text>
              <Text style={styles.detailValue}>
                {REASON_LABELS[transfer.reason] || transfer.reason}
              </Text>
            </View>

            {transfer.reasonDetails ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Details</Text>
                <Text style={styles.detailValue}>{transfer.reasonDetails}</Text>
              </View>
            ) : null}

            {transfer.reviewNote ? (
              <View style={styles.reviewNoteBanner}>
                <Ionicons name="chatbubble-outline" size={15} color="#1D4ED8" />
                <Text style={styles.reviewNoteText}>{transfer.reviewNote}</Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted</Text>
              <Text style={styles.detailValue}>
                {format(new Date(transfer.createdAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>

            {transfer.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(transfer)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.cancelBtnText}>Cancel Request</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Transfer Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading transfers...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Couldn't load transfers</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transfers}
          keyExtractor={(item) => item.id}
          renderItem={renderTransfer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="swap-horizontal-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Transfer Requests</Text>
              <Text style={styles.emptySubtitle}>
                You haven't requested any booking transfers yet.
              </Text>
            </View>
          }
        />
      )}
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
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  transferId: { fontSize: 14, fontWeight: '600', color: '#374151' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  routeText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateBlock: { flex: 1 },
  dateLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  dateValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  expandedSection: { marginTop: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 13, color: '#9CA3AF' },
  detailValue: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1, textAlign: 'right' },
  reviewNoteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  reviewNoteText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 18 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
  },
  cancelBtnText: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  loadingText: { marginTop: 12, color: '#6B7280' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  retryText: { color: '#3B82F6', fontWeight: '600' },
});
