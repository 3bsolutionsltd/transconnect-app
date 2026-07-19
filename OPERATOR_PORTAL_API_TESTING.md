# Operator Portal API Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
  - **Note:** Server binds to `0.0.0.0:5000` but access it via `localhost:5000` or `127.0.0.1:5000`
- Feature flags enabled in `.env`:
  - `ENABLE_OPERATOR_PORTAL=true` ✅
  - `ENABLE_OPERATOR_PORTAL_CONFIG=true` ✅
- Test operator account with JWT token

## Test Sequence

### Step 1: Check Feature Flags
```bash
curl http://localhost:5000/api/operator-portal/feature/status
```

**Expected Response:**
```json
{
  "success": true,
  "features": {
    "operatorPortal": true,
    "portalConfig": true,
    "analytics": false,
    "customDomains": false
  }
}
```

### Step 2: Configure Operator Portal (Authenticated)

#### 2.1 Get Current Configuration
```bash
curl -H "Authorization: Bearer YOUR_OPERATOR_JWT_TOKEN" \
  http://localhost:5000/api/operator-management/portal-config
```

**Expected Response:**
```json
{
  "success": true,
  "config": {
    "id": "operator-id",
    "companyName": "Test Transport Co",
    "slug": null,
    "brandLogoUrl": null,
    "brandColor": null,
    "tagline": null,
    "description": null,
    "portalEnabled": false,
    "portalUrl": null,
    "isConfigured": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### 2.2 Update Portal Configuration
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_OPERATOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-transport",
    "brandLogoUrl": "https://example.com/logo.png",
    "brandColor": "#FF5722",
    "tagline": "Your trusted transport partner",
    "description": "We provide reliable and comfortable bus services across Uganda.",
    "portalEnabled": true
  }' \
  http://localhost:5000/api/operator-management/portal-config
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Portal configuration updated successfully",
  "config": {
    "id": "operator-id",
    "companyName": "Test Transport Co",
    "slug": "test-transport",
    "brandLogoUrl": "https://example.com/logo.png",
    "brandColor": "#FF5722",
    "tagline": "Your trusted transport partner",
    "description": "We provide reliable and comfortable bus services across Uganda.",
    "portalEnabled": true,
    "portalUrl": "https://transconnect.app/operator/test-transport",
    "isConfigured": true,
    "updatedAt": "..."
  }
}
```

### Step 3: Access Public Portal (No Authentication)

#### 3.1 Get Operator by Slug
```bash
curl http://localhost:5000/api/operator-portal/slug/test-transport
```

**Expected Response:**
```json
{
  "success": true,
  "operator": {
    "id": "operator-id",
    "companyName": "Test Transport Co",
    "slug": "test-transport",
    "brandLogoUrl": "https://example.com/logo.png",
    "brandColor": "#FF5722",
    "tagline": "Your trusted transport partner",
    "description": "We provide reliable and comfortable bus services across Uganda.",
    "contact": {
      "name": "John Doe",
      "email": "operator@example.com",
      "phone": "+256700000000"
    },
    "buses": [
      {
        "id": "bus-1",
        "plateNumber": "UBJ 123A",
        "model": "Isuzu FRR",
        "capacity": 49,
        "createdAt": "..."
      }
    ],
    "routes": [
      {
        "id": "route-1",
        "origin": "Kampala",
        "destination": "Mbarara",
        "price": 30000,
        "departureTime": "08:00",
        "arrivalTime": "12:00",
        "active": true,
        "busId": "bus-1",
        "bus": {
          "plateNumber": "UBJ 123A",
          "model": "Isuzu FRR",
          "capacity": 49
        }
      }
    ],
    "stats": {
      "totalBuses": 1,
      "activeRoutes": 1
    }
  }
}
```

#### 3.2 Get Routes for Operator
```bash
# All routes
curl http://localhost:5000/api/operator-portal/OPERATOR_ID/routes

# Filter by origin
curl "http://localhost:5000/api/operator-portal/OPERATOR_ID/routes?origin=Kampala"

# Filter by destination
curl "http://localhost:5000/api/operator-portal/OPERATOR_ID/routes?destination=Mbarara"
```

**Expected Response:**
```json
{
  "success": true,
  "operator": {
    "id": "operator-id",
    "companyName": "Test Transport Co"
  },
  "count": 1,
  "routes": [
    {
      "id": "route-1",
      "origin": "Kampala",
      "destination": "Mbarara",
      "price": 30000,
      "departureTime": "08:00",
      "arrivalTime": "12:00",
      "active": true,
      "bus": {
        "plateNumber": "UBJ 123A",
        "model": "Isuzu FRR",
        "capacity": 49
      }
    }
  ]
}
```

#### 3.3 Get Public Statistics
```bash
curl http://localhost:5000/api/operator-portal/OPERATOR_ID/stats
```

**Expected Response:**
```json
{
  "success": true,
  "operator": {
    "id": "operator-id",
    "companyName": "Test Transport Co"
  },
  "stats": {
    "totalBuses": 1,
    "activeRoutes": 1,
    "totalTripsCompleted": 0,
    "yearsInOperation": "< 1"
  }
}
```

## Error Test Cases

### Test 1: Portal Not Enabled
Configure operator with `portalEnabled: false`, then try to access:
```bash
curl http://localhost:5000/api/operator-portal/slug/test-transport
```

**Expected Response:**
```json
{
  "error": "Operator portal is not available"
}
```
**Status Code:** 404

### Test 2: Invalid Slug
```bash
curl http://localhost:5000/api/operator-portal/slug/non-existent-slug
```

**Expected Response:**
```json
{
  "error": "Operator not found"
}
```
**Status Code:** 404

### Test 3: Duplicate Slug
Try to update operator with a slug that's already taken:
```bash
curl -X PATCH \
  -H "Authorization: Bearer OPERATOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug": "existing-slug"}' \
  http://localhost:5000/api/operator-management/portal-config
```

**Expected Response:**
```json
{
  "error": "This slug is already taken. Please choose another."
}
```
**Status Code:** 400

### Test 4: Invalid Slug Format
```bash
curl -X PATCH \
  -H "Authorization: Bearer OPERATOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug": "Invalid Slug!"}' \
  http://localhost:5000/api/operator-management/portal-config
```

**Expected Response:**
```json
{
  "errors": [
    {
      "msg": "Slug must be lowercase alphanumeric with hyphens",
      "param": "slug"
    }
  ]
}
```
**Status Code:** 400

### Test 5: Unauthorized Access
Try to access portal config without token:
```bash
curl http://localhost:5000/api/operator-management/portal-config
```

**Expected Response:**
```json
{
  "error": "No token provided" 
}
```
**Status Code:** 401

### Test 6: Feature Flag Disabled
Set `ENABLE_OPERATOR_PORTAL=false` in `.env`, restart server, then:
```bash
curl http://localhost:5000/api/operator-portal/slug/test-transport
```

**Expected Response:**
```json
{
  "error": "Feature not available"
}
```
**Status Code:** 404

## PowerShell Test Script

Save as `test-operator-portal-api.ps1`:

```powershell
# Configuration
$baseUrl = "http://localhost:5000"
$operatorToken = "YOUR_OPERATOR_JWT_TOKEN_HERE"

Write-Host "=== Operator Portal API Tests ===" -ForegroundColor Cyan

# Test 1: Feature Status
Write-Host "`n[Test 1] Checking feature flags..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/api/operator-portal/feature/status" -Method Get
$response | ConvertTo-Json
Write-Host "✓ Feature status retrieved" -ForegroundColor Green

# Test 2: Get Portal Config (Authenticated)
Write-Host "`n[Test 2] Getting portal configuration..." -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $operatorToken" }
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/operator-management/portal-config" -Method Get -Headers $headers
    $response | ConvertTo-Json
    Write-Host "✓ Portal config retrieved" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Update Portal Config
Write-Host "`n[Test 3] Updating portal configuration..." -ForegroundColor Yellow
$body = @{
    slug = "test-transport-$(Get-Random -Maximum 9999)"
    brandLogoUrl = "https://example.com/logo.png"
    brandColor = "#FF5722"
    tagline = "Your trusted partner"
    description = "Reliable bus services"
    portalEnabled = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/operator-management/portal-config" `
        -Method Patch -Headers $headers -ContentType "application/json" -Body $body
    $response | ConvertTo-Json
    Write-Host "✓ Portal config updated" -ForegroundColor Green
    $slug = $response.config.slug
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Operator by Slug (Public)
if ($slug) {
    Write-Host "`n[Test 4] Getting operator by slug (public)..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/operator-portal/slug/$slug" -Method Get
        $response | ConvertTo-Json -Depth 4
        Write-Host "✓ Operator portal retrieved" -ForegroundColor Green
        $operatorId = $response.operator.id
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Get Routes (Public)
if ($operatorId) {
    Write-Host "`n[Test 5] Getting operator routes..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/operator-portal/$operatorId/routes" -Method Get
        $response | ConvertTo-Json -Depth 3
        Write-Host "✓ Routes retrieved" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Get Stats (Public)
if ($operatorId) {
    Write-Host "`n[Test 6] Getting operator stats..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/operator-portal/$operatorId/stats" -Method Get
        $response | ConvertTo-Json
        Write-Host "✓ Stats retrieved" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
```

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Operator Portal API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    },
    {
      "key": "operator_token",
      "value": "YOUR_OPERATOR_JWT_TOKEN"
    }
  ],
  "item": [
    {
      "name": "Feature Status",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/operator-portal/feature/status"
      }
    },
    {
      "name": "Get Portal Config",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{operator_token}}"
          }
        ],
        "url": "{{base_url}}/api/operator-management/portal-config"
      }
    },
    {
      "name": "Update Portal Config",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{operator_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"slug\": \"test-transport\",\n  \"brandLogoUrl\": \"https://example.com/logo.png\",\n  \"brandColor\": \"#FF5722\",\n  \"tagline\": \"Your trusted partner\",\n  \"description\": \"Reliable bus services\",\n  \"portalEnabled\": true\n}"
        },
        "url": "{{base_url}}/api/operator-management/portal-config"
      }
    },
    {
      "name": "Get Operator by Slug",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/operator-portal/slug/test-transport"
      }
    },
    {
      "name": "Get Operator Routes",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/operator-portal/{{operator_id}}/routes"
      }
    },
    {
      "name": "Get Operator Stats",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/operator-portal/{{operator_id}}/stats"
      }
    }
  ]
}
```

## Success Criteria

- ✅ All feature flags report correct status
- ✅ Operator can get their portal config
- ✅ Operator can update portal config
- ✅ Slug uniqueness is enforced
- ✅ Invalid slugs are rejected
- ✅ Public can access operator portal by slug
- ✅ Portal returns 404 when not enabled
- ✅ Public can get routes and stats
- ✅ Authenticated endpoints reject non-operators
- ✅ All responses have correct structure

---

**Ready to Test:** Once backend server starts successfully  
**Next Step:** Run PowerShell script or use Postman collection
