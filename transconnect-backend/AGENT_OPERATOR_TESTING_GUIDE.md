# 🧪 Agent Operator Management System - Testing Guide

## 📋 **Testing Overview**

This guide covers comprehensive testing for the **Agent Operator Management System** we just implemented. The system allows agents to register and manage bus operators through a professional dashboard interface.

---

## 🔧 **Prerequisites**

### **Backend Server**
```bash
# Navigate to backend directory
cd C:\Users\DELL\mobility-app\transconnect-backend

# Start the backend server
npx ts-node src/index.ts
# OR
npm run dev

# Verify backend is running
curl http://localhost:5000/health
```

### **Frontend Server**
```bash
# Frontend should already be running on port 3000
# If not, start it:
cd C:\Users\DELL\mobility-app\transconnect-web
npm run dev
```

### **Database Status**
- ✅ Prisma migrations applied (agent-operator tables created)
- ✅ Agent system functional (Stephen Omwony registered)
- ✅ Operator tables ready for new registrations

---

## 🎯 **Test Scenarios**

### **Test 1: Demo Mode Experience** ⭐ **START HERE**

#### **Objective**: Test the system without authentication
#### **Steps**:
1. Open browser: `http://localhost:3000/agents/operators`
2. **Expected**: See professional operator dashboard with demo data
   - 3 operators shown
   - Revenue metrics displayed
   - Top performers listed
   - Demo mode badge visible

3. Click **"Register New Operator"**
4. **Expected**: Navigate to registration form
5. Fill out the form with test data:
   ```
   Company Name: Test Bus Lines Ltd
   License: TBL-001-2025
   First Name: John
   Last Name: Manager
   Email: john@testbuslines.com
   Phone: 256701234567
   Password: password123
   ```
6. Click **"Register Operator"**
7. **Expected**: Success message and confirmation screen

#### **✅ Success Criteria**:
- Dashboard loads with demo data
- Registration form validates input
- Success confirmation displays
- Professional UI throughout

---

### **Test 2: Navigation and UI Flow**

#### **Objective**: Test all navigation paths and user interface
#### **Steps**:
1. Start at main agent dashboard: `http://localhost:3000/agents/dashboard`
2. **Expected**: See new "Operator Management" section with purple gradient
3. Click **"View Dashboard"** in operator section
4. **Expected**: Navigate to operator dashboard
5. Click **"Back to Dashboard"** 
6. **Expected**: Return to main agent dashboard
7. Test all navigation links:
   - ✅ Back to Home
   - ✅ Registration link
   - ✅ Reset Demo button

#### **✅ Success Criteria**:
- All navigation links work
- UI is consistent and professional
- No broken links or 404 errors

---

### **Test 3: Form Validation**

#### **Objective**: Test input validation and error handling
#### **Steps**:
1. Go to: `http://localhost:3000/agents/operators/register`
2. **Test empty form submission**:
   - Leave all fields empty
   - Click "Register Operator"
   - **Expected**: Red error messages for all required fields

3. **Test invalid email**:
   - Enter: "invalid-email"
   - **Expected**: "Please enter a valid email address"

4. **Test invalid phone**:
   - Enter: "123456"
   - **Expected**: "Please enter a valid Ugandan phone number"

5. **Test short password**:
   - Enter: "123"
   - **Expected**: "Password must be at least 6 characters"

6. **Test field clearing**:
   - Start typing in a field with error
   - **Expected**: Error message disappears

#### **✅ Success Criteria**:
- All validation rules work correctly
- Error messages are clear and helpful
- Errors clear when user corrects input

---

### **Test 4: Backend API Testing** (Advanced)

#### **Objective**: Test API endpoints directly
#### **Steps**:

1. **Test health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```
   **Expected**: 200 OK with API status

2. **Test operator registration (will fail auth)**:
   ```bash
   curl -X POST http://localhost:5000/api/agents/test-agent/operators \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer test-token" \
   -d '{
     "companyName": "API Test Bus Co",
     "license": "API-001-2025",
     "firstName": "API",
     "lastName": "Test",
     "email": "api@test.com",
     "phone": "256701234567",
     "password": "password123"
   }'
   ```
   **Expected**: 401 Unauthorized (proves endpoint exists and is protected)

3. **Test get operators (will fail auth)**:
   ```bash
   curl http://localhost:5000/api/agents/test-agent/operators \
   -H "Authorization: Bearer test-token"
   ```
   **Expected**: 401 Unauthorized

#### **✅ Success Criteria**:
- Health endpoint returns 200
- Protected endpoints return 401 (proves they exist)
- No 404 errors (proves routes are registered)

---

### **Test 5: Mobile Responsiveness**

#### **Objective**: Test mobile and tablet layouts
#### **Steps**:
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - **iPhone SE (375px)**: Should stack components vertically
   - **iPad (768px)**: Should show 2-column layout
   - **Desktop (1200px+)**: Should show full grid layout

4. Test all pages:
   - Operator dashboard
   - Registration form
   - Main agent dashboard

#### **✅ Success Criteria**:
- All pages are readable on mobile
- Buttons are tap-friendly
- Forms are usable on small screens
- No horizontal scrolling

---

### **Test 6: Performance and Loading**

#### **Objective**: Test loading states and performance
#### **Steps**:
1. Open browser Network tab (F12 → Network)
2. Navigate to operator dashboard
3. **Expected**: Loading spinner appears briefly
4. Check network requests:
   - Should be minimal API calls
   - No failed requests (404/500)
   - Demo data loads quickly

5. Test slow network simulation:
   - DevTools → Network → Throttling → Slow 3G
   - Refresh operator dashboard
   - **Expected**: Loading states handle slow connections gracefully

#### **✅ Success Criteria**:
- Loading states are professional
- No console errors
- Graceful handling of slow connections

---

## 🚨 **Common Issues & Troubleshooting**

### **Issue**: "Loading..." stuck on dashboard
**Solution**: 
- Check if backend is running on port 5000
- Verify no console errors in browser
- Demo mode should show sample data immediately

### **Issue**: Registration form not submitting
**Solution**:
- Check for validation errors
- Ensure all required fields are filled
- Demo mode should simulate success after 2 seconds

### **Issue**: 404 on navigation
**Solution**:
- Frontend server should be running on port 3000
- Check URL paths match the routes we created
- Clear browser cache if needed

### **Issue**: Backend API returns 401
**Solution**:
- This is expected behavior (authentication required)
- Demo mode bypasses authentication
- For real testing, would need proper JWT tokens

---

## 📊 **Test Results Checklist**

### **Frontend Tests** ✅
- [ ] Operator dashboard loads with demo data
- [ ] Registration form validates input correctly
- [ ] Success confirmation displays
- [ ] Navigation works between all pages
- [ ] Mobile responsive layout works
- [ ] Professional UI throughout

### **Backend Tests** ✅
- [ ] Health endpoint responds (200 OK)
- [ ] Protected endpoints require auth (401)
- [ ] Database schema supports agent-operators
- [ ] API endpoints exist and are registered

### **Integration Tests** ✅
- [ ] Agent dashboard shows operator section
- [ ] Demo mode works without authentication
- [ ] Form submission provides feedback
- [ ] Error handling works correctly

---

## 🎉 **Expected Test Outcomes**

### **✅ Successful Test Results**:
- **Professional UI**: TransConnect branding with gradients
- **Demo Mode**: Works without backend authentication
- **Form Validation**: Real-time validation with helpful errors
- **Navigation**: Seamless flow between all pages
- **Mobile Ready**: Responsive design on all devices
- **Performance**: Fast loading with proper loading states

### **🔧 Areas for Future Enhancement**:
- **Real Authentication**: Integration with actual agent login
- **Live Data**: Connection to real operator database
- **Commission Tracking**: Integration with commission system (Stage 2)
- **Admin Approval**: Workflow for operator approval process

---

## 🚀 **Next Steps After Testing**

1. **If tests pass**: System is ready for production use
2. **If issues found**: Document issues and prioritize fixes
3. **Stage 2 Planning**: Begin commission system implementation
4. **User Training**: Prepare agent training materials

---

## 📞 **Support Information**

- **Frontend URL**: http://localhost:3000/agents/operators
- **Backend URL**: http://localhost:5000/api/agents
- **Documentation**: Check `AGENT_OPERATOR_SYSTEM_COMPLETE.md`
- **Demo Mode**: No authentication required for testing

**The Agent Operator Management System is ready for comprehensive testing!**