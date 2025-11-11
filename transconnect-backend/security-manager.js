#!/usr/bin/env node

/**
 * TransConnect Security Utility
 * Helps manage secure credentials and token rotation
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class SecurityManager {
  constructor() {
    this.envPath = path.join(__dirname, '.env');
    this.examplePath = path.join(__dirname, '.env.example');
  }

  // Generate secure random secrets
  generateJWTSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateWebhookSecret() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Password strength checker
  checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score < 3 ? 'Weak' : score < 4 ? 'Medium' : 'Strong';
    
    return { score, strength, checks };
  }

  // Mask sensitive data for display
  maskSecret(secret) {
    if (!secret || secret.length < 4) return '***';
    return secret.substring(0, 2) + '*'.repeat(secret.length - 4) + secret.substring(secret.length - 2);
  }

  // Check if .env file exists and has sensitive data
  checkEnvSecurity() {
    if (!fs.existsSync(this.envPath)) {
      console.log('✅ No .env file found - good for security');
      return;
    }

    const content = fs.readFileSync(this.envPath, 'utf8');
    const issues = [];

    // Check for common insecure patterns
    if (content.includes('password123')) issues.push('Default passwords detected');
    if (content.includes('your-')) issues.push('Template placeholders not replaced');
    if (content.includes('test-')) issues.push('Test credentials detected');
    if (content.includes('localhost')) issues.push('Development URLs in production');

    if (issues.length > 0) {
      console.log('⚠️  Security issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ .env file appears secure');
    }

    return issues;
  }

  // Interactive credential setup
  async setupCredentials() {
    console.log('\n🔐 TransConnect Secure Credential Setup\n');
    
    const credentials = {};

    // JWT Secret
    console.log('1. JWT Secret Configuration');
    const useGeneratedJWT = await this.ask('Generate secure JWT secret automatically? (y/n): ');
    if (useGeneratedJWT.toLowerCase() === 'y') {
      credentials.JWT_SECRET = this.generateJWTSecret();
      console.log(`Generated JWT secret: ${this.maskSecret(credentials.JWT_SECRET)}`);
    } else {
      credentials.JWT_SECRET = await this.ask('Enter JWT secret (min 32 chars): ');
    }

    // Database URL
    console.log('\n2. Database Configuration');
    credentials.DATABASE_URL = await this.ask('Enter database URL: ');

    // Email Configuration
    console.log('\n3. Email Configuration');
    credentials.SMTP_HOST = await this.ask('SMTP Host (smtp.titan.email): ') || 'smtp.titan.email';
    credentials.SMTP_PORT = await this.ask('SMTP Port (465): ') || '465';
    credentials.SMTP_USER = await this.ask('Email address: ');
    credentials.SMTP_PASS = await this.ask('Email password/app-password: ');

    // Payment Configuration
    console.log('\n4. Payment Gateway Configuration');
    const setupFlutterwave = await this.ask('Setup Flutterwave? (y/n): ');
    if (setupFlutterwave.toLowerCase() === 'y') {
      credentials.FLUTTERWAVE_PUBLIC_KEY = await this.ask('Flutterwave public key: ');
      credentials.FLUTTERWAVE_SECRET_KEY = await this.ask('Flutterwave secret key: ');
    }

    // Generate .env file
    await this.generateEnvFile(credentials);
    console.log('\n✅ Credentials configured successfully!');
    console.log('🔒 Remember to:');
    console.log('   - Keep credentials secure');
    console.log('   - Never commit .env to version control');
    console.log('   - Rotate tokens regularly');
    console.log('   - Use environment variables in production');
  }

  async generateEnvFile(credentials) {
    const envContent = `# TransConnect MVP1 - Generated Environment Configuration
# Generated on: ${new Date().toISOString()}
# NEVER commit this file to version control

# Database Configuration
DATABASE_URL="${credentials.DATABASE_URL}"

# JWT Security
JWT_SECRET="${credentials.JWT_SECRET}"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration
SMTP_HOST="${credentials.SMTP_HOST}"
SMTP_PORT=${credentials.SMTP_PORT}
SMTP_SECURE=true
SMTP_USER="${credentials.SMTP_USER}"
SMTP_PASS="${credentials.SMTP_PASS}"

# Legacy Email Config
EMAIL_HOST="${credentials.SMTP_HOST}"
EMAIL_PORT=${credentials.SMTP_PORT}
EMAIL_USER="${credentials.SMTP_USER}"
EMAIL_PASS="${credentials.SMTP_PASS}"

# Payment Configuration
${credentials.FLUTTERWAVE_PUBLIC_KEY ? `FLUTTERWAVE_PUBLIC_KEY="${credentials.FLUTTERWAVE_PUBLIC_KEY}"` : '# FLUTTERWAVE_PUBLIC_KEY=your-public-key'}
${credentials.FLUTTERWAVE_SECRET_KEY ? `FLUTTERWAVE_SECRET_KEY="${credentials.FLUTTERWAVE_SECRET_KEY}"` : '# FLUTTERWAVE_SECRET_KEY=your-secret-key'}

# External Services
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Security Keys
PAYMENT_ENCRYPTION_KEY="${this.generateEncryptionKey()}"
WEBHOOK_SECRET="${this.generateWebhookSecret()}"
`;

    fs.writeFileSync(this.envPath, envContent);
  }

  // Token rotation utility
  async rotateTokens() {
    console.log('\n🔄 Token Rotation Utility\n');
    
    console.log('Available tokens to rotate:');
    console.log('1. JWT Secret');
    console.log('2. Encryption Keys'); 
    console.log('3. Webhook Secrets');
    console.log('4. All tokens');
    
    const choice = await this.ask('Select option (1-4): ');
    
    switch(choice) {
      case '1':
        console.log('New JWT Secret:', this.generateJWTSecret());
        break;
      case '2':
        console.log('New Encryption Key:', this.generateEncryptionKey());
        break;
      case '3':
        console.log('New Webhook Secret:', this.generateWebhookSecret());
        break;
      case '4':
        console.log('New JWT Secret:', this.generateJWTSecret());
        console.log('New Encryption Key:', this.generateEncryptionKey());
        console.log('New Webhook Secret:', this.generateWebhookSecret());
        break;
      default:
        console.log('Invalid option');
    }
    
    console.log('\n⚠️  Remember to update your environment variables and restart the application!');
  }

  // Security audit
  async auditSecurity() {
    console.log('\n🔍 Security Audit Report\n');
    
    // Check .env file
    const envIssues = this.checkEnvSecurity();
    
    // Check for exposed files
    const sensitiveFiles = [
      '.env',
      'firebase-service-account.json',
      'google-services.json',
      'private-keys/',
      'certificates/'
    ];
    
    console.log('\n📁 File Security Check:');
    sensitiveFiles.forEach(file => {
      const exists = fs.existsSync(path.join(__dirname, file));
      if (exists) {
        console.log(`⚠️  ${file} - ensure it's in .gitignore`);
      } else {
        console.log(`✅ ${file} - not found (good)`);
      }
    });
    
    // Generate security recommendations
    console.log('\n📋 Security Recommendations:');
    console.log('✅ Use strong, unique passwords for all services');
    console.log('✅ Enable 2FA on all service accounts');
    console.log('✅ Rotate tokens monthly');
    console.log('✅ Use environment variables in production');
    console.log('✅ Monitor for failed authentication attempts');
    console.log('✅ Regular security audits');
  }

  ask(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  async run() {
    console.log('🔐 TransConnect Security Manager');
    console.log('================================\n');
    
    console.log('1. Setup Credentials');
    console.log('2. Rotate Tokens');
    console.log('3. Security Audit');
    console.log('4. Generate Secrets');
    console.log('5. Exit');
    
    const choice = await this.ask('\nSelect option (1-5): ');
    
    switch(choice) {
      case '1':
        await this.setupCredentials();
        break;
      case '2':
        await this.rotateTokens();
        break;
      case '3':
        await this.auditSecurity();
        break;
      case '4':
        console.log('\n🔑 Generated Secrets:');
        console.log('JWT Secret:', this.generateJWTSecret());
        console.log('Encryption Key:', this.generateEncryptionKey());
        console.log('Webhook Secret:', this.generateWebhookSecret());
        break;
      case '5':
        console.log('👋 Goodbye!');
        break;
      default:
        console.log('Invalid option');
    }
    
    rl.close();
  }
}

// Run the security manager
if (require.main === module) {
  const manager = new SecurityManager();
  manager.run().catch(console.error);
}

module.exports = SecurityManager;