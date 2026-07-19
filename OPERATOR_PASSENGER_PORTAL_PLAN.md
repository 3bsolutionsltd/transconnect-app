# Operator-Based Passenger Portal - Implementation Plan

## 📋 Executive Summary

This plan outlines the implementation of an **operator-specific passenger landing page** that allows bus operators to promote only their routes on the TransConnect platform. Each operator will have a branded passenger portal showing only their buses and routes, enabling them to drive direct bookings from their own marketing channels.

---

## 🎯 Objectives

1. **White-Label Portal**: Each operator gets their own passenger-facing booking portal
2. **Filtered Content**: Portal shows only the operator's routes, buses, and schedules
3. **Marketing Tool**: Operators can share their unique URL with customers
4. **Seamless Booking**: Full booking flow integrated with existing payment system
5. **Brand Consistency**: Customizable branding (logo, colors, company name)

---

## 🏗️ Architecture Overview

### URL Strategy (Choose One)

#### **Option A: Path-Based (Recommended for MVP)**
```
https://transconnect.app/operator/{operatorSlug}
Examples:
  - https://transconnect.app/operator/post-bus
  - https://transconnect.app/operator/gaaga-coaches
  - https://transconnect.app/operator/kampala-express
```

**Pros:**
- Easy to implement
- No DNS/SSL configuration needed
- SEO-friendly
- Works immediately

**Cons:**
- Less "premium" feel
- Operator doesn't have "their own" domain

#### **Option B: Subdomain (Future Enhancement)**
```
https://{operatorSlug}.transconnect.app
Examples:
  - https://postbus.transconnect.app
  - https://gaaga.transconnect.app
```

**Pros:**
- More professional appearance
- Feels like operator's own site
- Better for branding

**Cons:**
- Requires DNS wildcard setup
- SSL certificate management
- More complex routing

**Recommendation:** Start with Option A (path-based), offer Option B as premium feature later.

---

## 🗄️ Database Changes

### 1. Add Operator Slug & Branding Fields

**Update `Operator` model in `prisma/schema.prisma`:**

```prisma
model Operator {
  id             String   @id @default(cuid())
  companyName    String
  license        String   @unique
  slug           String   @unique // NEW: URL-friendly identifier (e.g., "post-bus")
  approved       Boolean  @default(false)
  userId         String   @unique
  agentId        String?
  managedByAgent Boolean  @default(false)
  
  // NEW: Branding fields for operator portal
  brandLogoUrl   String?  @map("brand_logo_url") // Logo for operator portal
  brandColor     String?  @map("brand_color") // Primary color (hex)
  tagline        String?  // Company tagline
  description    String?  @db.Text // About the operator
  portalEnabled  Boolean  @default(false) @map("portal_enabled") // Enable operator portal
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations (existing)
  user             User            @relation(...)
  buses            Bus[]
  routes           Route[]
  // ... rest unchanged
}
```

**Migration needed:**
```bash
npx prisma migrate dev --name add_operator_portal_fields
```

---

## 🔌 Backend API Changes

### 1. New Endpoints

**File:** `transconnect-backend/src/routes/operator-portal.ts` (NEW)

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get operator by slug (public - no auth required)
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const operator = await prisma.operator.findUnique({
      where: { 
        slug,
        portalEnabled: true,  // Only return if portal is enabled
        approved: true        // Only approved operators
      },
      select: {
        id: true,
        companyName: true,
        slug: true,
        brandLogoUrl: true,
        brandColor: true,
        tagline: true,
        description: true,
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
                capacity: true,
                amenities: true
              }
            },
            stops: {
              orderBy: { order: 'asc' }
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
      return res.status(404).json({ 
        error: 'Operator portal not found or not enabled' 
      });
    }

    res.json(operator);
  } catch (error) {
    console.error('Error fetching operator portal:', error);
    res.status(500).json({ error: 'Failed to load operator portal' });
  }
});

// Get operator routes (public)
router.get('/:operatorId/routes', async (req: Request, res: Response) => {
  try {
    const { operatorId } = req.params;
    const { origin, destination, date } = req.query;

    const whereClause: any = {
      operatorId,
      active: true
    };

    if (origin) whereClause.origin = { contains: origin as string, mode: 'insensitive' };
    if (destination) whereClause.destination = { contains: destination as string, mode: 'insensitive' };

    const routes = await prisma.route.findMany({
      where: whereClause,
      include: {
        bus: true,
        stops: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: [
        { origin: 'asc' },
        { destination: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    res.json({ routes, total: routes.length });
  } catch (error) {
    console.error('Error fetching operator routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get operator statistics (public)
router.get('/:operatorId/stats', async (req: Request, res: Response) => {
  try {
    const { operatorId } = req.params;

    const [totalRoutes, totalBuses, completedBookings] = await Promise.all([
      prisma.route.count({ where: { operatorId, active: true } }),
      prisma.bus.count({ where: { operatorId, active: true } }),
      prisma.booking.count({ 
        where: { 
          route: { operatorId },
          status: 'CONFIRMED'
        } 
      })
    ]);

    res.json({
      totalRoutes,
      totalBuses,
      totalBookings: completedBookings,
      experience: Math.floor(completedBookings / 100) // Rough experience metric
    });
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
```

**Register route in `transconnect-backend/src/index.ts`:**

```typescript
import operatorPortalRoutes from './routes/operator-portal';

// ... existing routes
app.use('/api/operator-portal', operatorPortalRoutes);
```

### 2. Update Existing Endpoints

**File:** `transconnect-backend/src/routes/operator-management.ts`

Add endpoint for operators to configure their portal:

```typescript
// Update operator branding (Operator only)
router.patch('/portal-config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { slug, brandLogoUrl, brandColor, tagline, description, portalEnabled } = req.body;

    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    // Validate slug uniqueness if changed
    if (slug && slug !== operator.slug) {
      const existingSlug = await prisma.operator.findUnique({
        where: { slug }
      });
      if (existingSlug) {
        return res.status(400).json({ error: 'This portal URL is already taken' });
      }
    }

    const updated = await prisma.operator.update({
      where: { id: operator.id },
      data: {
        slug: slug || operator.slug,
        brandLogoUrl,
        brandColor,
        tagline,
        description,
        portalEnabled
      }
    });

    res.json({ 
      message: 'Portal configuration updated',
      operator: updated,
      portalUrl: `https://transconnect.app/operator/${updated.slug}`
    });
  } catch (error) {
    console.error('Error updating portal config:', error);
    res.status(500).json({ error: 'Failed to update portal configuration' });
  }
});

// Get operator's portal configuration (Operator only)
router.get('/portal-config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const operator = await prisma.operator.findUnique({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        slug: true,
        brandLogoUrl: true,
        brandColor: true,
        tagline: true,
        description: true,
        portalEnabled: true
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json({
      ...operator,
      portalUrl: operator.slug 
        ? `https://transconnect.app/operator/${operator.slug}`
        : null
    });
  } catch (error) {
    console.error('Error fetching portal config:', error);
    res.status(500).json({ error: 'Failed to fetch portal configuration' });
  }
});
```

---

## 🎨 Frontend Changes

### 1. New Operator Portal Page

**File:** `transconnect-web/src/app/operator/[slug]/page.tsx` (NEW)

```typescript
'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Bus, MapPin, Clock, Star, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { API_BASE_URL } from '@/lib/config';

interface OperatorPortalData {
  id: string;
  companyName: string;
  slug: string;
  brandLogoUrl?: string;
  brandColor?: string;
  tagline?: string;
  description?: string;
  buses: Array<{
    id: string;
    plateNumber: string;
    model: string;
    capacity: number;
    amenities?: string;
  }>;
  routes: Array<{
    id: string;
    origin: string;
    destination: string;
    price: number;
    departureTime: string;
    duration: number;
    bus: any;
  }>;
}

interface Stats {
  totalRoutes: number;
  totalBuses: number;
  totalBookings: number;
  experience: number;
}

export default function OperatorPortalPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [operator, setOperator] = useState<OperatorPortalData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOperatorData();
  }, [slug]);

  async function loadOperatorData() {
    setLoading(true);
    try {
      const [operatorRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/operator-portal/slug/${slug}`),
        fetch(`${API_BASE_URL}/operator-portal/stats/${slug}`).catch(() => null)
      ]);

      if (!operatorRes.ok) {
        throw new Error('Operator portal not found');
      }

      const operatorData = await operatorRes.json();
      setOperator(operatorData);

      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      console.error('Error loading operator:', err);
      setError(err.message || 'Failed to load operator portal');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operator portal...</p>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The operator portal you are looking for does not exist or is not available.'}
          </p>
          <Link 
            href="/" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Go to TransConnect Home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = operator.brandColor || '#16a34a';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom branded header */}
      <div 
        className="text-white py-8 shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
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
                {operator.tagline && (
                  <p className="text-white/90 mt-1">{operator.tagline}</p>
                )}
              </div>
            </div>
            <Link 
              href="/"
              className="text-sm text-white/80 hover:text-white underline"
            >
              Powered by TransConnect
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {stats.totalRoutes}
                </div>
                <div className="text-sm text-gray-600">Routes</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {stats.totalBuses}
                </div>
                <div className="text-sm text-gray-600">Buses</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {stats.totalBookings}+
                </div>
                <div className="text-sm text-gray-600">Bookings</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {stats.experience}+ years
                </div>
                <div className="text-sm text-gray-600">Experience</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* About section */}
        {operator.description && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Us</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{operator.description}</p>
          </div>
        )}

        {/* Available Routes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Routes</h2>
          {operator.routes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No routes available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {operator.routes.map((route) => (
                <Link
                  key={route.id}
                  href={`/route/${route.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-l-4"
                  style={{ borderLeftColor: primaryColor }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center text-lg font-semibold text-gray-900 mb-1">
                        <MapPin className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                        {route.origin}
                      </div>
                      <div className="flex items-center text-lg font-semibold text-gray-900">
                        <MapPin className="h-5 w-5 mr-2" style={{ color: primaryColor }} />
                        {route.destination}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Departs: {route.departureTime}
                    </div>
                    <div className="flex items-center">
                      <Bus className="h-4 w-4 mr-2" />
                      {route.bus.plateNumber} • {route.bus.capacity} seats
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                      UGX {route.price.toLocaleString()}
                    </span>
                    <button 
                      className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Book Now
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Our Fleet */}
        {operator.buses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {operator.buses.map((bus) => (
                <div 
                  key={bus.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center mb-4">
                    <div 
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Bus className="h-6 w-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-gray-900">{bus.plateNumber}</h3>
                      <p className="text-sm text-gray-600">{bus.model}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                      {bus.capacity} Comfortable Seats
                    </div>
                    {bus.amenities && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                        {bus.amenities}
                      </div>
                    )}
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
          <p className="text-gray-400">
            © {new Date().getFullYear()} {operator.companyName}. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Booking powered by{' '}
            <Link href="/" className="text-green-400 hover:text-green-300">
              TransConnect
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### 2. Operator Portal Configuration Component (Admin Dashboard)

**File:** `transconnect-admin/src/components/operator/OperatorPortalConfig.tsx` (NEW)

```typescript
import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Save, Eye, AlertCircle, CheckCircle } from 'lucide-react';

const OperatorPortalConfig = () => {
  const [config, setConfig] = useState({
    slug: '',
    brandLogoUrl: '',
    brandColor: '#16a34a',
    tagline: '',
    description: '',
    portalEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/api';

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operator-management/portal-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig({
          slug: data.slug || '',
          brandLogoUrl: data.brandLogoUrl || '',
          brandColor: data.brandColor || '#16a34a',
          tagline: data.tagline || '',
          description: data.description || '',
          portalEnabled: data.portalEnabled || false
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operator-management/portal-config`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Portal configuration saved! Your portal URL: ${data.portalUrl}` 
        });
      } else {
        const error = await response.json();
        setMessage({ 
          type: 'error', 
          text: error.error || 'Failed to save configuration' 
        });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  const portalUrl = config.slug 
    ? `https://transconnect.app/operator/${config.slug}`
    : '';

  if (loading) {
    return <div className="p-8 text-center">Loading configuration...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Operator Portal Configuration</h2>
        <p className="text-gray-600">
          Customize your passenger-facing booking portal. Share your unique URL with customers!
        </p>
      </div>

      {message && (
        <div 
          className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-3" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Enable Portal */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <label className="font-medium text-gray-900">Enable Operator Portal</label>
            <p className="text-sm text-gray-600 mt-1">
              Make your passenger portal publicly accessible
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.portalEnabled}
              onChange={(e) => setConfig({ ...config, portalEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {/* Portal URL / Slug */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">
            Portal URL <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">transconnect.app/operator/</span>
            <input
              type="text"
              value={config.slug}
              onChange={(e) => setConfig({ ...config, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              placeholder="your-company-name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Use lowercase letters, numbers, and hyphens only. Example: "kampala-express"
          </p>
          {portalUrl && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <LinkIcon className="h-4 w-4 mr-1" />
              <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="underline">
                {portalUrl}
              </a>
            </div>
          )}
        </div>

        {/* Brand Logo */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">Brand Logo URL</label>
          <input
            type="url"
            value={config.brandLogoUrl}
            onChange={(e) => setConfig({ ...config, brandLogoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload your logo elsewhere and paste the URL here (PNG, JPG recommended)
          </p>
        </div>

        {/* Brand Color */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">Brand Primary Color</label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              value={config.brandColor}
              onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
              className="h-12 w-12 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.brandColor}
              onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tagline */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">Company Tagline</label>
          <input
            type="text"
            value={config.tagline}
            onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
            placeholder="Your comfort, our priority"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            Short phrase displayed below your company name (max 100 characters)
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium text-gray-900 mb-2">About Your Company</label>
          <textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder="Tell passengers about your company, services, and what makes you unique..."
            rows={5}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            {config.description.length}/500 characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {portalUrl && config.portalEnabled && (
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Portal
              </a>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !config.slug}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorPortalConfig;
```

### 3. Add to Operator Navigation

**File:** `transconnect-admin/src/components/operator/OperatorLayout.tsx`

Add new navigation item:

```typescript
const operatorNavigation = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Overview & stats' },
  { name: 'QR Scanner', href: '/scanner', icon: QrCode, description: 'Validate tickets' },
  { name: 'Bookings', href: '/bookings', icon: Users, description: 'View bookings' },
  { name: 'Fleet', href: '/buses', icon: Bus, description: 'Manage buses' },
  { name: 'Routes', href: '/routes', icon: MapPin, description: 'Manage routes' },
  // NEW:
  { name: 'My Portal', href: '/portal', icon: Globe, description: 'Customize portal' }, // Add Globe to imports
];
```

And add the route:

```typescript
<Route path="/portal" element={<OperatorPortalConfig />} />
```

---

## 📱 Mobile App Integration (Optional)

**For Flutter app:** Create deep link handler for operator portals:

```dart
// Handle links like transconnect://operator/post-bus
void _handleDeepLink(Uri uri) {
  if (uri.pathSegments.length == 2 && uri.pathSegments[0] == 'operator') {
    String operatorSlug = uri.pathSegments[1];
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => OperatorPortalScreen(slug: operatorSlug),
      ),
    );
  }
}
```

---

## 🔒 Security Considerations

1. **Input Validation:**
   - Sanitize slug field (only alphanumeric + hyphens)
   - Validate URLs for logo/images
   - Prevent XSS in description/tagline

2. **Access Control:**
   - Only approved operators can enable portal
   - Only portal-enabled operators are publicly visible
   - Operators can only edit their own portal

3. **Rate Limiting:**
   - Apply rate limits to public operator portal endpoints
   - Prevent portal slug enumeration

---

## 📊 Analytics & Tracking

**Add analytics to operator portals:**

```typescript
// Track visits to operator portal
router.get('/slug/:slug', async (req: Request, res: Response) => {
  // ... existing code ...
  
  // Log visit (optional)
  await prisma.operatorPortalVisit.create({
    data: {
      operatorId: operator.id,
      source: req.headers.referer || 'direct',
      userAgent: req.headers['user-agent']
    }
  });
});
```

**New model (optional):**
```prisma
model OperatorPortalVisit {
  id         String   @id @default(cuid())
  operatorId String
  source     String?
  userAgent  String?
  createdAt  DateTime @default(now())

  operator   Operator @relation(fields: [operatorId], references: [id], onDelete: Cascade)

  @@map("operator_portal_visits")
}
```

---

## 🚀 Implementation Phases

### **Phase 1: MVP (Week 1)**
- [ ] Database migration (add slug, branding fields)
- [ ] Backend API endpoints (operator-portal routes)
- [ ] Basic operator portal page (Next.js)
- [ ] Operator portal config UI (Admin dashboard)
- [ ] Testing with 1-2 real operators

### **Phase 2: Enhancement (Week 2)**
- [ ] Advanced customization (custom CSS/themes)
- [ ] Analytics dashboard for operators
- [ ] SEO optimization (meta tags, Open Graph)
- [ ] Mobile app deep linking
- [ ] Automated slug generation

### **Phase 3: Premium Features (Future)**
- [ ] Subdomain support (operator.transconnect.app)
- [ ] Custom domain mapping (book.operatorname.com)
- [ ] White-label mobile app branding
- [ ] Advanced marketing tools (discount codes, promotions)
- [ ] Operator portal subscription tiers

---

## ✅ Success Metrics

1. **Adoption:** % of operators who enable their portal
2. **Traffic:** Portal visits per operator per month
3. **Conversion:** Bookings from operator portals vs. main site
4. **Engagement:** Operators actively updating portal content
5. **Marketing Impact:** Direct bookings from operator marketing channels

---

## 💰 Business Model

### **Monetization Options:**

1. **Free Tier:**
   - Basic portal (path-based URL)
   - Standard branding options
   - Basic analytics

2. **Premium Tier (UGX 50,000/month):**
   - Subdomain (yourcompany.transconnect.app)
   - Advanced customization
   - Priority support
   - Detailed analytics

3. **Enterprise Tier (UGX 150,000/month):**
   - Custom domain mapping
   - Dedicated account manager
   - Custom integrations
   - White-label mobile app

---

## 🧪 Testing Plan

### **Test Cases:**

1. **Operator Portal Creation:**
   - ✅ Operator can create slug
   - ✅ Slug must be unique
   - ✅ Can upload logo and customize colors
   - ✅ Can enable/disable portal

2. **Public Portal Access:**
   - ✅ Portal loads for valid slug
   - ✅ Shows only operator's routes
   - ✅ Shows only operator's buses
   - ✅ Returns 404 for invalid slug
   - ✅ Returns 404 for disabled portal

3. **Booking Flow:**
   - ✅ Booking from operator portal works
   - ✅ Payment integration works
   - ✅ QR ticket generated correctly
   - ✅ Operator sees booking in dashboard

4. **Security:**
   - ✅ Cannot access other operator's config
   - ✅ Cannot inject malicious code in fields
   - ✅ Rate limiting works on public endpoints

---

## 📚 Documentation Needed

1. **Operator Guide:** How to set up and customize portal
2. **Marketing Guide:** Best practices for promoting portal
3. **API Documentation:** Updated with new endpoints
4. **Support FAQ:** Common questions about operator portals

---

## 🎯 Next Steps

1. **Review this plan** and provide feedback
2. **Prioritize features** (which ones for MVP?)
3. **Set timeline** (when do you need this?)
4. **Identify pilot operators** (who will test first?)

---

## 📞 Questions for Clarification

1. **URL Preference:** Path-based or subdomain for MVP?
2. **Customization Depth:** How much branding control should operators have?
3. **Booking Flow:** Should operator portal booking flow differ from main site?
4. **Monetization:** Free for all operators or premium feature?
5. **Analytics:** What metrics do operators need to see?

---

**Estimated Development Time:**
- Phase 1 (MVP): 5-7 days
- Phase 2 (Enhancement): 3-5 days
- Phase 3 (Premium): 10-14 days

**Resources Needed:**
- 1 Backend Developer
- 1 Frontend Developer
- 1 Designer (for portal templates)
- 1 QA Tester

---

*Ready to proceed? Let me know which phase you want to start with and any modifications to this plan!*
