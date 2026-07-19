# Week 5: Mobile App Transfer Integration - Implementation Plan

## Executive Summary

**Objective**: Integrate Week 4 booking transfer backend APIs into the existing TransConnect mobile app.

**Current State**:
- ✅ Week 4 backend complete (8 transfer APIs deployed to staging)
- ✅ Mobile app exists: React Native Expo with full booking flow
- ✅ All infrastructure ready (navigation, auth, notifications, React Query)
- ❌ No transfer features in mobile app yet
- ⚠️ Mobile app points to production API, Week 4 features on staging

**Goal**: Add customer-facing transfer request UI to allow passengers to request date/route changes from their mobile devices.

---

## Current Mobile App Architecture

### Tech Stack
- **Framework**: React Native (0.81.5) + Expo (54.0.30)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State**: React Query + Zustand
- **API**: Axios with token refresh logic
- **Notifications**: Expo Notifications (installed but not configured)

### Existing Structure
```
transconnect-mobile/src/
├── screens/
│   ├── auth/                      (Login, Register, ForgotPassword)
│   ├── booking/                   (4 screens: RouteDetails, SeatSelection, Payment, Confirmation)
│   ├── bookings/
│   │   └── BookingsScreen.tsx     ← MAIN FILE TO MODIFY
│   ├── home/
│   ├── profile/
│   ├── search/
│   └── tickets/
│       └── TicketDetailScreen.tsx ← MODIFY to show transfer status
├── services/
│   ├── api.ts                     ← ADD transfer API methods
│   ├── notificationService.ts     ← CONFIGURE for transfer updates
│   ├── offlineStorage.ts
│   └── storage.ts
├── navigation/
│   └── AppNavigator.tsx           ← ADD TransferRequest screen route
└── contexts/
    └── AuthContext.tsx
```

### Current Booking Flow
1. User searches routes → RouteDetailsScreen
2. Selects seats → SeatSelectionScreen
3. Makes payment → PaymentScreen
4. Views confirmation → BookingConfirmationScreen
5. See all bookings → BookingsScreen
6. View ticket QR → TicketDetailScreen

---

## Week 5 Implementation Tasks

### 🎯 Task 1: Configure Staging API [HIGH PRIORITY]

**Issue**: Mobile app points to production API, but Week 4 transfer features are on staging.

**Solution**: Add environment configuration for API URL switching.

**Files to Modify**:
1. **`.env.example`** (create if missing)
   ```env
   EXPO_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com/api
   # For production: https://transconnect-app-44ie.onrender.com/api
   ```

2. **`src/services/api.ts`** (line 16)
   ```typescript
   // BEFORE:
   const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
     'https://transconnect-app-44ie.onrender.com/api';
   
   // AFTER:
   const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ||
     Constants.expoConfig?.extra?.apiUrl || 
     'https://transconnect-app-testing.onrender.com/api';  // Default to staging for testing
   ```

**Testing**:
- Update `.env` with staging URL
- Restart Expo dev server with `expo start --clear`
- Verify API calls go to staging (check network logs)

**Est. Time**: 15 minutes

---

### 🎯 Task 2: Add Transfer API Service Methods [HIGH PRIORITY]

**Goal**: Create transfer API client functions to call Week 4 backend endpoints.

**File to Modify**: `src/services/api.ts`

**Add after `bookingsApi` (around line 220)**:
```typescript
// Booking Transfers API
export const transfersApi = {
  // Customer endpoints
  requestTransfer: (bookingId: string, transferData: {
    targetTravelDate?: string;
    targetRouteId?: string;
    reason: 'SCHEDULE_CONFLICT' | 'EMERGENCY' | 'PERSONAL_PREFERENCE' | 'PRICE_DIFFERENCE' | 'OTHER';
    reasonDetails?: string;
  }) =>
    apiClient.post(`/bookings/${bookingId}/transfers`, transferData),
  
  getMyTransfers: () =>
    apiClient.get('/bookings/transfers/my-requests'),
  
  getTransferById: (transferId: string) =>
    apiClient.get(`/bookings/transfers/${transferId}`),
  
  cancelTransfer: (transferId: string) =>
    apiClient.delete(`/bookings/transfers/${transferId}`),
  
  // Helper to get transfer status for a booking
  getBookingTransfer: (bookingId: string) =>
    apiClient.get(`/bookings/${bookingId}/transfer`).catch(() => null), // Return null if no transfer
};
```

**Testing**:
- Import `transfersApi` in a test file
- Call `transfersApi.getMyTransfers()` with valid auth token
- Verify returns empty array or transfer list

**Est. Time**: 20 minutes

---

### 🎯 Task 3: Create Transfer Request Screen [MEDIUM PRIORITY]

**Goal**: Build UI for passengers to request booking transfers.

**File to Create**: `src/screens/bookings/TransferRequestScreen.tsx`

**Components**:
```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersApi } from '../../services/api';
import { format } from 'date-fns';

export default function TransferRequestScreen({ route, navigation }: any) {
  const { booking } = route.params;
  const queryClient = useQueryClient();
  
  const [transferType, setTransferType] = useState<'date' | 'route' | 'both'>('date');
  const [newDate, setNewDate] = useState(new Date(booking.travelDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState<string>('SCHEDULE_CONFLICT');
  const [reasonDetails, setReasonDetails] = useState('');

  const transferMutation = useMutation({
    mutationFn: (data: any) => transfersApi.requestTransfer(booking.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-transfers'] });
      
      Alert.alert(
        'Transfer Request Submitted',
        'Your transfer request has been submitted and is pending approval from the operator.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Request Failed',
        error.response?.data?.message || 'Unable to submit transfer request. Please try again.'
      );
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      Alert.alert('Missing Information', 'Please select a reason for the transfer.');
      return;
    }

    const transferData: any = {
      reason,
      reasonDetails: reasonDetails.trim() || undefined,
    };

    if (transferType === 'date' || transferType === 'both') {
      transferData.targetTravelDate = format(newDate, 'yyyy-MM-dd');
    }

    // TODO: Add route selector for route changes
    // if (transferType === 'route' || transferType === 'both') {
    //   transferData.targetRouteId = selectedRouteId;
    // }

    Alert.alert(
      'Confirm Transfer Request',
      `You are requesting to transfer your booking from ${format(new Date(booking.travelDate), 'MMM dd, yyyy')} to ${format(newDate, 'MMM dd, yyyy')}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => transferMutation.mutate(transferData) },
      ]
    );
  };

  const reasons = [
    { value: 'SCHEDULE_CONFLICT', label: 'Schedule Conflict', icon: 'calendar-outline' },
    { value: 'EMERGENCY', label: 'Emergency', icon: 'alert-circle-outline' },
    { value: 'PERSONAL_PREFERENCE', label: 'Personal Preference', icon: 'person-outline' },
    { value: 'PRICE_DIFFERENCE', label: 'Price Consideration', icon: 'cash-outline' },
    { value: 'OTHER', label: 'Other Reason', icon: 'ellipsis-horizontal-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Current Booking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Booking</Text>
          <View style={styles.bookingCard}>
            <View style={styles.infoRow}>
              <Ionicons name="bus-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                {booking.route?.origin} → {booking.route?.destination}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                {format(new Date(booking.travelDate), 'EEEE, MMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{booking.route?.departureTime}</Text>
            </View>
          </View>
        </View>

        {/* Transfer Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What would you like to change?</Text>
          <TouchableOpacity
            style={[styles.option, transferType === 'date' && styles.selectedOption]}
            onPress={() => setTransferType('date')}
          >
            <Ionicons 
              name={transferType === 'date' ? 'radio-button-on' : 'radio-button-off'} 
              size={24} 
              color={transferType === 'date' ? '#3B82F6' : '#9CA3AF'} 
            />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Travel Date</Text>
              <Text style={styles.optionDesc}>Change your travel date only</Text>
            </View>
          </TouchableOpacity>
          
          {/* Route change coming in future update */}
          <View style={[styles.option, styles.disabledOption]}>
            <Ionicons name="radio-button-off" size={24} color="#D1D5DB" />
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, styles.disabledText]}>Route (Coming Soon)</Text>
              <Text style={[styles.optionDesc, styles.disabledText]}>Change to a different route</Text>
            </View>
          </View>
        </View>

        {/* New Date Selection */}
        {(transferType === 'date' || transferType === 'both') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select New Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              <Text style={styles.dateText}>{format(newDate, 'EEEE, MMM dd, yyyy')}</Text>
              <Ionicons name="chevron-down-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={newDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setNewDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
        )}

        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Transfer</Text>
          {reasons.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.reasonOption, reason === item.value && styles.selectedReason]}
              onPress={() => setReason(item.value)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={reason === item.value ? '#3B82F6' : '#6B7280'} 
              />
              <Text style={[
                styles.reasonText,
                reason === item.value && styles.selectedReasonText
              ]}>
                {item.label}
              </Text>
              {reason === item.value && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Provide any additional information about your transfer request..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={reasonDetails}
            onChangeText={setReasonDetails}
            textAlignVertical="top"
          />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            Your transfer request will be reviewed by the operator. You'll be notified once it's approved or rejected.
          </Text>
        </View>

      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, transferMutation.isPending && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={transferMutation.isPending}
        >
          {transferMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Transfer Request</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionContent: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  disabledText: {
    color: '#D1D5DB',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedReason: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  reasonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
  selectedReasonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
```

**Key Features**:
- Current booking info display
- Date picker for new travel date
- Reason selection (5 options from backend enum)
- Optional details textarea
- Submit confirmation alert
- React Query mutation with optimistic updates
- Loading state during submission
- Error handling with user-friendly messages

**Est. Time**: 2 hours

---

### 🎯 Task 4: Update BookingsScreen - Add Transfer Button [MEDIUM PRIORITY]

**Goal**: Add "Request Transfer" button to each booking card.

**File to Modify**: `src/screens/bookings/BookingsScreen.tsx`

**Changes**:

1. **Import transfer API** (add to imports at top):
   ```typescript
   import { transfersApi } from '../../services/api';
   ```

2. **Add transfer status query** (after bookings query, around line 125):
   ```typescript
   // Fetch all transfer requests for badge display
   const { data: transfers } = useQuery({
     queryKey: ['my-transfers'],
     queryFn: async () => {
       try {
         const response = await transfersApi.getMyTransfers();
         return response.data;
       } catch (error) {
         console.log('Failed to fetch transfers:', error);
         return [];
       }
     },
     enabled: !!bookings && bookings.length > 0, // Only fetch if user has bookings
   });
   ```

3. **Add helper function to get transfer status** (before filterBookings function):
   ```typescript
   const getTransferForBooking = (bookingId: string) => {
     if (!transfers || !Array.isArray(transfers)) return null;
     return transfers.find((t: any) => t.bookingId === bookingId);
   };
   ```

4. **Update BookingCard component** to show transfer status (around line 20):
   ```typescript
   const BookingCard = React.memo(({ booking, onPress, onTransferPress, getStatusColor, getStatusText, transferStatus }: any) => (
     <TouchableOpacity
       key={booking.id}
       style={styles.bookingCard}
       onPress={() => onPress(booking)}
     >
       <View style={styles.bookingHeader}>
         <Text style={styles.ticketNumber}>#{booking.id.slice(0, 8)}</Text>
         <View style={{flexDirection: 'row', gap: 8}}>
           {/* Transfer Status Badge */}
           {transferStatus && (
             <View style={[
               styles.statusBadge,
               { backgroundColor: getTransferStatusColor(transferStatus.status) + '20' }
             ]}>
               <Ionicons 
                 name={getTransferIcon(transferStatus.status)} 
                 size={12} 
                 color={getTransferStatusColor(transferStatus.status)} 
               />
               <Text style={[
                 styles.transferBadgeText,
                 { color: getTransferStatusColor(transferStatus.status) }
               ]}>
                 Transfer {transferStatus.status}
               </Text>
             </View>
           )}
           {/* Original Status Badge */}
           <View style={[
             styles.statusBadge,
             { backgroundColor: getStatusColor(booking.status) + '20' }
           ]}>
             <Text style={[
               styles.statusText,
               { color: getStatusColor(booking.status) }
             ]}>
               {getStatusText(booking.status)}
             </Text>
           </View>
         </View>
       </View>

       {/* ... existing route info ... */}

       <View style={styles.actionRow}>
         {/* Transfer Button - Only show if no pending transfer */}
         {!transferStatus && (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
           <TouchableOpacity 
             style={styles.transferButton}
             onPress={() => onTransferPress(booking)}
           >
             <Ionicons name="swap-horizontal-outline" size={16} color="#3B82F6" />
             <Text style={styles.transferButtonText}>Request Transfer</Text>
           </TouchableOpacity>
         )}
         
         {/* Existing View Ticket Button */}
         {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
           <TouchableOpacity 
             style={styles.viewTicketButton}
             onPress={() => onPress(booking)}
           >
             <Ionicons name="qr-code-outline" size={16} color="#3B82F6" />
             <Text style={styles.viewTicketText}>View Ticket</Text>
           </TouchableOpacity>
         )}
         
         <TouchableOpacity style={styles.detailsButton}>
           <Ionicons name="chevron-forward" size={16} color="#6B7280" />
         </TouchableOpacity>
       </View>
     </TouchableOpacity>
   ));
   ```

5. **Add transfer status helper functions** (before component return):
   ```typescript
   const getTransferStatusColor = (status: string) => {
     switch (status.toUpperCase()) {
       case 'PENDING':
         return '#F59E0B';
       case 'APPROVED':
         return '#10B981';
       case 'REJECTED':
         return '#EF4444';
       case 'CANCELLED':
         return '#6B7280';
       default:
         return '#9CA3AF';
     }
   };

   const getTransferIcon = (status: string) => {
     switch (status.toUpperCase()) {
       case 'PENDING':
         return 'time-outline';
       case 'APPROVED':
         return 'checkmark-circle-outline';
       case 'REJECTED':
         return 'close-circle-outline';
       case 'CANCELLED':
         return 'ban-outline';
       default:
         return 'help-outline';
     }
   };

   const handleTransferPress = (booking: any) => {
     // Check if booking is eligible for transfer
     const travelDate = new Date(booking.travelDate);
     const now = new Date();
     const hoursUntilTravel = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);
     
     if (hoursUntilTravel < 24) {
       Alert.alert(
         'Transfer Not Available',
         'Transfers must be requested at least 24 hours before travel.',
         [{ text: 'OK' }]
       );
       return;
     }
     
     navigation.navigate('TransferRequest', { booking });
   };
   ```

6. **Update BookingCard usage** in map function (around line 350):
   ```typescript
   {filteredBookings.map((booking: any) => (
     <BookingCard
       key={booking.id}
       booking={booking}
       onPress={(booking: any) => navigation.navigate('TicketDetail', { booking })}
       onTransferPress={handleTransferPress}
       getStatusColor={getStatusColor}
       getStatusText={getStatusText}
       transferStatus={getTransferForBooking(booking.id)}
     />
   ))}
   ```

7. **Add new styles** (in StyleSheet.create):
   ```typescript
   transferButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#EFF6FF',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 8,
     gap: 4,
   },
   transferButtonText: {
     fontSize: 12,
     fontWeight: '600',
     color: '#3B82F6',
   },
   transferBadgeText: {
     fontSize: 10,
     fontWeight: '600',
     marginLeft: 4,
   },
   ```

**Testing**:
- View bookings list
- See "Request Transfer" button on eligible bookings
- Tap button → navigates to TransferRequestScreen
- Submit transfer → returns to bookings with "Transfer PENDING" badge
- Badge color changes based on status (PENDING=orange, APPROVED=green, REJECTED=red)

**Est. Time**: 1 hour

---

### 🎯 Task 5: Update Navigation - Add Transfer Screen [MEDIUM PRIORITY]

**Goal**: Register TransferRequestScreen in app navigation.

**File to Modify**: `src/navigation/AppNavigator.tsx`

**Changes**:

1. **Import screen** (add to imports at top):
   ```typescript
   import TransferRequestScreen from '../screens/bookings/TransferRequestScreen';
   ```

2. **Add route** in AppStack (after BookingConfirmation, around line 110):
   ```typescript
   <Stack.Screen 
     name="TransferRequest" 
     component={TransferRequestScreen}
     options={{ 
       title: 'Request Transfer',
       headerShown: true,
     }}
   />
   ```

**Testing**:
- Navigate from BookingsScreen → TransferRequest screen works
- Back button returns to BookingsScreen
- Header shows "Request Transfer" title

**Est. Time**: 10 minutes

---

### 🎯 Task 6: Update TicketDetailScreen - Show Transfer Status [LOW PRIORITY]

**Goal**: Display transfer status on ticket detail screen.

**File to Modify**: `src/screens/tickets/TicketDetailScreen.tsx`

**Changes**: (Will need to read the file first to see current structure)

1. Add transfer status query
2. Show transfer info banner if transfer exists
3. Display new travel date if transfer approved
4. Show "Transfer Pending" badge if awaiting approval

**Est. Time**: 45 minutes

---

### 🎯 Task 7: Configure Push Notifications [LOW PRIORITY]

**Goal**: Notify users when transfer status changes (approved/rejected).

**Files to Modify**: 
- `src/services/notificationService.ts` (configure notifications)
- Backend API (add transfer status change notifications)

**Implementation**:
1. Register device for push notifications on app login
2. Backend sends notification when manager approves/rejects transfer
3. App handles notification and navigates to booking detail
4. Show in-app notification banner

**Est. Time**: 1.5 hours

---

### 🎯 Task 8: Testing & Validation [HIGH PRIORITY]

**Test Cases**:

1. **Transfer Request Flow**:
   - [ ] Login as passenger
   - [ ] View bookings list
   - [ ] Tap "Request Transfer" on confirmed booking
   - [ ] Select new date
   - [ ] Choose reason
   - [ ] Submit request
   - [ ] Verify "Transfer PENDING" badge appears
   - [ ] Verify API call succeeds (check network logs)

2. **Transfer Status Display**:
   - [ ] See pending transfer badge on booking card
   - [ ] See transfer status in ticket detail screen
   - [ ] Verify badge colors correct (PENDING=orange, APPROVED=green, REJECTED=red)

3. **Approval Flow** (requires admin dashboard):
   - [ ] Manager approves transfer via admin dashboard
   - [ ] Mobile app refreshes bookings
   - [ ] Badge updates to "Transfer APPROVED"
   - [ ] Booking details update to new date/route

4. **Edge Cases**:
   - [ ] Cannot request transfer <24 hours before travel
   - [ ] Cannot request transfer on cancelled booking
   - [ ] Cannot request transfer if one already pending
   - [ ] Proper error handling for network failures
   - [ ] Offline mode shows cached transfer status

**Testing Tools**:
- Expo Go app on physical device
- React Native Debugger for network logs
- Week 4 backend APIs on staging

**Est. Time**: 2 hours

---

## File Summary

### Files to Create (1)
1. ✅ `src/screens/bookings/TransferRequestScreen.tsx` (450 lines)

### Files to Modify (4)
1. ✅ `src/services/api.ts` - Add `transfersApi` methods
2. ✅ `src/screens/bookings/BookingsScreen.tsx` - Add transfer button & status badges
3. ✅ `src/navigation/AppNavigator.tsx` - Register TransferRequest screen
4. ⏳ `src/screens/tickets/TicketDetailScreen.tsx` - Show transfer status (optional)

### Files to Configure (2)
1. ✅ `.env` - Add `EXPO_PUBLIC_API_URL` for staging
2. ⏳ `src/services/notificationService.ts` - Configure push notifications (optional)

---

## Implementation Order

### Phase 1: Core Setup (30 minutes)
1. ✅ Configure staging API URL
2. ✅ Add transfer API service methods
3. ✅ Test API calls with Postman or curl

### Phase 2: UI Development (3-4 hours)
1. ✅ Create TransferRequestScreen
2. ✅ Update BookingsScreen (add transfer button)
3. ✅ Update AppNavigator (register route)
4. ⏳ Update TicketDetailScreen (show status)

### Phase 3: Testing (2 hours)
1. ✅ Test transfer request flow
2. ✅ Test status badge display
3. ✅ Test approval workflow (with admin dashboard)
4. ✅ Test edge cases

### Phase 4: Polish (1-2 hours - optional)
1. ⏳ Add push notifications
2. ⏳ Add offline support for transfers
3. ⏳ Add loading skeletons
4. ⏳ Add analytics tracking

**Total Estimated Time**: 6-8 hours

---

## API Configuration Reference

### Staging API Endpoints
```
Base URL: https://transconnect-app-testing.onrender.com/api

Authentication:
POST /auth/login
POST /auth/register

Transfer APIs (Week 4):
POST   /bookings/:bookingId/transfers      → Request transfer
GET    /bookings/transfers/my-requests      → Get all my transfers
GET    /bookings/transfers/:transferId      → Get transfer details
DELETE /bookings/transfers/:transferId      → Cancel transfer
```

### Request/Response Examples

**Request Transfer**:
```typescript
POST /bookings/abc123/transfers
Authorization: Bearer <token>

{
  "targetTravelDate": "2025-02-15",
  "reason": "SCHEDULE_CONFLICT",
  "reasonDetails": "Work meeting rescheduled"
}
```

**Response**:
```json
{
  "id": "transfer-xyz789",
  "bookingId": "abc123",
  "status": "PENDING",
  "targetTravelDate": "2025-02-15",
  "reason": "SCHEDULE_CONFLICT",
  "reasonDetails": "Work meeting rescheduled",
  "createdAt": "2025-01-27T10:00:00Z"
}
```

---

## UI/UX Design Guidelines

### Transfer Button States
- **Default**: Blue outline button with "Request Transfer" text
- **Disabled**: Gray button when transfer already pending or ineligible
- **Hidden**: Not shown for cancelled/completed bookings or <24 hrs before travel

### Transfer Status Badges
- **PENDING**: 🟠 Orange badge with clock icon
- **APPROVED**: 🟢 Green badge with checkmark icon
- **REJECTED**: 🔴 Red badge with X icon
- **CANCELLED**: ⚫ Gray badge with ban icon

### Transfer Request Screen Flow
1. Show current booking details (read-only)
2. Transfer type selector (Date/Route/Both) - only Date active for MVP
3. Date picker for new travel date
4. Reason dropdown (5 predefined reasons)
5. Optional details textarea
6. Info banner explaining approval process
7. Submit button with confirmation alert

---

## Risk Assessment

### Technical Risks
1. **API URL Mismatch** (HIGH)
   - **Risk**: Mobile app points to production, transfer features on staging
   - **Mitigation**: Add environment configuration FIRST
   - **Fallback**: Deploy Week 4 to production if staging testing complete

2. **React Native Version Compatibility** (LOW)
   - **Risk**: DateTimePicker may behave differently on iOS/Android
   - **Mitigation**: Test on both platforms, use @react-native-community package
   - **Fallback**: Use text input for date instead of picker

3. **Network Failures** (MEDIUM)
   - **Risk**: Poor connectivity during transfer submission
   - **Mitigation**: Show loading states, clear error messages, retry logic
   - **Fallback**: Offline queue for transfer requests (future enhancement)

### User Experience Risks
1. **Confusion on Transfer Status** (MEDIUM)
   - **Risk**: Users don't understand what "PENDING" means
   - **Mitigation**: Clear info banner, status explanations
   - **Fallback**: Add help tooltip/FAQ

2. **Accidental Transfer Requests** (LOW)
   - **Risk**: Users tap transfer button by mistake
   - **Mitigation**: Confirmation alert before submission
   - **Fallback**: Allow transfer cancellation

---

## Success Criteria

### Must Have (MVP)
- ✅ User can request date change transfer from BookingsScreen
- ✅ Transfer status displays on booking card
- ✅ Transfer request submits successfully to backend
- ✅ Status updates when manager approves/rejects
- ✅ Basic error handling and validation

### Should Have (Phase 2)
- ⏳ Push notifications for transfer status changes
- ⏳ Transfer details in ticket detail screen
- ⏳ Route change support (not just date)
- ⏳ Offline support for viewing transfer status

### Nice to Have (Future)
- ⏳ Transfer history screen
- ⏳ Quick transfer suggestions (automatic route alternatives)
- ⏳ In-app chat with operator about transfer
- ⏳ Transfer approval timeline tracker

---

## Next Steps

1. **Immediate Action**: Configure staging API URL and test connection
2. **High Priority**: Create transfer API service methods and TransferRequestScreen
3. **Medium Priority**: Update BookingsScreen with transfer button
4. **Low Priority**: Add push notifications and polish

**Ready to proceed with implementation?** Let's start with Task 1 (API configuration) and Task 2 (API service methods).
