import crypto from 'crypto';

// In-memory OTP store for demo purposes
// In production, use Redis or database
const otpStore = new Map<string, { otp: string; expiry: number }>();

type OtpChannel = 'phone' | 'email';

function makeOtpKey(identifier: string, channel: OtpChannel = 'phone'): string {
  const normalizedIdentifier = channel === 'email'
    ? identifier.trim().toLowerCase()
    : identifier.trim();
  return `${channel}:${normalizedIdentifier}`;
}

export async function sendOtpForIdentifier(identifier: string, channel: OtpChannel = 'phone'): Promise<{ otp: string; expiry: number }> {
  const key = makeOtpKey(identifier, channel);

  // In demo mode, use a fixed OTP for easier testing
  const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';
  const otp = isDemoMode ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + (parseInt(process.env.OTP_EXPIRY || '600') * 1000); // 10 minutes default

  otpStore.set(key, { otp, expiry });

  // Log for development/debugging
  if (isDemoMode) {
    console.log(`🧪 [DEMO MODE] Fixed OTP for ${channel}:${identifier}: ${otp} (expires in ${process.env.OTP_EXPIRY || '600'} seconds)`);
    console.log('💡 Use OTP: 123456 for all OTP checks in demo mode');
  } else {
    console.log(`OTP generated for ${channel}:${identifier}: ${otp} (expires in ${process.env.OTP_EXPIRY || '600'} seconds)`);
  }

  return { otp, expiry };
}

export async function verifyOtpCodeForIdentifier(identifier: string, otp: string, channel: OtpChannel = 'phone'): Promise<boolean> {
  const key = makeOtpKey(identifier, channel);
  const stored = otpStore.get(key);
  if (!stored) return false;

  if (Date.now() > stored.expiry) {
    otpStore.delete(key);
    return false;
  }

  if (stored.otp === otp) {
    otpStore.delete(key);
    return true;
  }

  return false;
}

export async function sendOtp(phone: string): Promise<{ otp: string; expiry: number }> {
  return sendOtpForIdentifier(phone, 'phone');
}

export async function verifyOtpCode(phone: string, otp: string): Promise<boolean> {
  return verifyOtpCodeForIdentifier(phone, otp, 'phone');
}

export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}