import crypto from 'crypto';

// In-memory OTP store for demo purposes
// In production, use Redis or database
const otpStore = new Map<string, { otp: string; expiry: number }>();

export async function sendOtp(phone: string): Promise<void> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + (parseInt(process.env.OTP_EXPIRY || '300') * 1000);
  
  otpStore.set(phone, { otp, expiry });
  
  // In production, integrate with SMS gateway
  console.log(`OTP for ${phone}: ${otp}`);
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