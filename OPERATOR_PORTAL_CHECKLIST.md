# Operator Passenger Portal - Implementation Checklist

## 📋 Quick Reference Checklist

Use this checklist to track implementation progress for the Operator Passenger Portal feature.

---

## Phase 1: MVP (5-7 Days)

### Database & Backend API (Days 1-2)

#### Database Schema
- [x] **Add new fields to Operator model** ✅ COMPLETE (2026-07-17)
  - [x] Add `slug` field (String, unique)
  - [x] Add `brandLogoUrl` field (String, optional)
  - [x] Add `brandColor` field (String, optional)
  - [x] Add `tagline` field (String, optional)
  - [x] Add `description` field (Text, optional)
  - [x] Add `portalEnabled` field (Boolean, default false)
  
- [x] **Run Prisma migration** ✅ Migration created and applied
  - Migration: `20260717060817_add_operator_portal_fields`
  - Database: Development DB reset and migrated successfully
  - Commit: a90b8c8

- [x] **Generate Prisma client** ✅ Regenerated after migration
  - Prisma Client v5.22.0 generated successfully

- [ ] **Seed sample data for testing** ⏳ NEXT STEP
  - [ ] Create script to generate slugs for existing operators
  - [ ] Add sample branding data for 2-3 test operators

#### Backend API Routes

- [x] **Create `operator-portal.ts` route file** ✅ COMPLETE
  - Location: `transconnect-backend/src/routes/operator-portal.ts`
  - 310 lines, fully implemented with error handling
  - Commit: 7755e01, fb31454
  
- [x] **Implement public endpoints (no auth required):** ✅ ALL 4 ENDPOINTS COMPLETE
  - [x] `GET /api/operator-portal/slug/:slug` - Get operator by slug with routes/buses/stats
  - [x] `GET /api/operator-portal/:operatorId/routes` - Get operator routes (with filters)
  - [x] `GET /api/operator-portal/:operatorId/stats` - Get operator statistics
  - [x] `GET /api/operator-portal/feature/status` - Check feature flag status
  - **Feature Flags:** All endpoints protected by `OPERATOR_PORTAL` flag
  - **Validation:** Portal enabled check, operator existence check, error handling
  
- [x] **Update `operator-management.ts` with configuration endpoints:** ✅ COMPLETE
  - [x] `GET /api/operator-management/portal-config` - Get portal config (JWT auth + OPERATOR role)
  - [x] `PATCH /api/operator-management/portal-config` - Update portal config (JWT auth + validation)
  - **Feature Flags:** Protected by `OPERATOR_PORTAL_CONFIG` flag
  - **Validation:** 
    - Slug format (3-50 chars, lowercase alphanumeric + hyphens)
    - Slug uniqueness enforcement
    - Brand color validation (hex #RRGGBB)
    - Tagline max 100 chars
    - Description max 500 chars
  
- [x] **Register routes in `index.ts`** ✅ COMPLETE
  - Routes registered at line ~170
  - Correct middleware order (after CORS, before health check)
  - Commit: 7755e01

- [ ] **Test API endpoints with Postman/curl** ⏳ IN PROGRESS
  - **Testing Guide:** See `OPERATOR_PORTAL_API_TESTING.md`
  - **Server Status:** Starting (compiling TypeScript)
  - [ ] Test getting operator by slug
  - [ ] Test getting operator routes
  - [ ] Test getting operator stats
  - [ ] Test updating portal configuration
  - [ ] Test feature flag status
  - [ ] Test error cases (invalid slug, portal disabled, unauthorized)

---

### Frontend - Passenger Portal (Days 3-4)

#### Operator Portal Page

- [ ] **Create operator portal page**
  - Location: `transconnect-web/src/app/operator/[slug]/page.tsx`
  
- [ ] **Implement page sections:**
  - [ ] Header with operator logo & branding
  - [ ] Stats bar (routes, buses, bookings, experience)
  - [ ] About Us section
  - [ ] Available Routes grid
  - [ ] Fleet showcase
  - [ ] Footer with TransConnect branding
  
- [ ] **Apply custom branding:**
  - [ ] Dynamic primary color from operator data
  - [ ] Logo display (with fallback)
  - [ ] Company name and tagline
  
- [ ] **Implement responsive design:**
  - [ ] Desktop view (3-4 column grid)
  - [ ] Tablet view (2 column grid)
  - [ ] Mobile view (single column)
  
- [ ] **Handle error states:**
  - [ ] 404 page for invalid slug
  - [ ] 404 page for disabled portal
  - [ ] Loading state
  - [ ] Network error handling

- [ ] **SEO optimization:**
  - [ ] Dynamic meta tags (title, description)
  - [ ] Open Graph tags for social sharing
  - [ ] Structured data for rich snippets

#### Booking Flow Integration

- [ ] **Ensure booking from operator portal works:**
  - [ ] Route detail page loads correctly
  - [ ] Seat selection works
  - [ ] Payment integration works
  - [ ] QR ticket generation works
  - [ ] Booking appears in operator dashboard

---

### Frontend - Operator Configuration UI (Days 4-5)

#### Operator Portal Config Component

- [ ] **Create portal config component**
  - Location: `transconnect-admin/src/components/operator/OperatorPortalConfig.tsx`
  
- [ ] **Implement configuration form:**
  - [ ] Enable/Disable portal toggle
  - [ ] Portal URL slug input (with validation)
  - [ ] Brand logo URL input
  - [ ] Brand color picker
  - [ ] Company tagline input (max 100 chars)
  - [ ] About company textarea (max 500 chars)
  - [ ] Character counters
  
- [ ] **Form validation:**
  - [ ] Slug format validation (lowercase, alphanumeric, hyphens)
  - [ ] Slug uniqueness check
  - [ ] URL validation for logo
  - [ ] Required field validation
  
- [ ] **UI features:**
  - [ ] Preview portal button
  - [ ] Save configuration button
  - [ ] Success/error messages
  - [ ] Copy portal URL button
  - [ ] Generated portal URL display

#### Navigation Integration

- [ ] **Add to operator navigation menu**
  - Location: `transconnect-admin/src/components/operator/OperatorLayout.tsx`
  - [ ] Add "My Portal" nav item
  - [ ] Add Globe icon import
  - [ ] Add route for `/portal`
  
- [ ] **Add route in router**
  ```typescript
  <Route path="/portal" element={<OperatorPortalConfig />} />
  ```

---

### Testing & QA (Days 6-7)

#### Unit Testing

- [ ] **Backend tests:**
  - [ ] Test operator portal endpoints
  - [ ] Test portal configuration update
  - [ ] Test slug uniqueness validation
  - [ ] Test portal enabled/disabled logic
  
- [ ] **Frontend tests:**
  - [ ] Test operator portal page loading
  - [ ] Test configuration form validation
  - [ ] Test responsive design breakpoints

#### Integration Testing

- [ ] **End-to-end booking flow:**
  - [ ] Load operator portal by slug
  - [ ] Browse available routes
  - [ ] Select a route
  - [ ] Complete booking
  - [ ] Verify QR ticket generated
  - [ ] Verify booking appears in operator dashboard
  
- [ ] **Portal configuration flow:**
  - [ ] Operator logs in
  - [ ] Navigate to "My Portal"
  - [ ] Configure portal settings
  - [ ] Save configuration
  - [ ] Preview portal
  - [ ] Verify changes reflected on public portal

#### Security Testing

- [ ] **Test access control:**
  - [ ] Verify operators can only edit their own portal
  - [ ] Verify public endpoints don't expose sensitive data
  - [ ] Verify disabled portals return 404
  - [ ] Test XSS prevention in user inputs
  
- [ ] **Test input validation:**
  - [ ] Test slug injection attacks
  - [ ] Test URL validation
  - [ ] Test HTML injection in description
  - [ ] Test SQL injection attempts

#### Performance Testing

- [ ] **Load testing:**
  - [ ] Test portal page load time
  - [ ] Test with multiple concurrent users
  - [ ] Test image loading performance
  - [ ] Test API response times

---

## Phase 2: Enhancement (3-5 Days)

### Analytics & Metrics

- [ ] **Add portal visit tracking**
  - [ ] Create `OperatorPortalVisit` model
  - [ ] Log visits to operator portals
  - [ ] Track referrer sources
  
- [ ] **Build analytics dashboard**
  - [ ] Portal views chart
  - [ ] Bookings from portal
  - [ ] Revenue from portal
  - [ ] Traffic sources breakdown
  - [ ] Top routes from portal

### SEO Optimization

- [ ] **Enhanced meta tags:**
  - [ ] Dynamic OpenGraph images
  - [ ] Twitter cards
  - [ ] Structured data (Schema.org)
  - [ ] Sitemap inclusion
  
- [ ] **Performance optimization:**
  - [ ] Image optimization
  - [ ] Lazy loading
  - [ ] Code splitting
  - [ ] CDN integration

### Marketing Tools

- [ ] **QR code generator:**
  - [ ] Generate QR code for portal URL
  - [ ] Downloadable QR code image
  - [ ] Printable marketing materials
  
- [ ] **Social sharing:**
  - [ ] Share to WhatsApp button
  - [ ] Share to Facebook button
  - [ ] Share to Twitter button
  - [ ] Copy link button
  
- [ ] **Embeddable widget:**
  - [ ] Generate embed code for operator website
  - [ ] Styled iframe widget
  - [ ] Responsive embed

---

## Phase 3: Premium Features (10-14 Days)

### Subdomain Support

- [ ] **Infrastructure setup:**
  - [ ] Configure DNS wildcard (*.transconnect.app)
  - [ ] Setup SSL certificates
  - [ ] Update Nginx/routing configuration
  
- [ ] **Backend changes:**
  - [ ] Add subdomain detection middleware
  - [ ] Route subdomain requests to operator portal
  - [ ] Handle subdomain fallback
  
- [ ] **Admin UI:**
  - [ ] Subdomain management UI
  - [ ] Subdomain availability check
  - [ ] Subdomain activation toggle

### Custom Domain Mapping

- [ ] **Domain verification system:**
  - [ ] CNAME/TXT record verification
  - [ ] SSL certificate generation (Let's Encrypt)
  - [ ] Domain validation flow
  
- [ ] **Backend support:**
  - [ ] Custom domain mapping table
  - [ ] Domain resolution middleware
  - [ ] SSL certificate management
  
- [ ] **Admin UI:**
  - [ ] Custom domain input
  - [ ] DNS instructions
  - [ ] Verification status display

### Advanced Customization

- [ ] **Custom CSS themes:**
  - [ ] Theme editor UI
  - [ ] CSS injection
  - [ ] Theme preview
  - [ ] Theme templates library
  
- [ ] **Additional branding:**
  - [ ] Favicon upload
  - [ ] Custom fonts
  - [ ] Banner images
  - [ ] Social media links

### Subscription Tiers

- [ ] **Pricing tiers:**
  - [ ] Free tier (path-based URL)
  - [ ] Premium tier (subdomain)
  - [ ] Enterprise tier (custom domain)
  
- [ ] **Payment integration:**
  - [ ] Subscription billing
  - [ ] Payment gateway integration
  - [ ] Invoice generation
  
- [ ] **Feature gating:**
  - [ ] Check subscription tier
  - [ ] Feature restrictions
  - [ ] Upgrade prompts

---

## Deployment Checklist

### Staging Deployment

- [ ] **Database:**
  - [ ] Run migrations on staging database
  - [ ] Seed test data
  - [ ] Verify schema changes
  
- [ ] **Backend:**
  - [ ] Deploy backend to staging
  - [ ] Verify environment variables
  - [ ] Test API endpoints
  - [ ] Check logs for errors
  
- [ ] **Frontend:**
  - [ ] Build web portal
  - [ ] Build admin dashboard
  - [ ] Deploy to staging
  - [ ] Verify environment configuration
  
- [ ] **Testing:**
  - [ ] Smoke test all features
  - [ ] Test with real operator accounts
  - [ ] Verify booking flow
  - [ ] Check mobile responsiveness

### Production Deployment

- [ ] **Pre-deployment:**
  - [ ] Backup production database
  - [ ] Review all code changes
  - [ ] Prepare rollback plan
  - [ ] Schedule maintenance window (if needed)
  
- [ ] **Database:**
  - [ ] Run migrations on production
  - [ ] Verify data integrity
  - [ ] Create indexes if needed
  
- [ ] **Backend:**
  - [ ] Deploy backend to production
  - [ ] Verify environment variables
  - [ ] Test API endpoints
  - [ ] Monitor error logs
  
- [ ] **Frontend:**
  - [ ] Build production bundles
  - [ ] Deploy web portal
  - [ ] Deploy admin dashboard
  - [ ] Clear CDN cache
  
- [ ] **Monitoring:**
  - [ ] Check application health
  - [ ] Monitor error rates
  - [ ] Check database performance
  - [ ] Monitor API response times
  
- [ ] **Post-deployment:**
  - [ ] Test critical user flows
  - [ ] Verify operator portal access
  - [ ] Check booking flow
  - [ ] Verify payment integration

---

## Documentation Checklist

### User Documentation

- [ ] **Operator Guide:**
  - [ ] How to access portal configuration
  - [ ] How to customize branding
  - [ ] How to share portal URL
  - [ ] Best practices for marketing
  
- [ ] **Marketing Guide:**
  - [ ] Sample social media posts
  - [ ] WhatsApp message templates
  - [ ] QR code usage guide
  - [ ] SEO tips for operators

### Technical Documentation

- [ ] **API Documentation:**
  - [ ] Document new endpoints
  - [ ] Add request/response examples
  - [ ] Update Swagger/OpenAPI spec
  
- [ ] **Developer Guide:**
  - [ ] Architecture overview
  - [ ] Database schema changes
  - [ ] Code structure documentation
  - [ ] Deployment guide

### Support Documentation

- [ ] **FAQ:**
  - [ ] How to enable operator portal?
  - [ ] How to change portal URL?
  - [ ] Why is my portal not showing?
  - [ ] How to track portal performance?
  
- [ ] **Troubleshooting:**
  - [ ] Portal not accessible
  - [ ] Branding not updating
  - [ ] Routes not showing
  - [ ] Booking flow errors

---

## Sign-off Checklist

### Development Team

- [ ] Backend developer review complete
- [ ] Frontend developer review complete
- [ ] All tests passing
- [ ] Code review complete
- [ ] No critical bugs

### QA Team

- [ ] Functional testing complete
- [ ] Integration testing complete
- [ ] Security testing complete
- [ ] Performance testing complete
- [ ] Test report generated

### Product Team

- [ ] Feature meets requirements
- [ ] User experience approved
- [ ] Documentation complete
- [ ] Training materials ready
- [ ] Marketing materials ready

### Operations Team

- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] Support team briefed

### Business Approval

- [ ] Product owner sign-off
- [ ] Stakeholder approval
- [ ] Go-live date confirmed
- [ ] Communication plan ready

---

## Success Metrics (Post-Launch)

### Week 1
- [ ] Track number of operators who enable portal
- [ ] Monitor portal page views
- [ ] Track bookings from operator portals
- [ ] Collect operator feedback

### Week 2-4
- [ ] Analyze conversion rates
- [ ] Identify popular operators
- [ ] Monitor error rates
- [ ] Gather user feedback

### Month 2-3
- [ ] Measure adoption rate
- [ ] Calculate ROI
- [ ] Identify improvement areas
- [ ] Plan Phase 2/3 features

---

**Last Updated:** 2026-07-16  
**Version:** 1.0  
**Status:** Ready for Review

---

*Use this checklist to ensure nothing is missed during implementation!*
