import crypto from 'crypto';

// In-memory OTP store for demo purposes
// In production, use Redis or database
const otpStore = new Map<string, { otp: string; expiry: number }>();

export async function sendOtp(phone: string): Promise<{ otp: string; expiry: number }> {
  // In demo mode, use a fixed OTP for easier testing
  const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';
  const otp = isDemoMode ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + (parseInt(process.env.OTP_EXPIRY || '600') * 1000); // 10 minutes default
  
  otpStore.set(phone, { otp, expiry });
  
  // Log for development/debugging
  if (isDemoMode) {
    console.log(`🧪 [DEMO MODE] Fixed OTP for ${phone}: ${otp} (expires in ${process.env.OTP_EXPIRY || '600'} seconds)`);
    console.log('💡 Use OTP: 123456 for all agent logins in demo mode');
  } else {
    console.log(`OTP generated for ${phone}: ${otp} (expires in ${process.env.OTP_EXPIRY || '600'} seconds)`);
  }
  
  return { otp, expiry };
}

export async function verifyOtpCode(phone: string, otp: string): Promise<boolean> {
  const stored = otpStore.get(phone);
  if (!stored) return false;
  
  if (Date.now() > stored.expiry) {
    otpStore.delete(phone);
    return false;
  }
  
  if (stored.otp === otp) {
    otpStore.delete(phone);
    return true;
  }
  
  return false;
}

export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}