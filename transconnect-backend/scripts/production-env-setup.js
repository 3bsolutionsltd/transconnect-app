#!/usr/bin/env node

/**
 * Production Environment Setup Guide
 * For TransConnect Backend on Render
 */

console.log('🚀 TRANSCONNECT PRODUCTION ENVIRONMENT SETUP');
console.log('=' + '='.repeat(50));
console.log('');

console.log('📋 REQUIRED ENVIRONMENT VARIABLES FOR RENDER:');
console.log('');

console.log('🔐 DATABASE:');
console.log('DATABASE_URL=postgresql://[your-render-postgres-url]');
console.log('');

console.log('🔑 JWT & SECURITY:');
console.log('JWT_SECRET=' + generateSecureSecret());
console.log('');

console.log('📱 eSMS AFRICA (Primary SMS for Africa):');
console.log('ESMS_AFRICA_ACCOUNT_ID=2057');
console.log('ESMS_AFRICA_API_KEY=a323393abcfd0');
console.log('ESMS_AFRICA_SENDER_ID=eSMSAfrica');
console.log('');

console.log('📲 TWILIO (Fallback SMS):');
console.log('TWILIO_ACCOUNT_SID=AC[your-twilio-sid]');
console.log('TWILIO_AUTH_TOKEN=[your-twilio-token]');
console.log('TWILIO_PHONE_NUMBER=[your-twilio-number]');
console.log('');

console.log('📧 EMAIL SMTP (Email OTP Fallback):');
console.log('SMTP_HOST=smtp.gmail.com');
console.log('SMTP_PORT=587');
console.log('SMTP_USER=your-email@gmail.com');
console.log('SMTP_PASS=[your-app-password]');
console.log('');

console.log('🌍 ENVIRONMENT:');
console.log('NODE_ENV=production');
console.log('PORT=5000');
console.log('DEMO_MODE=false  # Set to true for testing');
console.log('');

console.log('🔧 RENDER DEPLOYMENT STEPS:');
console.log('');
console.log('1. Go to Render Dashboard → Your Service');
console.log('2. Click "Environment" tab');
console.log('3. Add each variable above (name=value)');
console.log('4. Click "Save Changes"');
console.log('5. Service will auto-redeploy');
console.log('6. Check logs for "eSMS Africa: ✅ Ready"');
console.log('');

console.log('✅ VERIFICATION CHECKLIST:');
console.log('□ Database connected');
console.log('□ eSMS Africa configured'); 
console.log('□ Twilio configured (fallback)');
console.log('□ Email SMTP configured');
console.log('□ JWT secret set');
console.log('□ DEMO_MODE set correctly');
console.log('');

console.log('🧪 TEST AFTER DEPLOYMENT:');
console.log('1. Try agent registration with +256 number');
console.log('2. Check logs for "eSMS Africa" in routing');
console.log('3. Verify SMS cost shows "UGX 30"');
console.log('4. Confirm fallback works if needed');
console.log('');

console.log('💡 TROUBLESHOOTING:');
console.log('If eSMS still shows "Not configured":');
console.log('1. Double-check variable names (exact spelling)');
console.log('2. Ensure no extra spaces in values');
console.log('3. Restart the service manually');
console.log('4. Check build logs for errors');

function generateSecureSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}