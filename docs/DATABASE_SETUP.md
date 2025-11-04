# Production Database Setup Guide

## 🗄️ Render PostgreSQL Configuration

### Step 1: Get Database Connection URL

1. **Access Render Dashboard**: https://dashboard.render.com
2. **Find your `transconnect-db` service**
3. **Copy the DATABASE_URL** from the service info

The URL format will be:
```
postgresql://username:password@hostname:5432/database_name
```

### Step 2: Configure Environment Variables

In your `transconnect-app` service on Render:

1. Go to **Environment** tab
2. Add these variables:

```bash
# Database
DATABASE_URL=postgresql://transconnect_user:yTYkYJYUaYCIm5iVME6jonZPG2AcKAy3@dpg-d44cvgje5dus73b21l70-a/transconnect_r162

# Security
JWT_SECRET=7a9f8e3d2c1b5a6f9e8d7c4b2a1f8e5d3c2b9a7f6e5d4c3b2a1f9e8d7c6b5a4f
BCRYPT_ROUNDS=12
NODE_ENV=production

# Optional Services (add when ready)
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_PRIVATE_KEY=your_firebase_key
FIREBASE_CLIENT_EMAIL=your_firebase_email

# Payment APIs (sandbox for testing)
MTN_MOMO_API_KEY=your_mtn_sandbox_key
AIRTEL_MONEY_API_KEY=your_airtel_sandbox_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_sandbox_key
```

### Step 3: Database Schema Deployment

**Option A: Automatic (Recommended)**
The database schema will be automatically created when your service restarts with the new DATABASE_URL.

**Option B: Manual Setup**
If you need to run migrations manually:

```bash
# On your local machine with DATABASE_URL set
npm run db:deploy

# Or using the setup script
node scripts/setup-production-db.js
```

### Step 4: Verify Database Connection

1. **Restart your Render service** after adding DATABASE_URL
2. **Check the logs** for successful database connection
3. **Test the health endpoint**: https://transconnect-app-44ie.onrender.com/health

Expected log output:
```
✅ Database connected successfully
🚀 TransConnect Backend server running on 0.0.0.0:3000
```

## 🔧 Database Schema Overview

Your production database will include these tables:
- `User` - Passenger and operator accounts
- `Operator` - Bus company information
- `Bus` - Vehicle fleet data
- `Route` - Travel routes and schedules
- `Booking` - Ticket reservations
- `Payment` - Transaction records
- `QRTicket` - Digital tickets
- `Ride` - Ride connector data
- `Notification` - Push notification logs

## 📊 Connection Pooling & Performance

Your Prisma setup includes:
- **Connection pooling**: Automatic via Prisma
- **Connection limits**: Configured for production load
- **Query optimization**: Indexed fields for performance
- **Backup strategy**: Render automatic backups

## 🔐 Security Features

- **SSL/TLS**: Enforced connections
- **Encrypted passwords**: bcrypt hashing
- **JWT tokens**: Secure authentication
- **Input validation**: SQL injection prevention
- **Rate limiting**: API protection

## 🚨 Emergency Procedures

### Database Recovery
```bash
# Restore from backup (if needed)
# Contact Render support for backup restoration

# Reset database (CAUTION: This will delete all data)
npx prisma db push --force-reset
```

### Connection Issues
1. Verify DATABASE_URL format
2. Check PostgreSQL service status in Render
3. Verify network connectivity
4. Review Render service logs

## 📞 Next Steps After Database Setup

1. ✅ Verify database connection and schema
2. 🔧 Test API endpoints with production data
3. 🌐 Deploy frontend applications
4. 💳 Configure payment integrations
5. 🔍 Set up monitoring and logging

---

**Support**: If you encounter issues, check Render service logs and the health endpoint for diagnostic information.