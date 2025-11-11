# Environment Configuration Security Guide

## 🔐 Secure Token Management for TransConnect MVP1

### Current Security Issues:
- Sensitive credentials stored in plain text .env file
- Email passwords, API keys, and tokens exposed
- No encryption or secure storage implemented

### Recommended Security Measures:

## 1. Environment Variable Security

### Production Environment Variables (Render/Railway)
```bash
# Database (Use connection string from hosting provider)
DATABASE_URL=postgresql://user:pass@hostname:port/database

# JWT Secret (Generate strong random secret)
JWT_SECRET=your-super-secure-random-jwt-secret-256-chars-long

# Email Configuration (Use app-specific passwords)
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=transconnect@omande.net
SMTP_PASS=your-app-specific-password

# Payment APIs (Use production keys)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-production-public-key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your-production-secret-key
MTN_API_KEY=your-production-mtn-api-key
AIRTEL_API_KEY=your-production-airtel-api-key

# External Services
GOOGLE_MAPS_API_KEY=your-restricted-google-maps-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

## 2. Local Development Security

### Use .env.local for sensitive development data
### Add .env.local to .gitignore (never commit sensitive data)

## 3. Production Deployment Security

### Platform Environment Variables:
- **Render**: Dashboard → Environment Variables
- **Railway**: Dashboard → Variables tab  
- **Vercel**: Dashboard → Settings → Environment Variables

### Security Best Practices:
1. **Never commit .env files** with real credentials
2. **Use app-specific passwords** for email accounts
3. **Rotate tokens regularly** (monthly/quarterly)
4. **Restrict API key permissions** to minimum required
5. **Use strong, unique passwords** for each service
6. **Enable 2FA** on all service accounts

## 4. Token Rotation Schedule

### Monthly:
- [ ] JWT Secret rotation
- [ ] Database password update
- [ ] Email app password renewal

### Quarterly:
- [ ] Payment gateway key rotation
- [ ] Google Maps API key refresh
- [ ] SMS service token update

## 5. Access Control

### Development Team Access:
- Limit who has access to production credentials
- Use separate staging/development keys
- Implement proper user roles and permissions

### Service Account Security:
- Create dedicated service accounts for each integration
- Use minimum required permissions
- Regular security audits

## 6. Monitoring & Alerts

### Setup alerts for:
- Failed authentication attempts
- Unusual API usage patterns
- Token expiration warnings
- Security breach indicators

## 7. Backup & Recovery

### Secure credential backup:
- Store encrypted backups of critical tokens
- Document recovery procedures
- Test recovery process regularly

---

**⚠️ IMMEDIATE ACTION REQUIRED:**
1. Change all passwords shown in committed .env files
2. Generate new API keys for all services
3. Setup proper environment variables in hosting platform
4. Remove sensitive data from version control history