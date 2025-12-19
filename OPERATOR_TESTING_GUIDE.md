# Quick Testing Guide - Operator Dashboard Fixes

## Pre-Testing Setup

### 1. Start Backend
```bash
cd transconnect-backend
npm run dev
```

### 2. Start Admin Panel
```bash
cd transconnect-admin
npm start
```

## Test Scenarios

### Scenario 1: Operator Login & Dashboard Display

**Expected:** Operator sees dashboard immediately, not blank page

**Steps:**
1. Navigate to admin panel (http://localhost:3000)
2. Login with operator credentials:
   - Email: `operator@example.com`
   - Password: (operator password)
3. ✅ **VERIFY:** Dashboard loads immediately
4. ✅ **VERIFY:** Dashboard shows operator-specific stats
5. ✅ **VERIFY:** URL is `/` (not redirected elsewhere)

### Scenario 2: Operator Routes - View Only Own Routes

**Expected:** Operator only sees their own routes, not all routes

**Steps:**
1. Login as operator (from Scenario 1)
2. Click "My Routes" in sidebar
3. ✅ **VERIFY:** Only routes for this operator are displayed
4. ✅ **VERIFY:** Route count matches operator's actual routes
5. Open browser DevTools → Network tab
6. Refresh the page
7. ✅ **VERIFY:** API call is to `/api/operator-management/routes` (not `/api/routes`)
8. ✅ **VERIFY:** Response contains only operator's routes

**Compare with Admin:**
1. Logout from operator
2. Login as admin
3. Go to "Routes"
4. ✅ **VERIFY:** Admin sees ALL routes from all operators

### Scenario 3: Operator Route Creation

**Expected:** Operator can create routes using their buses

**Steps:**
1. Login as operator
2. Go to "My Routes"
3. Click "Add Route" button
4. ✅ **VERIFY:** Modal opens with form
5. ✅ **VERIFY:** Bus dropdown shows only operator's buses
6. Fill in the form:
   - Origin: "Kampala"
   - Destination: "Jinja"
   - Via: "Mukono, Lugazi"
   - Distance: 87
   - Duration: 90
   - Price: 15000
   - Departure Time: "08:00"
   - Bus: (select one of operator's buses)
7. Click "Create Route"
8. ✅ **VERIFY:** Success message appears
9. ✅ **VERIFY:** New route appears in the list
10. ✅ **VERIFY:** Route has correct origin, destination, and price

**Error Handling:**
1. Click "Add Route" again
2. Leave Origin blank
3. Try to submit
4. ✅ **VERIFY:** Form validation prevents submission
5. Try creating route without selecting a bus
6. ✅ **VERIFY:** Form shows error or prevents submission

### Scenario 4: Operator Can't See Other Operators' Data

**Expected:** API enforces data isolation

**Steps:**
1. Login as Operator A
2. Note down Operator A's routes count
3. Open browser DevTools → Console
4. Run this command:
```javascript
fetch('http://localhost:5000/api/routes', {
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
  }
}).then(r => r.json()).then(console.log)
```
5. ✅ **VERIFY:** This returns ALL routes (general endpoint)
6. Now run:
```javascript
fetch('http://localhost:5000/api/operator-management/routes', {
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
  }
}).then(r => r.json()).then(console.log)
```
7. ✅ **VERIFY:** This returns only Operator A's routes

### Scenario 5: Admin Route Creation for Any Operator

**Expected:** Admin can create routes for any operator

**Steps:**
1. Login as admin
2. Go to "Routes" page
3. Click "Add Route"
4. ✅ **VERIFY:** Operator dropdown shows ALL operators
5. Select an operator
6. ✅ **VERIFY:** Bus dropdown filters to show only that operator's buses
7. Fill in route details
8. Submit
9. ✅ **VERIFY:** Route created successfully

### Scenario 6: Operator Bus Management

**Expected:** Operator only sees their own buses

**Steps:**
1. Login as operator
2. Click "My Buses"
3. ✅ **VERIFY:** Only operator's buses are displayed
4. Open DevTools → Network
5. Refresh page
6. ✅ **VERIFY:** API call is to `/api/operator-management/buses`

### Scenario 7: Security - Unauthorized Access

**Expected:** Operators cannot access other operators' data

**Test with API calls:**
1. Login as Operator A
2. Get Operator A's ID from localStorage or API response
3. Try to access another operator's data:
```javascript
// This should fail or return only Operator A's data
fetch('http://localhost:5000/api/operator-management/routes', {
  headers: { 
    'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
  }
}).then(r => r.json()).then(console.log)
```
4. ✅ **VERIFY:** Only Operator A's routes returned (enforced by backend)

## Quick Visual Checks

### Operator Dashboard
- [ ] Shows total buses (only operator's)
- [ ] Shows total routes (only operator's)
- [ ] Shows today's bookings (only for operator's routes)
- [ ] Shows monthly revenue (only for operator's routes)
- [ ] Recent bookings list (only operator's routes)

### Operator Routes Page
- [ ] "Add Route" button visible
- [ ] Routes count accurate
- [ ] Each route shows: origin, destination, bus, price
- [ ] Performance metrics shown per route

### Admin Dashboard
- [ ] Shows ALL operators' data
- [ ] Shows ALL routes
- [ ] Shows ALL buses

## Common Issues to Check

### Issue: Blank page after login
- ✅ Should be FIXED - operator sees OperatorLayout
- Check: App.tsx role check working

### Issue: Operator sees all routes
- ✅ Should be FIXED - operator sees only their routes
- Check: API endpoint is /operator-management/routes

### Issue: Can't add routes
- ✅ Should be FIXED - "Add Route" button and form available
- Check: Operator has buses to assign

### Issue: Form submission fails
- Check: All required fields filled
- Check: Bus selected belongs to operator
- Check: Network tab for API errors

## API Endpoint Summary

### Public/General (all authenticated users)
- `GET /api/routes` - All routes (filtered by approval)
- `GET /api/routes/:id` - Single route

### Operator-Specific (operators only)
- `GET /api/operator-management/routes` - Only my routes
- `GET /api/operator-management/buses` - Only my buses
- `POST /api/operator-management/routes` - Create my route
- `POST /api/operator-management/buses` - Create my bus
- `GET /api/operator-management/bookings` - Only my bookings
- `GET /api/operator-management/dashboard` - My dashboard data

### Admin (admins only)
- `POST /api/routes` - Create route for any operator
- `POST /api/buses` - Create bus for any operator
- All other admin endpoints

## Success Criteria

✅ All tests pass  
✅ No console errors  
✅ No TypeScript errors  
✅ Data isolation verified  
✅ Route creation works  
✅ Dashboard displays correctly

## Troubleshooting

### If operator sees blank page:
1. Check browser console for errors
2. Verify token is valid (not expired)
3. Verify user role is 'OPERATOR'
4. Check App.tsx routing logic

### If operator sees all routes:
1. Check which API endpoint is called
2. Should be `/operator-management/routes` not `/routes`
3. Check Network tab in DevTools

### If route creation fails:
1. Check operator has buses registered
2. Verify operator is approved
3. Check API error message
4. Verify bus belongs to operator

---

**Testing Time:** ~15-20 minutes  
**Priority:** HIGH  
**Status:** Ready for testing
