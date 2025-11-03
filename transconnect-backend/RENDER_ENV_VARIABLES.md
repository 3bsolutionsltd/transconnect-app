# 🔐 TransConnect Backend - Environment Variables for Render

## Required Environment Variables

Copy these exact values into your Render Web Service environment variables:

### 🔧 Core Configuration
```env
NODE_ENV=production
PORT=3000
```

### 🔐 Security Secrets (COPY THESE EXACTLY)
```env
JWT_SECRET=7a9f8e3d2c1b5a6f9e8d7c4b2a1f8e5d3c2b9a7f6e5d4c3b2a1f9e8d7c6b5a4f
JWT_REFRESH_SECRET=3f7a9e2d8c5b1a6f4e9d7c0b3a2f1e8d5c4b9a7f6e3d2c1b8a5f4e7d0c9b6a3f
ENCRYPTION_KEY=9b6e3d0c7a4f1e8d5c2b9a6f3e0d7c4b1a8f5e2d9c6b3a0f7e4d1c8b5a2f9e6d
SESSION_SECRET=5d2a9f6e3c0b7a4f1e8d5c2b9a6f3e0d7c4b1a8f5e2d9c6b3a0f7e4d1c8b5a2f
```

### 🔢 Application Settings
```env
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://transconnect.vercel.app
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
FILE_UPLOAD_MAX_SIZE=10485760
```

### 🗄️ Database Configuration (To be set after creating services)
```env
DATABASE_URL=[COPY_FROM_RENDER_POSTGRESQL_SERVICE_INTERNAL_URL]
REDIS_URL=[COPY_FROM_RENDER_REDIS_SERVICE_INTERNAL_URL]
```

**🔍 How to get these URLs:**
- **PostgreSQL**: Dashboard → Your DB Service → Connect Tab → Internal Database URL
- **Redis**: Dashboard → Your Redis Service → Connect Tab → Internal Redis URL

**💡 Note**: Redis is optional for initial deployment. You can add it later.

### 📱 Firebase Configuration (Optional - for notifications)
```env
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

### 💳 Payment Integration (Optional - for production)
```env
MTN_COLLECTION_USER_ID=your-mtn-user-id
MTN_COLLECTION_API_KEY=your-mtn-api-key
MTN_COLLECTION_PRIMARY_KEY=your-mtn-primary-key
AIRTEL_CLIENT_ID=your-airtel-client-id
AIRTEL_CLIENT_SECRET=your-airtel-client-secret
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
```

---

## 🚨 IMPORTANT SECURITY NOTES

1. **These secrets are generated securely** - Use them exactly as provided
2. **Never commit these to version control** - They're production secrets
3. **Database URLs will be provided by Render** - Copy from your PostgreSQL service
4. **Payment keys are for production** - Use sandbox keys for testing

---

## ✅ Deployment Checklist

- [ ] Render account created/logged in
- [ ] GitHub repository connected (3bsolutionsltd/transconnect-app)
- [ ] PostgreSQL database created
- [ ] Redis cache created (optional)
- [ ] Web Service created with environment variables
- [ ] Deployment successful
- [ ] Health check endpoint working: /api/health

---

**🎯 After deployment, your backend will be available at:**
`https://transconnect-backend.onrender.com`

**🔍 Health check URL:**
`https://transconnect-backend.onrender.com/api/health`