# Operator Passenger Portal - Quick Start Guide

## ⚡ Get Started in 30 Minutes

This guide provides the **minimum viable code** to get a basic operator portal working. Perfect for demo/proof-of-concept.

---

## Step 1: Database Migration (5 minutes)

### Update Prisma Schema

**File:** `transconnect-backend/prisma/schema.prisma`

Find the `Operator` model and add these fields:

```prisma
model Operator {
  // ... existing fields ...
  
  // Add these new fields:
  slug           String?  @unique
  brandLogoUrl   String?  @map("brand_logo_url")
  brandColor     String?  @map("brand_color") @default("#16a34a")
  tagline        String?
  description    String?  @db.Text
  portalEnabled  Boolean  @default(false) @map("portal_enabled")
  
  // ... rest of the model ...
}
```

### Run Migration

```bash
cd transconnect-backend
npx prisma migrate dev --name add_operator_portal
npx prisma generate
```

### Create Test Slug (Optional)

```bash
# In Prisma Studio or your database client
UPDATE operators 
SET slug = 'test-operator', portal_enabled = true 
WHERE id = 'your-operator-id';
```

---

## Step 2: Backend API (10 minutes)

### Create Operator Portal Routes

**File:** `transconnect-backend/src/routes/operator-portal.ts` (NEW)

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get operator by slug (public endpoint)
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const operator = await prisma.operator.findUnique({
      where: { 
        slug,
        portalEnabled: true,
        approved: true
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        buses: {
          where: { active: true },
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true,
            amenities: true
          }
        },
        routes: {
          where: { active: true },
          include: {
            bus: {
              select: {
                plateNumber: true,
                capacity: true
              }
            }
          },
          orderBy: [
            { origin: 'asc' },
            { destination: 'asc' }
          ]
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator portal not found' });
    }

    res.json(operator);
  } catch (error) {
    console.error('Error fetching operator portal:', error);
    res.status(500).json({ error: 'Failed to load operator portal' });
  }
});

export default router;
```

### Register the Route

**File:** `transconnect-backend/src/index.ts`

Add near other route imports:

```typescript
import operatorPortalRoutes from './routes/operator-portal';
```

Add near other route registrations:

```typescript
app.use('/api/operator-portal', operatorPortalRoutes);
```

### Restart Backend

```bash
npm run dev
# or
npm start
```

### Test the Endpoint

```bash
# Replace 'test-operator' with your slug
curl http://localhost:5000/api/operator-portal/slug/test-operator
```

---

## Step 3: Frontend - Operator Portal Page (10 minutes)

### Create the Page

**File:** `transconnect-web/src/app/operator/[slug]/page.tsx` (NEW)

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Bus, MapPin, Clock, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function OperatorPortalPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOperator();
  }, [slug]);

  async function loadOperator() {
    try {
      const response = await fetch(`${API_BASE_URL}/operator-portal/slug/${slug}`);
      if (!response.ok) throw new Error('Operator not found');
      const data = await response.json();
      setOperator(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Portal Not Found</h2>
          <p className="text-gray-600 mb-6">The operator portal you're looking for doesn't exist.</p>
          <Link href="/" className="bg-green-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-green-700">
            Go to TransConnect Home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = operator.brandColor || '#16a34a';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-8" style={{ backgroundColor: primaryColor }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {operator.brandLogoUrl ? (
                <img 
                  src={operator.brandLogoUrl} 
                  alt={operator.companyName}
                  className="h-16 w-16 object-contain bg-white rounded-lg p-2"
                />
              ) : (
                <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center">
                  <Bus className="h-8 w-8 text-gray-700" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{operator.companyName}</h1>
                {operator.tagline && <p className="text-white/90">{operator.tagline}</p>}
              </div>
            </div>
            <Link href="/" className="text-sm text-white/80 hover:text-white flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              TransConnect
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* About */}
        {operator.description && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">About Us</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{operator.description}</p>
          </div>
        )}

        {/* Routes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Our Routes</h2>
          {operator.routes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">No routes available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {operator.routes.map((route: any) => (
                <Link
                  key={route.id}
                  href={`/route/${route.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-l-4"
                  style={{ borderLeftColor: primaryColor }}
                >
                  <div className="mb-4">
                    <div className="flex items-center text-lg font-semibold mb-1">
                      <MapPin className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                      {route.origin}
                    </div>
                    <div className="flex items-center text-lg font-semibold">
                      <MapPin className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                      {route.destination}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Departs: {route.departureTime}
                    </div>
                    <div className="flex items-center">
                      <Bus className="h-4 w-4 mr-2" />
                      {route.bus.plateNumber} • {route.bus.capacity} seats
                    </div>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between">
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                      UGX {route.price.toLocaleString()}
                    </span>
                    <span 
                      className="text-white px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Book Now
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Fleet */}
        {operator.buses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {operator.buses.map((bus: any) => (
                <div key={bus.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Bus className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold">{bus.plateNumber}</h3>
                      <p className="text-sm text-gray-600">{bus.model}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Capacity: {bus.capacity} seats</p>
                    {bus.amenities && <p>Amenities: {bus.amenities}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} {operator.companyName}</p>
          <p className="text-sm text-gray-400 mt-2">
            Powered by <Link href="/" className="text-green-400">TransConnect</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### Create the Layout File

**File:** `transconnect-web/src/app/operator/[slug]/layout.tsx` (NEW)

```typescript
export default function OperatorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

### Test the Page

```bash
cd transconnect-web
npm run dev
```

Visit: `http://localhost:3000/operator/test-operator`

---

## Step 4: Test Everything (5 minutes)

### Manual Testing Checklist

1. **Backend API:**
   ```bash
   curl http://localhost:5000/api/operator-portal/slug/test-operator
   ```
   ✅ Should return operator data with routes and buses

2. **Frontend Page:**
   - Visit `http://localhost:3000/operator/test-operator`
   - ✅ Page loads without errors
   - ✅ Operator name displayed
   - ✅ Routes shown
   - ✅ Buses shown
   - ✅ Custom branding applied (if set)

3. **Error Cases:**
   - Visit `http://localhost:3000/operator/invalid-slug`
   - ✅ Shows "Portal Not Found" message

4. **Responsive Design:**
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - ✅ Looks good on mobile
   - ✅ Looks good on tablet
   - ✅ Looks good on desktop

---

## Step 5: Deploy (Optional)

### Update Environment Variables

**Backend:**
```env
# No new env vars needed for basic version
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.transconnect.app/api
```

### Deploy Commands

```bash
# Backend
cd transconnect-backend
npm run build
# Deploy to your server

# Frontend
cd transconnect-web
npm run build
# Deploy to Vercel/Netlify/your server
```

---

## Quick Operator Setup (Database)

### Option 1: Prisma Studio

```bash
cd transconnect-backend
npx prisma studio
```

Then update an operator:
- Set `slug` to desired URL slug (e.g., "kampala-express")
- Set `portalEnabled` to `true`
- Optionally set:
  - `brandColor` to hex color (e.g., "#dc2626")
  - `tagline` to company tagline
  - `description` to company description
  - `brandLogoUrl` to logo image URL

### Option 2: SQL Query

```sql
UPDATE operators 
SET 
  slug = 'kampala-express',
  portal_enabled = true,
  brand_color = '#16a34a',
  tagline = 'Your comfort, our priority',
  description = 'Leading bus operator in Uganda with 10+ years of experience.'
WHERE id = 'YOUR_OPERATOR_ID';
```

### Option 3: API Endpoint (Future)

Create a simple admin endpoint to set up operator portals:

```typescript
// In operator-management.ts
router.post('/setup-portal', authenticateToken, async (req, res) => {
  const userId = (req as any).user.id;
  const { slug } = req.body;
  
  const operator = await prisma.operator.findUnique({
    where: { userId }
  });
  
  if (!operator) {
    return res.status(404).json({ error: 'Operator not found' });
  }
  
  // Check slug uniqueness
  const existing = await prisma.operator.findUnique({
    where: { slug }
  });
  
  if (existing && existing.id !== operator.id) {
    return res.status(400).json({ error: 'Slug already taken' });
  }
  
  await prisma.operator.update({
    where: { id: operator.id },
    data: { 
      slug,
      portalEnabled: true 
    }
  });
  
  res.json({ 
    message: 'Portal enabled',
    url: `https://transconnect.app/operator/${slug}`
  });
});
```

---

## Common Issues & Solutions

### Issue 1: "Operator portal not found"

**Problem:** API returns 404 even with valid slug

**Solutions:**
- ✅ Check `portalEnabled` is `true` in database
- ✅ Check `approved` is `true` in database
- ✅ Verify slug matches exactly (case-sensitive)
- ✅ Check API URL is correct in frontend

### Issue 2: Routes not showing

**Problem:** Operator portal loads but no routes displayed

**Solutions:**
- ✅ Ensure operator has active routes in database
- ✅ Check `active` field is `true` for routes
- ✅ Verify routes have `operatorId` matching the operator

### Issue 3: Branding not applied

**Problem:** Custom colors/logo not showing

**Solutions:**
- ✅ Check `brandColor` is valid hex color
- ✅ Check `brandLogoUrl` is accessible URL
- ✅ Clear browser cache (Ctrl+Shift+R)
- ✅ Check browser console for errors

### Issue 4: CORS errors

**Problem:** Frontend can't connect to backend API

**Solutions:**
- ✅ Add frontend URL to CORS whitelist in backend
- ✅ Check API_URL environment variable
- ✅ Ensure backend is running

### Issue 5: Database migration fails

**Problem:** Prisma migration errors

**Solutions:**
- ✅ Backup database first
- ✅ Check for conflicting migrations
- ✅ Try: `npx prisma migrate reset` (DEV ONLY!)
- ✅ Manually fix database if needed

---

## Next Steps

After you have the basic version working:

1. **Add Configuration UI** (from main plan)
   - Operator dashboard component
   - Portal settings form
   - Preview functionality

2. **Add Analytics** (from main plan)
   - Track portal visits
   - Monitor bookings
   - Generate reports

3. **Enhance SEO** (from main plan)
   - Meta tags
   - Open Graph
   - Sitemap

4. **Add Marketing Tools** (from main plan)
   - QR code generator
   - Social sharing
   - Embeddable widgets

---

## Support

If you run into issues:

1. Check browser console (F12)
2. Check backend logs
3. Check database records
4. Refer to main implementation plan
5. Review mockups document

---

## Quick Reference URLs

- **API Endpoint:** `http://localhost:5000/api/operator-portal/slug/{slug}`
- **Frontend Page:** `http://localhost:3000/operator/{slug}`
- **Prisma Studio:** `http://localhost:5555` (after running `npx prisma studio`)

---

**Estimated Setup Time:** 30-45 minutes  
**Prerequisites:** Existing TransConnect backend & frontend running

---

*You now have a working operator passenger portal! Share the URL with operators to let them promote their routes.*
