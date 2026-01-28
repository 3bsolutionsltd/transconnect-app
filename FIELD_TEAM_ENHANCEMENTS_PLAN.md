# TransConnect Field Team Enhancements - Implementation Plan

**Date**: January 28, 2026  
**Status**: Pending Review  
**Priority**: High (Production Issues)

---

## ⚠️ CRITICAL PRODUCTION ISSUE (Discovered Jan 28, 2026)

### Mobile App Route Details Validation Error

**Severity**: CRITICAL - Blocking all bookings  
**Impact**: 100% of users unable to complete bookings  
**Status**: Fix in progress

#### Issue Description
After deploying JWT token refresh fix (v1.0.8), overly strict validation logic is blocking all route detail views:
- Users see "Invalid route data: please try again" when clicking any route
- Some routes show "Something went wrong" error
- Validation failing because it checks for `routeData.operatorName` but API returns `routeData.operator.companyName`

#### Root Cause
```typescript
// BROKEN CODE (lines 47-54)
if (!routeData.departureTime || !routeData.operatorName) {
  // Rejects routes with operator.companyName instead of operatorName
}
```

#### Production Logs Evidence
```
Routes API called with params: { origin: 'Kampala', destination: 'Fort Portal' }
Status: 200 OK (122 bytes) - API working fine
Mobile App: "Invalid route data" - Validation rejecting valid data
```

#### Fix Applied
```typescript
// FIXED CODE
const hasOperatorInfo = routeData.operatorName || routeData.operator?.companyName;
if (!routeData.departureTime || !hasOperatorInfo) {
  // Now accepts both formats
}
```

#### Immediate Actions Required
1. ✅ Fix validation logic to accept both operator name formats
2. ⏳ Commit and push fix (commit in progress)
3. ⏳ Rebuild mobile app v1.0.9
4. ⏳ Emergency deployment to Play Store
5. ⏳ Notify users of critical update

#### Lessons Learned
- Add validation checks must account for API response variations
- Need comprehensive integration testing before production deployment
- Require staging environment with production-like data
- Implement feature flags for gradual rollout

---

## Executive Summary

This document outlines solutions for critical operational issues identified by the field team during production deployment. The enhancements focus on:
1. **Simplified mobile authentication** (Phone + OTP login)
2. Enhanced user role management
3. Intelligent route and pricing management
4. Dynamic booking and transfer system
5. Robust seat inventory management

---

## 1. MOBILE APP: PHONE NUMBER + OTP AUTHENTICATION

### Problem
Current email/password login creates friction for mobile users:
- Users forget passwords frequently
- Email verification delays onboarding
- Poor user experience on mobile
- Low conversion rate from download to booking

### Proposed Solution
Implement **Phone Number + OTP (One-Time Password)** authentication as the primary mobile login method.

#### Benefits
- ✅ Faster onboarding (no password to remember)
- ✅ Better security (time-limited OTPs)
- ✅ Reduced support tickets (no "forgot password" issues)
- ✅ Instant verification (SMS delivery in seconds)
- ✅ Better mobile UX (native phone input)
- ✅ Higher conversion rates

#### User Flow
```
1. User enters phone number (+256 XXX XXX XXX)
2. System generates 6-digit OTP
3. SMS sent to user's phone
4. User enters OTP within 5 minutes
5. System validates and logs in user
6. JWT token issued (30-day expiry)
```

#### Database Schema Changes

```sql
-- Add phone authentication fields to users table
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN auth_method VARCHAR(50) DEFAULT 'email'; -- 'email', 'phone', 'both'

-- Create OTP storage table
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL, -- 'login', 'registration', 'verification'
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_phone_otp (phone_number, otp_code, expires_at),
  INDEX idx_expires_at (expires_at)
);

-- Create phone login attempts tracking (rate limiting)
CREATE TABLE phone_auth_attempts (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  attempt_type VARCHAR(50) NOT NULL, -- 'otp_request', 'otp_verify'
  success BOOLEAN DEFAULT false,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_phone_attempts (phone_number, created_at)
);

-- Make email optional for phone-authenticated users
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT check_auth_method 
  CHECK (
    (auth_method = 'email' AND email IS NOT NULL) OR
    (auth_method = 'phone' AND phone_number IS NOT NULL) OR
    (auth_method = 'both' AND email IS NOT NULL AND phone_number IS NOT NULL)
  );
```

#### Backend API Endpoints

**1. Request OTP**
```typescript
// POST /api/auth/request-otp
interface RequestOTPRequest {
  phoneNumber: string; // Format: +256XXXXXXXXX
  purpose: 'login' | 'registration';
}

interface RequestOTPResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
  retryAfter?: number; // seconds (if rate limited)
}

async function requestOTP(req: RequestOTPRequest): Promise<RequestOTPResponse> {
  // 1. Validate phone number format
  const cleaned = cleanPhoneNumber(req.phoneNumber);
  if (!isValidUgandaPhoneNumber(cleaned)) {
    throw new Error('Invalid phone number format');
  }
  
  // 2. Check rate limiting (max 3 OTPs per 10 minutes)
  const recentAttempts = await db.phoneAuthAttempts.count({
    where: {
      phoneNumber: cleaned,
      attemptType: 'otp_request',
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
    }
  });
  
  if (recentAttempts >= 3) {
    return {
      success: false,
      message: 'Too many requests. Please try again later.',
      expiresIn: 0,
      retryAfter: 600 - Math.floor((Date.now() - lastAttempt) / 1000)
    };
  }
  
  // 3. Generate 6-digit OTP
  const otp = generateOTP(); // Random 6-digit number
  
  // 4. Store OTP (expires in 5 minutes)
  await db.otpCodes.create({
    phoneNumber: cleaned,
    otpCode: otp,
    purpose: req.purpose,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    ipAddress: req.ip,
    userAgent: req.userAgent
  });
  
  // 5. Send SMS via provider
  await smsService.sendOTP(cleaned, otp);
  
  // 6. Log attempt
  await db.phoneAuthAttempts.create({
    phoneNumber: cleaned,
    attemptType: 'otp_request',
    success: true,
    ipAddress: req.ip
  });
  
  return {
    success: true,
    message: 'OTP sent successfully',
    expiresIn: 300
  };
}
```

**2. Verify OTP & Login**
```typescript
// POST /api/auth/verify-otp
interface VerifyOTPRequest {
  phoneNumber: string;
  otpCode: string;
}

interface VerifyOTPResponse {
  success: boolean;
  token?: string;
  expiresIn?: number;
  user?: {
    id: number;
    phoneNumber: string;
    name?: string;
    isNewUser: boolean;
  };
  message?: string;
}

async function verifyOTP(req: VerifyOTPRequest): Promise<VerifyOTPResponse> {
  const cleaned = cleanPhoneNumber(req.phoneNumber);
  
  // 1. Check rate limiting (max 5 verification attempts per 10 minutes)
  const verifyAttempts = await db.phoneAuthAttempts.count({
    where: {
      phoneNumber: cleaned,
      attemptType: 'otp_verify',
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
    }
  });
  
  if (verifyAttempts >= 5) {
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.'
    };
  }
  
  // 2. Find valid OTP
  const otpRecord = await db.otpCodes.findFirst({
    where: {
      phoneNumber: cleaned,
      otpCode: req.otpCode,
      expiresAt: { gte: new Date() },
      usedAt: null
    },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!otpRecord) {
    await db.phoneAuthAttempts.create({
      phoneNumber: cleaned,
      attemptType: 'otp_verify',
      success: false,
      ipAddress: req.ip
    });
    
    return {
      success: false,
      message: 'Invalid or expired OTP. Please try again.'
    };
  }
  
  // 3. Mark OTP as used
  await db.otpCodes.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() }
  });
  
  // 4. Find or create user
  let user = await db.users.findUnique({
    where: { phoneNumber: cleaned }
  });
  
  const isNewUser = !user;
  
  if (!user) {
    // Create new user with phone authentication
    user = await db.users.create({
      data: {
        phoneNumber: cleaned,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        authMethod: 'phone',
        role: 'customer'
      }
    });
  } else {
    // Update existing user
    await db.users.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      }
    });
  }
  
  // 5. Generate JWT token (30-day expiry)
  const token = jwt.sign(
    { userId: user.id, phoneNumber: cleaned },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );
  
  // 6. Log successful attempt
  await db.phoneAuthAttempts.create({
    phoneNumber: cleaned,
    attemptType: 'otp_verify',
    success: true,
    ipAddress: req.ip
  });
  
  return {
    success: true,
    token,
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
    user: {
      id: user.id,
      phoneNumber: cleaned,
      name: user.name,
      isNewUser
    }
  };
}
```

**3. Helper Functions**
```typescript
function cleanPhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Handle Uganda formats
  if (cleaned.startsWith('0')) {
    cleaned = '+256' + cleaned.substring(1);
  } else if (cleaned.startsWith('256')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+256' + cleaned;
  }
  
  return cleaned;
}

function isValidUgandaPhoneNumber(phone: string): boolean {
  // Uganda format: +256 7XX XXX XXX or +256 3XX XXX XXX
  const regex = /^\+256[73]\d{8}$/;
  return regex.test(phone);
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

#### SMS Service Integration

**Option 1: Africa's Talking (Recommended for Uganda)**
```typescript
// src/services/sms.ts
import africastalking from 'africastalking';

const client = africastalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY!,
  username: process.env.AFRICAS_TALKING_USERNAME!
});

const sms = client.SMS;

export const smsService = {
  async sendOTP(phoneNumber: string, otp: string): Promise<void> {
    try {
      const message = `Your TransConnect verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
      
      const result = await sms.send({
        to: [phoneNumber],
        message,
        from: 'TransConnect' // Sender ID (requires registration)
      });
      
      console.log('SMS sent:', result);
      
      if (result.SMSMessageData.Recipients[0].status !== 'Success') {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }
};
```

**Cost Estimate**: ~$0.01 per SMS in Uganda

**Alternative Providers**:
- Twilio (more expensive, ~$0.05 per SMS)
- Nexmo/Vonage
- Infobip

#### Mobile App Implementation

**1. Phone Input Screen**
```typescript
// src/screens/auth/PhoneLoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { authApi } from '../../services/api';

export default function PhoneLoginScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.requestOTP({
        phoneNumber: phoneNumber.startsWith('0') ? phoneNumber : '0' + phoneNumber,
        purpose: 'login'
      });

      if (response.data.success) {
        navigation.navigate('OTPVerification', { phoneNumber });
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to TransConnect</Text>
      <Text style={styles.subtitle}>Enter your phone number to continue</Text>
      
      <View style={styles.phoneInputContainer}>
        <Text style={styles.countryCode}>+256</Text>
        <TextInput
          style={styles.phoneInput}
          placeholder="7XX XXX XXX"
          keyboardType="phone-pad"
          maxLength={9}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          autoFocus
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRequestOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Get OTP'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('EmailLogin')}>
        <Text style={styles.linkText}>Login with email instead</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**2. OTP Verification Screen**
```typescript
// src/screens/auth/OTPVerificationScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';

export default function OTPVerificationScreen({ route, navigation }: any) {
  const { phoneNumber } = route.params;
  const { login } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyOTP({
        phoneNumber,
        otpCode: code
      });

      if (response.data.success) {
        await login(response.data.token, response.data.user);
        
        if (response.data.user.isNewUser) {
          navigation.replace('CompleteProfile');
        } else {
          navigation.replace('Main');
        }
      } else {
        Alert.alert('Error', response.data.message);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authApi.requestOTP({ phoneNumber, purpose: 'login' });
      setCountdown(300);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('Success', 'New OTP sent to your phone');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We sent a code to {phoneNumber}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => inputRefs.current[index] = ref}
            style={styles.otpInput}
            value={digit}
            onChangeText={value => handleOTPChange(index, value)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <Text style={styles.timer}>
        {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
      </Text>

      <TouchableOpacity 
        style={styles.resendButton}
        onPress={handleResendOTP}
        disabled={countdown > 0}
      >
        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
          Resend OTP
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.changeNumber}>Change phone number</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### Security Considerations

1. **Rate Limiting**
   - Max 3 OTP requests per 10 minutes per phone
   - Max 5 verification attempts per 10 minutes per phone
   - IP-based rate limiting for additional protection

2. **OTP Expiry**
   - OTPs expire after 5 minutes
   - One-time use only (marked as used after verification)

3. **Brute Force Protection**
   - Lock account after 10 failed attempts in 1 hour
   - Require longer cooldown period after multiple failures

4. **SMS Delivery Monitoring**
   - Log all SMS attempts
   - Alert on high failure rates
   - Monitor costs and usage

5. **Privacy**
   - Mask phone numbers in logs (show only last 4 digits)
   - Don't expose OTP codes in API responses
   - Secure SMS provider credentials

#### Testing Plan

**Unit Tests**
- Phone number validation
- OTP generation
- Rate limiting logic
- Token generation

**Integration Tests**
- OTP request flow
- OTP verification flow
- Rate limit enforcement
- SMS provider integration

**Manual Testing Checklist**
- [ ] Valid Uganda phone numbers (both formats)
- [ ] Invalid phone numbers rejected
- [ ] OTP received via SMS within 30 seconds
- [ ] Correct OTP allows login
- [ ] Incorrect OTP rejected
- [ ] Expired OTP rejected
- [ ] Rate limiting works after 3 requests
- [ ] Resend OTP functionality
- [ ] New user registration flow
- [ ] Existing user login flow

#### Migration Strategy

**Phase 1: Add Phone Auth Alongside Email**
- Deploy backend changes
- Keep email login as default
- Add "Login with Phone" option

**Phase 2: Make Phone Auth Primary**
- Update mobile app to show phone login first
- Email login available as "Other options"

**Phase 3: Migrate Existing Users**
- Prompt existing email users to add phone number
- Offer incentive (e.g., first ride discount)
- Send push notification campaign

**Phase 4: Analytics & Optimization**
- Track adoption rates
- Monitor SMS delivery success
- Optimize based on user feedback

#### Cost Analysis

**SMS Costs (Africa's Talking - Uganda)**
- Per SMS: ~UGX 38 ($0.01)
- Expected volume: 1000 logins/day = UGX 38,000/day
- Monthly: ~UGX 1,140,000 ($300)

**Development Costs**
- Backend API: 3-4 days
- Mobile UI: 2-3 days
- Testing: 2 days
- Total: ~7-9 days ($3,500 - $4,500)

**ROI**
- Reduced support tickets: -50% password-related issues
- Faster onboarding: +30% conversion rate
- Better user experience: +20% retention

**Priority**: High  
**Complexity**: Medium  
**Estimated Time**: 7-9 days  
**Dependencies**: eSMS Africa already configured, reuse existing SMS service  
**Cost**: $180/month ongoing (40% cheaper than estimated) + $3,500-4,500 one-time

---

## 2. USER MANAGEMENT ENHANCEMENT

### Problem
Admin role is being used for both system administrators and TransConnect operational managers, creating security and permission concerns.

### Proposed Solution
Create a new **TransConnect Manager** role with specific operational permissions.

#### Role Hierarchy
```
System Admin (Full Control)
  ├── TransConnect Manager (Operational Management)
  │   ├── Manage Operators
  │   ├── Manage Routes & Pricing
  │   ├── View All Bookings
  │   ├── Handle Transfers
  │   ├── Manage Bus Assignments
  │   └── View Reports & Analytics
  └── Operator (Company Specific)
      ├── Manage Own Buses
      ├── Manage Own Routes
      └── View Own Bookings
```

#### Database Changes
```sql
-- Add new role type
ALTER TYPE user_role ADD VALUE 'transconnect_manager';

-- Add permissions table
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role user_role NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Predefined permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('transconnect_manager', 'manage_operators'),
  ('transconnect_manager', 'manage_routes'),
  ('transconnect_manager', 'manage_transfers'),
  ('transconnect_manager', 'view_all_bookings'),
  ('transconnect_manager', 'manage_dynamic_buses'),
  ('transconnect_manager', 'view_analytics');
```

#### Implementation Tasks
- [ ] Update user schema with new role type
- [ ] Create permissions middleware
- [ ] Update admin dashboard with role-based UI
- [ ] Add user management interface for System Admin

**Priority**: Medium  
**Complexity**: Low  
**Estimated Time**: 2-3 days

---

## 2. AUTOMATED ROUTE DISTANCE & DURATION CALCULATION

### Problem
Manually entering distance and duration for routes with multiple stopovers is tedious and error-prone.

### Proposed Solution
Integrate Google Maps Distance Matrix API to automatically calculate:
- Total route distance
- Estimated travel duration
- Distance between each stopover
- Duration for each leg of the journey

#### Database Changes
```sql
-- Add calculated fields to routes table
ALTER TABLE routes ADD COLUMN auto_calculated BOOLEAN DEFAULT true;
ALTER TABLE routes ADD COLUMN calculation_data JSONB;

-- Store detailed leg information
-- calculation_data structure:
{
  "total_distance_km": 450,
  "total_duration_minutes": 360,
  "legs": [
    {
      "from": "Kampala",
      "to": "Masaka",
      "distance_km": 125,
      "duration_minutes": 90
    },
    {
      "from": "Masaka",
      "to": "Mbarara",
      "distance_km": 325,
      "duration_minutes": 270
    }
  ],
  "calculated_at": "2026-01-28T10:00:00Z",
  "via_points": ["Masaka", "Lyantonde"]
}
```

#### API Integration
```typescript
// New service: src/services/routeCalculation.ts
interface RouteCalculationRequest {
  origin: string;
  destination: string;
  viaPoints: string[]; // Stopovers
}

interface RouteCalculationResult {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  legs: RouteLeg[];
}

async function calculateRouteMetrics(request: RouteCalculationRequest): Promise<RouteCalculationResult> {
  // Call Google Maps Distance Matrix API
  // Calculate each leg between origin -> via1 -> via2 -> destination
  // Sum up totals
  // Return structured data
}
```

#### Admin UI Changes
- Add "Calculate Automatically" button when creating/editing routes
- Show breakdown of each leg with distances
- Allow manual override if needed
- Display last calculation timestamp
- Show warning if route data is outdated (>30 days)

#### Cost Consideration
- Google Maps Distance Matrix API: ~$5 per 1000 requests
- Cache calculations for frequently used routes
- Recalculate only when route/stopovers change

**Priority**: High  
**Complexity**: Medium  
**Estimated Time**: 4-5 days  
**Dependencies**: Google Maps API key with Distance Matrix enabled

---

## 3. STOPOVER AS SEARCHABLE DESTINATIONS

### Problem
Passengers searching for stopover towns as destinations get "No routes found" because the system only searches origin and destination fields.

### Current Schema Issue
```sql
-- Current: vias stored as TEXT array
routes {
  origin TEXT,
  destination TEXT,
  vias TEXT[] -- ["Masaka", "Lyantonde"]
}
```

### Proposed Solution: Route Segments Model

Create a **route segments** approach where every stopover becomes a valid search endpoint.

#### New Database Schema
```sql
-- Enhanced routes table
ALTER TABLE routes ADD COLUMN segment_enabled BOOLEAN DEFAULT true;

-- New route_segments table
CREATE TABLE route_segments (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
  segment_order INTEGER NOT NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(route_id, segment_order)
);

-- Date-based pricing variations (weekend/holiday premiums)
CREATE TABLE segment_price_variations (
  id SERIAL PRIMARY KEY,
  segment_id INTEGER REFERENCES route_segments(id) ON DELETE CASCADE,
  variation_type VARCHAR(50) NOT NULL, -- 'weekend', 'holiday', 'peak_season', 'custom'
  price_adjustment DECIMAL(10,2) NOT NULL, -- Can be positive (premium) or negative (discount)
  adjustment_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
  applies_to_dates JSONB, -- {"days": ["saturday", "sunday"]} or {"dates": ["2026-12-25"]}
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast searching
CREATE INDEX idx_route_segments_locations ON route_segments(from_location, to_location);
CREATE INDEX idx_route_segments_from ON route_segments(from_location);
CREATE INDEX idx_route_segments_to ON route_segments(to_location);
CREATE INDEX idx_segment_variations_dates ON segment_price_variations(segment_id, start_date, end_date) WHERE active = true;

-- Example data for route: Kampala -> Masaka -> Lyantonde -> Mbarara
INSERT INTO route_segments (route_id, segment_order, from_location, to_location, distance_km, duration_minutes, base_price) VALUES
  (1, 1, 'Kampala', 'Masaka', 125, 90, 15000),
  (1, 2, 'Masaka', 'Lyantonde', 80, 60, 10000),
  (1, 3, 'Lyantonde', 'Mbarara', 145, 120, 12000);
```

#### Search Algorithm Enhancement
```typescript
// New search logic in src/services/routeSearch.ts
interface SearchRequest {
  origin: string;
  destination: string;
  date: Date;
}

async function searchRoutes(req: SearchRequest) {
  // Find all possible routes from origin to destination
  // including those where they are stopovers
  
  const query = `
    WITH route_connections AS (
      -- Direct routes
      SELECT DISTINCT r.*, 
        rs1.from_location as pickup,
        rs2.to_location as dropoff,
        SUM(rs.base_price) as calculated_price
      FROM routes r
      JOIN route_segments rs1 ON rs1.route_id = r.id
      JOIN route_segments rs2 ON rs2.route_id = r.id
      JOIN route_segments rs ON rs.route_id = r.id 
        AND rs.segment_order BETWEEN rs1.segment_order AND rs2.segment_order
      WHERE rs1.from_location ILIKE $1
        AND rs2.to_location ILIKE $2
        AND rs1.segment_order <= rs2.segment_order
      GROUP BY r.id, rs1.from_location, rs2.to_location
    )
    SELECT * FROM route_connections
    WHERE date = $3
    ORDER BY calculated_price, departure_time;
  `;
  
  return await db.query(query, [origin, destination, date]);
}
```

#### Pricing Logic
```typescript
// Calculate price based on segments traveled with date variations
async function calculateSegmentPrice(
  routeId: number, 
  from: string, 
  to: string, 
  travelDate: Date
): Promise<number> {
  // 1. Get all segments between from and to
  const segments = await db.routeSegments.findMany({
    where: {
      routeId,
      fromLocation: { gte: from },
      toLocation: { lte: to }
    },
    include: { priceVariations: true }
  });
  
  // 2. Calculate base price
  let totalPrice = segments.reduce((sum, seg) => sum + seg.basePrice, 0);
  
  // 3. Apply date-based variations
  for (const segment of segments) {
    const variations = segment.priceVariations.filter(v => 
      v.active && isDateApplicable(v, travelDate)
    );
    
    for (const variation of variations) {
      if (variation.adjustmentType === 'percentage') {
        totalPrice += segment.basePrice * (variation.priceAdjustment / 100);
      } else {
        totalPrice += variation.priceAdjustment;
      }
    }
  }
  
  return Math.round(totalPrice);
}

function isDateApplicable(variation: PriceVariation, date: Date): boolean {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const dateStr = date.toISOString().split('T')[0];
  
  if (variation.appliesToDates?.days?.includes(dayName)) return true;
  if (variation.appliesToDates?.dates?.includes(dateStr)) return true;
  if (variation.startDate && variation.endDate) {
    return date >= variation.startDate && date <= variation.endDate;
  }
  
  return false;
}
```

#### Migration Plan
1. **Create route_segments table** (zero-downtime)
2. **Migrate existing routes data** in background:
   - Create segments from origin -> each via -> destination
   - Split current price proportionally by distance
   - Run migration script during low-traffic hours
   - Keep both old and new systems running simultaneously
3. **Create segment_price_variations table**
4. **Update search API** with feature flag:
   - Add new segment-based search endpoint
   - Keep old search working during transition
   - Gradually migrate traffic to new endpoint
5. **Backwards compatibility**: 
   - Keep vias field for display purposes
   - Dual-write to both systems temporarily
6. **Update admin UI** to manage segments
7. **Full cutover** after 2 weeks of parallel running
8. **Cleanup** old code after 1 month

**Zero-Downtime Strategy**:
- Use feature flags for gradual rollout
- Run old and new systems in parallel
- Monitor performance and errors closely
- Quick rollback capability if issues arise

**Priority**: High (Critical for production)  
**Complexity**: High  
**Estimated Time**: 6-8 days  
**Testing Required**: Extensive search scenarios + staging environment

---

## 4. STOPOVER PRICING MANAGEMENT

### Problem
Operators charge different rates for different stopovers, but current system only has one price per route.

### Solution
Already addressed in Section 3 with route_segments approach. Each segment has its own base_price.

#### Admin UI for Pricing
```
Route: Kampala to Mbarara

┌─────────────────────────────────────────────────────┐
│ Segment 1: Kampala → Masaka                        │
│ Distance: 125 km | Duration: 1h 30m                │
│ Price: UGX 15,000                            [Edit] │
├─────────────────────────────────────────────────────┤
│ Segment 2: Masaka → Lyantonde                      │
│ Distance: 80 km | Duration: 1h                     │
│ Price: UGX 10,000                            [Edit] │
├─────────────────────────────────────────────────────┤
│ Segment 3: Lyantonde → Mbarara                     │
│ Distance: 145 km | Duration: 2h                    │
│ Price: UGX 12,000                            [Edit] │
└─────────────────────────────────────────────────────┘

Total Route Price: UGX 37,000
```

#### Bulk Pricing Tools
```typescript
// Admin helper functions
interface PricingRule {
  pricePerKm?: number;  // e.g., 120 UGX/km
  basePrice?: number;    // e.g., 5000 UGX minimum
  roundTo?: number;      // Round to nearest 1000
}

function applyPricingRule(segments: RouteSegment[], rule: PricingRule) {
  // Auto-calculate prices based on distance
  // Operator can then adjust individual segments
}
```

**Priority**: High  
**Complexity**: Medium (covered by Section 3)  
**Estimated Time**: Included in Section 3

---

## 5. BOOKING TRANSFER MANAGEMENT

### Problem
Need to transfer passengers between buses when:
- Customer booked wrong bus
- Original bus has mechanical issues
- Bus schedule changes
- Capacity reallocation needed

### Proposed Solution: Booking Transfer System

#### Database Schema
```sql
-- New booking_transfers table
CREATE TABLE booking_transfers (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE RESTRICT,
  original_schedule_id INTEGER REFERENCES bus_schedules(id),
  new_schedule_id INTEGER REFERENCES bus_schedules(id),
  reason TEXT NOT NULL,
  initiated_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Track seat changes
CREATE TABLE booking_seat_history (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  schedule_id INTEGER REFERENCES bus_schedules(id),
  seat_number VARCHAR(10),
  action VARCHAR(50), -- allocated, released, transferred
  action_date TIMESTAMP DEFAULT NOW(),
  action_by INTEGER REFERENCES users(id)
);

-- Add transfer flag to bookings
ALTER TABLE bookings ADD COLUMN is_transferred BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN transfer_id INTEGER REFERENCES booking_transfers(id);
```

#### Transfer Workflow
```typescript
interface TransferRequest {
  bookingId: number;
  newScheduleId: number;
  reason: string;
  initiatedBy: number;
  notifyCustomer: boolean;
}

async function initiateBookingTransfer(req: TransferRequest) {
  const booking = await getBooking(req.bookingId);
  const newSchedule = await getSchedule(req.newScheduleId);
  
  // 1. Validate new bus has available seats
  const availableSeats = await getAvailableSeats(req.newScheduleId);
  if (availableSeats.length < booking.passengers.length) {
    throw new Error('Insufficient seats on new bus');
  }
  
  // 2. Create transfer record
  const transfer = await db.bookingTransfers.create({
    bookingId: req.bookingId,
    originalScheduleId: booking.scheduleId,
    newScheduleId: req.newScheduleId,
    reason: req.reason,
    initiatedBy: req.initiatedBy,
    status: 'pending'
  });
  
  // 3. Release seats on original bus
  await releaseSeatReservations(booking.scheduleId, booking.seats);
  
  // 4. Allocate seats on new bus
  const newSeats = await allocateSeats(req.newScheduleId, booking.passengers.length);
  
  // 5. Update booking
  await db.bookings.update(req.bookingId, {
    scheduleId: req.newScheduleId,
    seats: newSeats,
    isTransferred: true,
    transferId: transfer.id
  });
  
  // 6. Calculate price adjustment
  const priceAdjustment = calculatePriceAdjustment(booking, newSchedule);
  
  // 7. Generate new QR code
  await regenerateBookingQR(req.bookingId);
  
  // 8. Notify customer
  if (req.notifyCustomer) {
    await sendTransferNotification(booking.userId, transfer, priceAdjustment);
  }
  
  // 9. Complete transfer
  await db.bookingTransfers.update(transfer.id, {
    status: 'completed',
    priceAdjustment,
    completedAt: new Date()
  });
  
  return { transfer, newSeats, priceAdjustment };
}
```

#### Admin UI Features
```
Booking Transfer Interface
┌──────────────────────────────────────────────────┐
│ Transfer Booking #12345                          │
├──────────────────────────────────────────────────┤
│ Current Bus: KAA 123C | Kampala-Mbarara        │
│ Departure: Jan 30, 2026 08:00 AM                │
│ Seats: 12A, 12B | Passengers: 2                 │
├──────────────────────────────────────────────────┤
│ Select New Bus:                                  │
│ ○ KAA 456D | Kampala-Mbarara | 09:00 AM        │
│   Available Seats: 15 | Price: +UGX 2,000      │
│                                                  │
│ ○ KAA 789E | Kampala-Mbarara | 10:30 AM        │
│   Available Seats: 20 | Price: Same            │
├──────────────────────────────────────────────────┤
│ Reason: [Dropdown: Wrong bus booked]            │
│ Notes: [Customer requested earlier departure]   │
│                                                  │
│ □ Notify customer via SMS                       │
│ □ Notify customer via email                     │
│                                                  │
│ Price Adjustment: +UGX 2,000                    │
│ ○ Charge customer  ○ Waive fee  ○ Refund       │
│                                                  │
│        [Cancel]        [Transfer Booking]       │
└──────────────────────────────────────────────────┘
```

#### Customer Notification
```
SMS: Your TransConnect booking #12345 has been transferred to bus KAA 456D departing at 09:00 AM on Jan 30. New seats: 15A, 15B. Your QR code has been updated. No additional charges. Questions? Call 0800-123-456.
```

**Priority**: High  
**Complexity**: High  
**Estimated Time**: 7-9 days  
**Testing Required**: Extensive workflow testing

---

## 6. DYNAMIC BUS ALLOCATION (ON-DEMAND ROUTING)

### Problem
Some operators don't pre-list all routes but allocate buses on-demand based on bookings. Need to:
- Allow booking without fixed schedules
- Dynamically assign buses
- Still track seat inventory

### Proposed Solution: Flexible Scheduling System

#### Database Schema
```sql
-- Add scheduling mode to routes
ALTER TABLE routes ADD COLUMN scheduling_mode VARCHAR(50) DEFAULT 'fixed';
-- Values: 'fixed', 'dynamic', 'hybrid'

-- New dynamic_route_pool table
CREATE TABLE dynamic_route_pools (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
  operator_id INTEGER REFERENCES operators(id),
  date DATE NOT NULL,
  min_passengers INTEGER DEFAULT 1,
  max_passengers INTEGER,
  cutoff_hours INTEGER DEFAULT 2, -- Hours before departure to assign bus
  status VARCHAR(50) DEFAULT 'accepting', -- accepting, assigned, cancelled
  assigned_bus_id INTEGER REFERENCES buses(id),
  assigned_schedule_id INTEGER REFERENCES bus_schedules(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(route_id, date)
);

-- Provisional bookings (before bus assigned)
CREATE TABLE provisional_bookings (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER REFERENCES dynamic_route_pools(id),
  user_id INTEGER REFERENCES users(id),
  passengers INTEGER NOT NULL,
  preferred_time TIME,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  total_price DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  status VARCHAR(50) DEFAULT 'provisional', -- provisional, confirmed, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link provisional to actual booking after bus assignment
ALTER TABLE bookings ADD COLUMN provisional_booking_id INTEGER REFERENCES provisional_bookings(id);
```

#### Dynamic Allocation Workflow

**Phase 1: Customer Books (No Bus Assigned Yet)**
```typescript
async function createProvisionalBooking(request: BookingRequest) {
  // 1. Check if route supports dynamic scheduling
  const route = await getRoute(request.routeId);
  if (route.schedulingMode !== 'dynamic' && route.schedulingMode !== 'hybrid') {
    return createNormalBooking(request); // Use existing logic
  }
  
  // 2. Get or create dynamic pool for this date
  let pool = await db.dynamicRoutePools.findOne({
    routeId: request.routeId,
    date: request.date
  });
  
  if (!pool) {
    pool = await db.dynamicRoutePools.create({
      routeId: request.routeId,
      operatorId: route.operatorId,
      date: request.date,
      maxPassengers: route.defaultCapacity || 50
    });
  }
  
  // 3. Create provisional booking
  const provisional = await db.provisionalBookings.create({
    poolId: pool.id,
    userId: request.userId,
    passengers: request.passengers.length,
    fromLocation: request.origin,
    toLocation: request.destination,
    totalPrice: request.totalPrice,
    paymentStatus: 'pending'
  });
  
  // 4. Process payment
  const payment = await processPayment(provisional.id, request.paymentDetails);
  
  if (payment.status === 'success') {
    await db.provisionalBookings.update(provisional.id, {
      paymentStatus: 'paid'
    });
  }
  
  // 5. Check if should auto-assign bus
  const totalPassengers = await getTotalPassengersInPool(pool.id);
  if (totalPassengers >= pool.minPassengers) {
    await scheduleAutoAssignment(pool.id);
  }
  
  return { provisional, pool, requiresConfirmation: true };
}
```

**Phase 2: Auto-Assignment (Operator or System)**
```typescript
async function assignBusToPool(poolId: number, busId?: number) {
  const pool = await getPool(poolId);
  const provisionals = await getProvisionalBookings(poolId, { status: 'provisional' });
  
  // 1. Select bus (auto or manual)
  let bus = busId ? await getBus(busId) : await selectOptimalBus(pool);
  
  // 2. Create schedule
  const schedule = await db.busSchedules.create({
    busId: bus.id,
    routeId: pool.routeId,
    date: pool.date,
    departureTime: calculateOptimalDepartureTime(provisionals),
    availableSeats: bus.capacity,
    status: 'scheduled'
  });
  
  // 3. Convert provisional bookings to confirmed bookings
  for (const provisional of provisionals) {
    const seats = await allocateSeats(schedule.id, provisional.passengers);
    
    const booking = await db.bookings.create({
      userId: provisional.userId,
      scheduleId: schedule.id,
      seats: seats,
      totalPrice: provisional.totalPrice,
      paymentStatus: provisional.paymentStatus,
      provisionalBookingId: provisional.id,
      status: 'confirmed'
    });
    
    // Generate QR code
    await generateBookingQR(booking.id);
    
    // Update provisional
    await db.provisionalBookings.update(provisional.id, {
      status: 'confirmed'
    });
    
    // Notify customer
    await sendBusAssignmentNotification(provisional.userId, {
      booking,
      bus,
      schedule
    });
  }
  
  // 4. Update pool
  await db.dynamicRoutePools.update(poolId, {
    status: 'assigned',
    assignedBusId: bus.id,
    assignedScheduleId: schedule.id
  });
  
  return { schedule, confirmedBookings: provisionals.length };
}
```

**Phase 3: Auto-Assignment Trigger (Cron Job)**
```typescript
// Run hourly
async function processAutoAssignments() {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() + 2); // 2 hours before departure
  
  const pendingPools = await db.dynamicRoutePools.findMany({
    status: 'accepting',
    date: { lte: cutoffTime },
    minPassengers: { lte: db.raw('(SELECT COUNT(*) FROM provisional_bookings WHERE pool_id = dynamic_route_pools.id)') }
  });
  
  for (const pool of pendingPools) {
    await assignBusToPool(pool.id);
  }
}
```

#### Admin UI for Dynamic Management
```
Dynamic Route Management
┌──────────────────────────────────────────────────┐
│ Route: Kampala → Mbarara                         │
│ Date: January 30, 2026                           │
│ Status: Accepting Bookings                       │
├──────────────────────────────────────────────────┤
│ Current Bookings: 18 passengers                  │
│ Minimum to Assign: 15 passengers    ✅ MET      │
│ Maximum Capacity: 50 passengers                  │
│                                                  │
│ Provisional Bookings:                            │
│ #1001 - 2 passengers - 08:00 AM preferred       │
│ #1002 - 3 passengers - 09:00 AM preferred       │
│ #1003 - 5 passengers - 10:00 AM preferred       │
│ #1004 - 8 passengers - 08:30 AM preferred       │
│                                                  │
│ Suggested Departure: 09:00 AM (based on average)│
│                                                  │
│ Available Buses:                                 │
│ ○ KAA 123C (52 seats, Rating: 4.5) [Select]    │
│ ○ KAA 456D (45 seats, Rating: 4.2) [Select]    │
│                                                  │
│ Auto-assign in: 1 hour 45 minutes              │
│                                                  │
│        [Assign Now]  [Cancel Pool]  [Extend]    │
└──────────────────────────────────────────────────┘
```

**Priority**: Medium (After core fixes)  
**Complexity**: Very High  
**Estimated Time**: 10-14 days  
**Dependencies**: Sections 3, 5 must be complete

---

## 7. SEAT DOUBLE-BOOKING PREVENTION

### Problem
Need robust system to prevent same seat being booked twice.

### Current Implementation Review
Let me check if there are existing constraints...

### Enhanced Solution: Multi-Layer Protection

#### Database Level
```sql
-- Add unique constraint on seat assignments
CREATE TABLE booking_seats (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  schedule_id INTEGER REFERENCES bus_schedules(id) ON DELETE CASCADE,
  seat_number VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'reserved', -- reserved, released, transferred
  reserved_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  UNIQUE(schedule_id, seat_number, status) WHERE status = 'reserved'
  -- Partial unique index: prevents duplicate reserved seats on same schedule
);

-- Overbooking configuration per operator
CREATE TABLE operator_overbooking_config (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER REFERENCES operators(id) UNIQUE,
  allow_overbooking BOOLEAN DEFAULT true,
  overbooking_percentage DECIMAL(5,2) DEFAULT 7.5, -- 7.5% buffer (industry standard)
  max_overbook_seats INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_booking_seats_schedule ON booking_seats(schedule_id, status);
```

#### Application Level: Pessimistic Locking
```typescript
async function reserveSeats(scheduleId: number, seatNumbers: string[]) {
  return await db.transaction(async (tx) => {
    // 1. Lock the schedule row
    const schedule = await tx.busSchedules.findOne({
      where: { id: scheduleId },
      lock: 'FOR UPDATE' // PostgreSQL row-level lock
    });
    
    // 2. Check current reservations with lock
    const reservedSeats = await tx.bookingSeats.findMany({
      where: {
        scheduleId: scheduleId,
        status: 'reserved',
        seatNumber: { in: seatNumbers }
      },
      lock: 'FOR UPDATE'
    });
    
    if (reservedSeats.length > 0) {
      throw new Error(`Seats already booked: ${reservedSeats.map(s => s.seatNumber).join(', ')}`);
    }
    
    // 3. Create reservations
    const reservations = await tx.bookingSeats.createMany({
      data: seatNumbers.map(seat => ({
        scheduleId,
        seatNumber: seat,
        status: 'reserved'
      }))
    });
    
    // 4. Update available count
    await tx.busSchedules.update({
      where: { id: scheduleId },
      data: {
        availableSeats: { decrement: seatNumbers.length }
      }
    });
    
    return reservations;
  });
}
```

#### Redis-Based Seat Lock (Optional - High Volume)
```typescript
// For high-traffic scenarios
class SeatLockManager {
  private redis: Redis;
  private lockTTL = 300; // 5 minutes
  
  async acquireSeatLock(scheduleId: number, seatNumber: string): Promise<boolean> {
    const key = `seat:lock:${scheduleId}:${seatNumber}`;
    const acquired = await this.redis.set(key, '1', 'EX', this.lockTTL, 'NX');
    return acquired !== null;
  }
  
  async releaseSeatLock(scheduleId: number, seatNumber: string): Promise<void> {
    const key = `seat:lock:${scheduleId}:${seatNumber}`;
    await this.redis.del(key);
  }
  
  async withSeatLock<T>(
    scheduleId: number, 
    seatNumbers: string[], 
    callback: () => Promise<T>
  ): Promise<T> {
    // Try to acquire all locks
    const locks = await Promise.all(
      seatNumbers.map(seat => this.acquireSeatLock(scheduleId, seat))
    );
    
    if (!locks.every(locked => locked)) {
      // Release acquired locks
      await Promise.all(
        seatNumbers.map(seat => this.releaseSeatLock(scheduleId, seat))
      );
      throw new Error('Could not acquire seat locks - seats may be in use');
    }
    
    try {
      return await callback();
    } finally {
      // Always release locks
      await Promise.all(
        seatNumbers.map(seat => this.releaseSeatLock(scheduleId, seat))
      );
    }
  }
}
```

#### Real-Time Seat Updates (WebSocket)
```typescript
// Broadcast seat availability changes
async function updateSeatAvailability(scheduleId: number) {
  const availableSeats = await getAvailableSeats(scheduleId);
  
  // Broadcast to all clients viewing this schedule
  io.to(`schedule:${scheduleId}`).emit('seats:updated', {
    scheduleId,
    availableSeats,
    timestamp: new Date()
  });
}
```

#### Mobile App: Seat Locking Flow
```typescript
// When user selects seats
async function selectSeats(scheduleId: number, seats: string[]) {
  // 1. Request temporary lock (30 seconds)
  const lockResponse = await api.post('/bookings/lock-seats', {
    scheduleId,
    seats,
    ttl: 30
  });
  
  if (!lockResponse.success) {
    showError('These seats are no longer available');
    return;
  }
  
  // 2. Start countdown timer
  startSeatLockTimer(30, () => {
    showWarning('Seat selection expiring soon!');
  });
  
  // 3. User proceeds to payment
  // Locks auto-released if payment not completed in 30s
}
```

**Priority**: Critical  
**Complexity**: Medium  
**Estimated Time**: 4-5 days  
**Testing Required**: Concurrent booking stress tests

---

## 8. COMPREHENSIVE BOOKING & BUS MANAGER

### Overview
Combine all the above features into a unified management interface for TransConnect Managers.

#### Features
1. **Live Dashboard**
   - Real-time bookings by route
   - Bus utilization metrics
   - Dynamic pool status
   - Transfer requests pending
   
2. **Booking Management**
   - Search any booking
   - View booking history
   - Initiate transfers
   - Process refunds
   - Handle cancellations

3. **Bus Assignment**
   - View available buses
   - Assign to dynamic pools
   - Handle last-minute changes
   - Track maintenance schedules

4. **Seat Inventory**
   - Real-time seat maps for all schedules
   - Double-booking alerts
   - Capacity forecasting
   - Overbooking management (if permitted)

5. **Reporting**
   - Daily booking reports
   - Revenue by route
   - Operator performance
   - Transfer statistics

#### Tech Stack for Manager UI
- React Admin Dashboard (existing)
- Real-time updates via Socket.io
- Data visualization with Chart.js
- Export reports to Excel/PDF

**Priority**: High  
**Complexity**: High (Integration of all features)  
**Estimated Time**: 14-21 days  
**Dependencies**: All sections above

---

---

## REVISED IMPLEMENTATION ROADMAP

### Phase 1: Critical Route & Booking Fixes (4 weeks) - **TOP PRIORITY**
**Goal**: Fix production issues blocking bookings and enable stopover functionality

1. **Week 1-2: Route Segments & Stopover Search**
   - [ ] Stopover as searchable destinations (Section 3)
   - [ ] Route segments pricing with date-based variations (Section 4)
   - [ ] Database migrations (zero-downtime)
   - [ ] API updates for segment search
   - [ ] Admin UI for segment management

2. **Week 3: Route Automation & Double-Booking Prevention**
   - [ ] Automated distance/duration calculation (Section 2)
   - [ ] Google Maps integration
   - [ ] Double-booking prevention with overbooking support (Section 7)
   - [ ] 5-10% overbooking buffer (configurable)

3. **Week 4: Transfer System & User Roles**
   - [ ] Booking transfer system (Section 5)
   - [ ] TransConnect Manager role (Section 2)
   - [ ] Testing and bug fixes
   - [ ] Training materials creation

**Deliverables**: Production-ready stopover search, automated routing, transfer system

### Phase 2: Dynamic Scheduling (2 weeks) - **OPTIONAL**
**Goal**: Enable on-demand bus allocation (if time permits)

1. **Week 5-6**
   - [ ] Dynamic route pool system (Section 6)
   - [ ] Provisional booking workflow
   - [ ] Auto-assignment logic
   - [ ] Admin UI for dynamic management

**Deliverables**: Flexible scheduling for on-demand operators

### Phase 3: Phone Authentication (2 weeks)
**Goal**: Improve mobile app UX with OTP login

1. **Week 7**
   - [ ] Phone OTP backend API (Section 1)
   - [ ] eSMS Africa integration (already configured)
   - [ ] Rate limiting and security

2. **Week 8**
   - [ ] Mobile UI for phone login
   - [ ] OTP verification screens
   - [ ] Testing and deployment

**Deliverables**: Phone + OTP authentication live

### Phase 4: Manager Dashboard (3 weeks)
**Goal**: Unified management interface

1. **Week 9-10**
   - [ ] Manager dashboard design
   - [ ] Real-time updates
   - [ ] Reporting and analytics

2. **Week 11**
   - [ ] User acceptance testing
   - [ ] Training videos
   - [ ] Production deployment

**Deliverables**: Complete Booking & Bus Manager system

**Total Timeline**: 11 weeks (can be compressed to 8 weeks if Phase 2 skipped)

---

## RISK ASSESSMENT

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration issues | High | Medium | Test on staging, rollback plan |
| Performance degradation with segments | Medium | Medium | Optimize queries, add indexes |
| Race conditions in seat booking | High | Low | Transaction locks, Redis backup |
| API breaking changes | High | Low | Version APIs, backwards compatibility |
| Google Maps API costs | Low | Medium | Cache aggressively, monitor usage |

### Operational Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Field team resistance to new UI | Medium | Medium | Training, gradual rollout |
| Customer confusion with transfers | Medium | Low | Clear communications, support ready |
| Dynamic scheduling complexity | High | Medium | Start with pilot operators |
| Price calculation errors | High | Low | Extensive testing, manual override option |

---

## COST ESTIMATES

### Development Costs
- Senior Developer (11-12 weeks): $25,000 - $35,000
- QA Testing (3 weeks): $6,000 - $9,000
- DevOps/Infrastructure: $2,000 - $3,000

### Infrastructure Costs (Monthly)
- SMS Service (eSMS Africa): $180-250 (40% cheaper with eSMS)
- Google Maps Distance Matrix API: $50-200
- Redis for seat locking (optional): $15-30
- Additional database resources: $20-50
- Increased server capacity: $50-100
- **Staging environment**: $30-50 (required for testing)

**Total Estimated Cost**: $33,000 - $47,000 + $345-680/month ongoing

---

## SUCCESS METRICS

### Phase 1 Success Criteria
- [ ] Route creation time reduced by 70% (no manual distance entry)
- [ ] Stopover searches return results 100% of the time
- [ ] Zero double-booking incidents
- [ ] Booking transfers completed within 5 minutes average
- [ ] 95% customer satisfaction with transfer process

### Phase 2 Success Criteria
- [ ] 30% of operators using dynamic scheduling
- [ ] Average bus utilization increased by 15%
- [ ] Provisional bookings converted to confirmed within 24 hours
- [ ] Zero payment issues with dynamic bookings

### Phase 3 Success Criteria
- [ ] Manager dashboard used daily by 100% of staff
- [ ] Booking management tasks completed 50% faster
- [ ] 95% accuracy in automated bus assignments
- [ ] Weekly reports generated automatically

---

## QUESTIONS FOR REVIEW

### ✅ ANSWERED (January 28, 2026)

1. **Phone Authentication**: ✅ **Use eSMS Africa** (already configured for agent signup - 80% cheaper than Twilio)

2. **SMS Costs**: ✅ **Approved** - ~$300/month with smart caching and rate limiting

3. **Stopover Pricing**: ✅ **YES** - Operators can set different prices for same segment on different dates (weekend premium, holidays, etc.)

4. **Dynamic Scheduling**: ✅ **Not a priority** - Will implement in Phase 2, minimum thresholds to be determined by operators

5. **Transfer Policy**: ✅ **To be determined** - Will design flexible policy system allowing per-case decisions

6. **Double Booking**: ✅ **Allow overbooking** - Use standard transportation industry practice (5-10% buffer, configurable per operator)

7. **Priority**: ✅ **REVISED ORDER**:
   - **Phase 1 (Weeks 1-4)**: Stopover fixes, route segments, distance calculation, transfers
   - **Phase 2 (Weeks 5-6)**: Dynamic scheduling (optional)
   - **Phase 3 (Weeks 7-8)**: Phone OTP authentication
   - **Phase 4 (Weeks 9-11)**: Manager dashboard

8. **Testing**: ✅ **Staging environment needed** - Will set up staging environment mirroring production

9. **Training**: ✅ **Required** - Create training materials/videos for field team

10. **Migration**: ✅ **Zero-downtime approach** - Production has live data, no maintenance windows allowed

---

## REVISED IMPLEMENTATION ROADMAP

---

## TRAINING & DEPLOYMENT STRATEGY

### Training Materials Required

#### 1. Admin Dashboard Training
**Target Audience**: TransConnect Managers, Operators

**Videos to Create** (15-20 min each):
- [ ] Route Segment Management - Adding and pricing stopovers
- [ ] Dynamic Pricing Setup - Weekend/holiday premiums
- [ ] Booking Transfer Process - Step-by-step workflow
- [ ] Bus Assignment - Dynamic scheduling
- [ ] Reports & Analytics - Using the dashboard

**Written Guides**:
- [ ] Quick reference cards (PDF, 1-2 pages each)
- [ ] FAQ document
- [ ] Troubleshooting guide

#### 2. Mobile App Training
**Target Audience**: Field agents, customer support

**Content**:
- [ ] Video: Searching routes with stopovers
- [ ] Video: Handling booking transfers
- [ ] Guide: Common customer issues and resolutions

#### 3. Technical Documentation
**Target Audience**: Developers, system administrators

**Content**:
- [ ] API documentation updates
- [ ] Database schema changes
- [ ] Deployment procedures
- [ ] Rollback procedures

**Delivery Method**:
- Host videos on YouTube (unlisted)
- Create internal knowledge base
- Live training sessions (recorded)
- Office hours for Q&A

### Staging Environment Setup

#### Infrastructure Requirements
```yaml
# Staging Environment Specifications
Database:
  - PostgreSQL 14+ (separate instance)
  - Clone of production schema
  - Anonymized test data (500+ routes, 1000+ bookings)
  
Backend:
  - Node.js server on Render/Railway
  - Separate environment variables
  - Connected to staging database
  - eSMS Africa test credentials
  
Frontend:
  - Admin dashboard (staging subdomain)
  - Mobile app (staging build)
  
Monitoring:
  - Error tracking (Sentry staging project)
  - Log aggregation
  - Performance monitoring
```

#### Setup Steps
1. **Database Setup** (Week 1)
   - Create staging database on Render
   - Copy production schema
   - Generate test data with faker.js
   - Set up daily backup

2. **Backend Deployment** (Week 1)
   - Deploy to staging.transconnect.com
   - Configure environment variables
   - Set up CI/CD pipeline
   - Enable debug logging

3. **Admin Dashboard** (Week 1)
   - Deploy to admin-staging.transconnect.com
   - Point to staging API
   - Configure test accounts

4. **Mobile App** (Week 2)
   - Create staging build profile in EAS
   - Distribute via TestFlight/Internal Testing
   - Configure staging API endpoint

#### Testing Protocol
```markdown
Pre-Deployment Checklist:
[ ] All automated tests passing
[ ] Manual smoke tests completed
[ ] Staging environment validated
[ ] Database migration rehearsed
[ ] Rollback plan documented
[ ] Monitoring alerts configured
[ ] Support team notified
[ ] Training materials updated
```

**Cost**: $30-50/month for staging infrastructure

---

## NEXT STEPS

1. ✅ **Review completed** - All questions answered
2. **Approve budget** - $33K-47K development + $345-680/month
3. **Set up staging environment** - Week 1 priority
4. **Create eSMS integration** - Reuse existing service
5. **Begin Phase 1** - Stopover & route fixes (Weeks 1-4)

---

**Document Owner**: GitHub Copilot  
**Reviewers**: [To be assigned]  
**Approval Date**: [Pending review]  
**Start Date**: [After approval]

