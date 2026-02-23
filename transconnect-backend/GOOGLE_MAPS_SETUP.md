# Google Maps Distance Matrix API Setup Guide

**Date**: January 30, 2026  
**Purpose**: Enable automatic distance and duration calculation for routes  
**Cost**: ~$0.005 per calculation (very affordable)

---

## 📋 Prerequisites

- Google Account
- Credit/Debit card for billing (required even for free tier)
- Access to [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**  
   Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click the project dropdown at the top
   - Click **"New Project"**
   - Enter project name: `TransConnect MVP1`
   - Click **"Create"**

3. **Wait for project creation** (takes 10-30 seconds)

---

### Step 2: Enable Distance Matrix API

1. **Go to APIs & Services**
   - From the hamburger menu (☰), select **"APIs & Services"** → **"Library"**
   - Or visit: https://console.cloud.google.com/apis/library

2. **Search for Distance Matrix API**
   - Type "Distance Matrix API" in the search bar
   - Click on **"Distance Matrix API"**

3. **Enable the API**
   - Click the blue **"Enable"** button
   - Wait for activation (~10 seconds)

4. **Verify Activation**
   - You should see "API enabled" confirmation
   - Go to **"APIs & Services"** → **"Enabled APIs & services"** to confirm

---

### Step 3: Set Up Billing (Required)

⚠️ **Note**: Even though there's a free tier, you MUST set up billing to use the API.

1. **Go to Billing**
   - Click hamburger menu → **"Billing"**
   - Click **"Link a billing account"** or **"Create billing account"**

2. **Enter Payment Information**
   - Country
   - Credit/Debit card details
   - Billing address

3. **Free Tier Benefits**
   - **$200 free credit** for new accounts (valid for 90 days)
   - **$200/month free usage** for Maps Platform
   - Distance Matrix API: First **40,000 calls per month FREE**
   - After free tier: **$5.00 per 1,000 calls** ($0.005 per call)

**Estimated TransConnect Usage:**
- ~100-500 route calculations per month = **FREE**
- Even 10,000 calculations = Only $50/month

---

### Step 4: Create API Key

1. **Go to Credentials**
   - Click **"APIs & Services"** → **"Credentials"**
   - Or visit: https://console.cloud.google.com/apis/credentials

2. **Create Credentials**
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"API key"**

3. **Copy Your API Key**
   - A popup will show your API key
   - **COPY THIS KEY IMMEDIATELY** and save it somewhere secure
   - Example: `AIzaSyD1234567890abcdefGHIJKLMNOPQRSTUVWXYZ`

---

### Step 5: Restrict API Key (Security Best Practice)

⚠️ **IMPORTANT**: Restrict your API key to prevent unauthorized usage and unexpected charges.

1. **Click "Edit API key"** in the popup (or find your key in the credentials list)

2. **Set Application Restrictions**
   - Select **"IP addresses"**
   - Add your server IPs:
     - Render.com staging IP (get from Render dashboard)
     - Render.com production IP
     - Your local development IP (for testing)
   - Or select **"HTTP referrers"** and add:
     - `*.onrender.com/*`
     - `transconnect.app/*`

3. **Restrict API**
   - Under **"API restrictions"**, select **"Restrict key"**
   - Choose **"Distance Matrix API"** from the list
   - This prevents the key from being used for other Google services

4. **Save Changes**

---

### Step 6: Add API Key to Environment

#### For Local Development:

1. **Edit `.env` file** in `transconnect-backend/`
   ```bash
   # Add this line
   GOOGLE_MAPS_API_KEY=AIzaSyD1234567890abcdefGHIJKLMNOPQRSTUVWXYZ
   ```

2. **Restart your backend server**
   ```bash
   npm run dev
   ```

#### For Staging (Render):

1. **Go to Render Dashboard**  
   Visit: https://dashboard.render.com/

2. **Select Backend Service**
   - Find `transconnect-app-testing` or your staging backend

3. **Environment Variables**
   - Click **"Environment"** in the left sidebar
   - Click **"Add Environment Variable"**
   - Key: `GOOGLE_MAPS_API_KEY`
   - Value: Paste your API key
   - Click **"Save Changes"**

4. **Redeploy**
   - Render will automatically redeploy with the new environment variable
   - Wait 2-3 minutes for deployment

---

## ✅ Testing the Integration

### Option 1: Run Test Script

```bash
cd transconnect-backend
npx tsx scripts/test-google-maps.ts
```

**Expected Output:**
```
🗺️  Testing Google Maps Distance Matrix Integration
============================================================
✅ Google Maps service is enabled

Test Case 1: Single Distance Calculation
------------------------------------------------------------

Calculating: Kampala, Uganda → Jinja, Uganda
✅ Success!
   Distance: 80.5 km (80.5 km)
   Duration: 95 minutes (1 hour 35 mins)
```

### Option 2: Test via API

**1. Calculate Distance:**
```bash
curl "https://transconnect-app-testing.onrender.com/api/distance/calculate?origin=Kampala,Uganda&destination=Jinja,Uganda"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "origin": "Kampala, Uganda",
    "destination": "Jinja, Uganda",
    "distanceKm": 80.5,
    "distanceText": "80.5 km",
    "durationMinutes": 95,
    "durationText": "1 hour 35 mins",
    "success": true
  }
}
```

**2. Validate Location:**
```bash
curl "https://transconnect-app-testing.onrender.com/api/distance/validate?location=Kampala,Uganda"
```

**3. Geocode Address:**
```bash
curl "https://transconnect-app-testing.onrender.com/api/distance/geocode?address=Entebbe,Uganda"
```

### Option 3: Create Route with Auto-Calculation

**Before:** Had to manually enter distance and duration
```json
{
  "origin": "Kampala",
  "destination": "Jinja",
  "distance": 80.5,
  "duration": 95,
  "price": 15000
}
```

**After:** Distance and duration calculated automatically
```json
{
  "origin": "Kampala",
  "destination": "Jinja",
  "price": 15000
}
```

Backend automatically calculates and fills in distance/duration! ✨

---

## 📊 Monitoring Usage and Costs

### View API Usage:

1. **Go to Google Cloud Console**  
   https://console.cloud.google.com/

2. **APIs & Services** → **"Dashboard"**

3. **Select "Distance Matrix API"**
   - View requests per day
   - Track quota usage
   - Monitor errors

### Set Budget Alerts:

1. **Go to Billing** → **"Budgets & alerts"**

2. **Create Budget**
   - Set monthly budget: $10 (or your preferred limit)
   - Set alert at 50%, 90%, 100% of budget
   - Receive email notifications

3. **Example Budget:**
   - 2,000 free calls/month = $0
   - Alert if usage exceeds $5/month
   - Hard limit at $10/month (optional)

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Restrict API key to specific IPs or domains
- ✅ Limit API key to only Distance Matrix API
- ✅ Set budget alerts
- ✅ Rotate API keys periodically (every 3-6 months)
- ✅ Store keys in environment variables (NEVER in code)
- ✅ Use different keys for development and production

### ❌ DON'T:
- ❌ Commit API keys to Git repositories
- ❌ Share API keys publicly
- ❌ Use same key for frontend and backend
- ❌ Leave API key unrestricted
- ❌ Ignore billing alerts

---

## 🐛 Troubleshooting

### Error: "API key not valid"
**Solution:**
- Verify API key is copied correctly (no extra spaces)
- Check if Distance Matrix API is enabled
- Wait 5 minutes after creating key (propagation delay)
- Verify billing is set up

### Error: "This API project is not authorized"
**Solution:**
- Enable Distance Matrix API in Google Cloud Console
- Check IP restrictions on API key
- Verify billing is set up and active

### Error: "ZERO_RESULTS"
**Solution:**
- Check location spelling
- Add country suffix: "Kampala, Uganda" instead of just "Kampala"
- Verify locations exist in Google Maps

### Backend logs show: "Google Maps service not enabled"
**Solution:**
- Verify `GOOGLE_MAPS_API_KEY` is set in `.env` file
- Restart backend server after adding key
- Check for typos in environment variable name

### Rate limit errors
**Solution:**
- Free tier: 40,000 calls/month
- Add delays between batch calculations (200ms)
- Cache results for frequently calculated routes
- Consider upgrading plan if needed

---

## 💰 Cost Optimization Tips

1. **Cache Route Calculations**
   - Store calculated distances in database
   - Only recalculate when route changes

2. **Batch Calculations**
   - Use batch endpoint for multiple routes
   - Reduces API calls

3. **Pre-calculate Popular Routes**
   - Run `/api/distance/update-routes` once
   - Updates all existing routes
   - Future route changes will auto-calculate

4. **Use Default Values**
   - For very common routes (e.g., Kampala → Entebbe)
   - Hardcode distances if needed
   - Only use API for new/unknown routes

---

## � Batch Update Existing Routes and Segments

After setting up your Google Maps API key, you'll want to populate distance data for all existing routes and segments in your database.

### Running the Batch Update Script

**Purpose**: Automatically calculate and update distances for all existing routes and segments that are missing this data.

**Command**:
```bash
npm run update-distances
```

**What it does:**
1. Fetches all active routes without distance/duration
2. Calculates distances using Google Maps Distance Matrix API
3. Updates routes in the database
4. Fetches all route segments without distance/duration
5. Calculates segment distances (e.g., Kampala → Masaka → Mbarara)
6. Updates segments in the database
7. Provides detailed progress logs and summary

**Expected Output:**
```
🗺️  Batch Distance Update Script
============================================================
Started at: 2/23/2026, 10:30:00 AM

✅ Google Maps service is enabled
✅ Database connection established

📍 Updating Route Distances
============================================================
Found 5 active routes

🔄 Route 1/5: Kampala → Jinja
   Calculating distance...
   ✅ Updated: 80.5km, 95min

✓ Route 2/5: Kampala → Mbarara
   Already has distance: 265km, 240min

[... continues for all routes and segments ...]

============================================================
📊 FINAL SUMMARY
============================================================

Routes:
  Total Processed: 5
  ✅ Updated: 3
  ❌ Failed: 0
  ⏭️  Skipped: 2

Segments:
  Total Processed: 12
  ✅ Updated: 8
  ❌ Failed: 1
  ⏭️  Skipped: 3

⏱️  Total Time: 15.43s

✅ Batch update completed at: 2/23/2026, 10:30:15 AM
```

### When to Run This Script

**Recommended Times:**
1. **First Time Setup**: Immediately after adding your Google Maps API key
2. **After Data Migration**: When importing routes from another system
3. **After Manual Route Creation**: If routes were created without distances
4. **Periodic Maintenance**: Monthly to catch any missing data

### Rate Limiting

The script includes automatic rate limiting:
- **200ms delay** between API calls
- Prevents hitting Google Maps API rate limits
- For 100 routes: ~20 seconds total
- For 500 routes: ~100 seconds (1.5 minutes)

### Cost Estimation

**Example Scenarios:**
- 50 routes + 100 segments = 150 API calls = **$0.75** (or FREE with free tier)
- 100 routes + 250 segments = 350 API calls = **$1.75** (or FREE with free tier)
- 500 routes + 1000 segments = 1500 API calls = **$7.50** (likely FREE with monthly quota)

**Note**: This is a one-time cost. Future route/segment creation will auto-calculate without needing batch updates.

### Monitoring Progress

The script provides real-time feedback:
- **🔄** = Currently calculating
- **✅** = Successfully updated
- **❌** = Failed to calculate (manual entry needed)
- **✓** = Already has distance data (skipped)

### Handling Failures

If some calculations fail:
1. **Review the logs** - error details are shown for each failure
2. **Common causes**:
   - Invalid location names (typos, locations not in Google Maps)
   - Network connectivity issues
   - API quota exceeded
3. **Solutions**:
   - Fix location names in database
   - Re-run the script (it skips already-updated items)
   - Manually update failed items via API or admin dashboard

### Re-running the Script

**Safe to re-run multiple times:**
- ✅ Script only updates items missing distance/duration
- ✅ Won't overwrite existing data
- ✅ Won't duplicate API calls for items already processed
- ✅ Can be run anytime without side effects

**Example Re-run After Fixing Data:**
```bash
# After fixing typo in location name from "Masak" to "Masaka"
npm run update-distances

# Script will only process the previously failed item
# Everything else will be skipped
```

---

## �📝 Summary Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Distance Matrix API
- [ ] Set up billing (required)
- [ ] Created API key
- [ ] Restricted API key (IP/domain + API restrictions)
- [ ] Added key to local `.env` file
- [ ] Added key to Render environment variables
- [ ] Tested with `test-google-maps.ts` script
- [ ] Verified API call works via curl/Postman- [ ] **Ran batch update script** (`npm run update-distances`)- [ ] Set up budget alerts ($10/month recommended)
- [ ] Documented key in secure location

---

## 🔗 Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Distance Matrix API Documentation](https://developers.google.com/maps/documentation/distance-matrix)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Render Environment Variables](https://render.com/docs/environment-variables)

---

**Setup Time**: ~15-20 minutes  
**Monthly Cost**: $0 - $10 (depends on usage)  
**Free Tier**: First 40,000 calls per month  
**Recommended for**: All TransConnect deployments (dev, staging, production)

---

**Status**: Ready to implement ✅  
**Next Step**: Add API key to environment and test! 🚀
