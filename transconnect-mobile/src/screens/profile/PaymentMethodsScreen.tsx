import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface PaymentMethod {
  id: string;
  type: 'mobile-money' | 'card' | 'cash';
  provider: string;
  lastDigits: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen({ navigation }: any) {
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'cash',
      provider: 'Cash / Over the Counter',
      lastDigits: '',
      isDefault: true,
    },
    {
      id: '2',
      type: 'mobile-money',
      provider: 'MTN Mobile Money',
      lastDigits: '7890',
      isDefault: false,
    },
    {
      id: '3',
      type: 'mobile-money',
      provider: 'Airtel Money',
      lastDigits: '4567',
      isDefault: false,
    },
  ]);

  const handleSetDefault = (id: string) => {
    Alert.alert(
      'Set Default',
      'This feature will be available in the next update.',
      [{ text: 'OK' }]
    );
  };

  const handleRemove = (id: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'Payment method removed (Demo)');
        }},
      ]
    );
  };

  const handleAddNew = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose a payment method to add:',
      [
        { text: 'MTN Mobile Money', onPress: () => Alert.alert('Coming Soon', 'MTN Mobile Money integration coming soon!') },
        { text: 'Airtel Money', onPress: () => Alert.alert('Coming Soon', 'Airtel Money integration coming soon!') },
        { text: 'Credit/Debit Card', onPress: () => Alert.alert('Coming Soon', 'Card payment integration coming soon!') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getPaymentIcon = (type: string, provider: string) => {
    if (provider.includes('Cash')) return 'cash-outline';
    if (provider.includes('MTN')) return 'phone-portrait-outline';
    if (provider.includes('Airtel')) return 'phone-portrait-outline';
    return 'card-outline';
  };

  const getPaymentColor = (provider: string) => {
    if (provider.includes('Cash')) return '#10B981';
    if (provider.includes('MTN')) return '#FFCB05';
    if (provider.includes('Airtel')) return '#ED1C24';
    return '#3B82F6';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure & Encrypted</Text>
            <Text style={styles.infoText}>
              All payment information is encrypted and securely stored
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Saved Payment Methods</Text>

        {paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentCard}>
            <View style={styles.paymentInfo}>
              <View 
                style={[
                  styles.iconContainer,
                  { backgroundColor: getPaymentColor(method.provider) + '20' }
                ]}
              >
                <Ionicons 
                  name={getPaymentIcon(method.type, method.provider)} 
                  size={24} 
                  color={getPaymentColor(method.provider)} 
                />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.providerName}>{method.provider}</Text>
                <Text style={styles.accountNumber}>
                  •••• {method.lastDigits}
                </Text>
              </View>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              {!method.isDefault && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#3B82F6" />
                  <Text style={styles.actionButtonText}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleRemove(method.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
          <Text style={styles.addButtonText}>Add New Payment Method</Text>
        </TouchableOpacity>

        <View style={styles.supportedMethods}>
          <Text style={styles.supportedTitle}>Supported Payment Methods</Text>
          <View style={styles.methodsList}>
            <View style={styles.methodItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.methodText}>Cash / Over the Counter</Text>
            </View>
            <View style={styles.methodItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.methodText}>MTN Mobile Money</Text>
            </View>
            <View style={styles.methodItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.methodText}>Airtel Money</Text>
            </View>
            <View style={styles.methodItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.methodText}>Visa & Mastercard</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  defaultBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  supportedMethods: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  supportedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  methodsList: {
    gap: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
});
