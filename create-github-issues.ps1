# TransConnect GitHub Issues Creator
# Run this script to create all project tracking issues

$repo = "3bsolutionsltd/transconnect-app"

Write-Host "Creating GitHub issues for TransConnect MVP..." -ForegroundColor Cyan

# Issue #1: Test Complete Booking Flow
Write-Host "`n[1/9] Creating: Test Complete Booking Flow" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Test Complete Booking Flow Before Production Launch" `
  --body @"
## Description
Test end-to-end booking flow before production launch to ensure all features work correctly.

## Tasks
- [ ] Search for routes (working ✅)
- [ ] Select route and view details
- [ ] Choose seats on the bus
- [ ] Proceed to payment screen
- [ ] Complete payment with MTN Mobile Money
- [ ] Complete payment with Airtel Money
- [ ] Verify QR ticket generation and display
- [ ] Check booking appears in history
- [ ] Test ticket viewing after booking

## Acceptance Criteria
- All steps complete without errors
- QR code generates and displays correctly
- Payment confirmation received
- Booking stored in database

## Priority
🔴 **Critical** - Production blocker

## Environment
- Mobile App v1.0.10
- Backend: https://transconnect-app-44ie.onrender.com/api
"@ `
  --label "testing,mobile-app,production-blocker,priority:critical"

# Issue #2: Verify Payment Integration
Write-Host "[2/9] Creating: Verify Payment Integration" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Verify Mobile Money Payment Integration" `
  --body @"
## Description
Ensure Mobile Money payments work correctly in production environment with proper error handling.

## Tasks
- [ ] Test MTN Mobile Money payment (sandbox)
- [ ] Test Airtel Money payment (sandbox)
- [ ] Verify payment callbacks from providers
- [ ] Check transaction records saved to database
- [ ] Test payment failure scenarios
- [ ] Verify receipt/confirmation generation
- [ ] Test payment timeout handling
- [ ] Verify refund flow (if applicable)

## Testing Checklist
- [ ] Small amount transaction (< 10,000 UGX)
- [ ] Large amount transaction (> 100,000 UGX)
- [ ] Network timeout simulation
- [ ] Declined payment handling

## Acceptance Criteria
- Both MTN and Airtel payments complete successfully
- Payment status updates in real-time
- User receives confirmation
- Transaction appears in admin dashboard

## Priority
🔴 **Critical** - Production blocker

## Related
- Payment processor: MTN Mobile Money, Airtel Money
- Backend payment endpoints
"@ `
  --label "payments,backend,production-blocker,priority:critical"

# Issue #3: Complete Play Store Production Release
Write-Host "[3/9] Creating: Complete Play Store Production Release" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Complete Google Play Store Production Release" `
  --body @"
## Description
Finalize and submit TransConnect mobile app to Google Play Store production track.

## Completed ✅
- [x] Build production APK/AAB (v1.0.10)
- [x] Complete Data Safety questionnaire
- [x] Set Privacy Policy URL
- [x] Configure Content Rating
- [x] Set up Store Listing
- [x] Add release notes

## Remaining Tasks
- [ ] Select target countries (Uganda + East Africa)
- [ ] Configure rollout strategy (20% staged recommended)
- [ ] Upload deobfuscation file (optional but recommended)
- [ ] Review all settings and information
- [ ] Submit for Google Play review
- [ ] Monitor review status daily
- [ ] Respond to any Google feedback
- [ ] Approve final rollout after review

## Release Details
- Version: 1.0.10 (versionCode: 11)
- Build: https://expo.dev/artifacts/eas/cCD5pGXQWm3fofEcXyAp6T.aab
- Target countries: Uganda (expand later)
- Rollout: 20% staged (increase to 100% after monitoring)

## Priority
🔴 **Critical** - Production blocker

## Timeline
- Review time: 1-7 days (typically 2-3 days)
- Goal: Live on Play Store by end of month
"@ `
  --label "mobile-app,deployment,play-store,production-blocker,priority:critical"

# Issue #4: Set Up Production Monitoring
Write-Host "[4/9] Creating: Set Up Production Monitoring" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Set Up Production Monitoring and Alerting" `
  --body @"
## Description
Implement comprehensive monitoring and alerting for production environment to catch issues early.

## Backend Monitoring
- [ ] Set up uptime monitoring (UptimeRobot or similar)
- [ ] Configure error tracking (Sentry for Node.js)
- [ ] Set up database performance monitoring
- [ ] Monitor API response times
- [ ] Track memory/CPU usage on Render

## Mobile App Monitoring
- [ ] Configure Firebase Crashlytics
- [ ] Set up error logging
- [ ] Track app performance metrics
- [ ] Monitor API call failures

## Alerting
- [ ] Email alerts for backend downtime
- [ ] Slack/Discord webhook for critical errors
- [ ] Daily summary reports
- [ ] Payment failure notifications

## Analytics
- [ ] Set up Google Analytics for mobile
- [ ] Track key user actions (searches, bookings)
- [ ] Monitor conversion funnel
- [ ] Create admin analytics dashboard

## Priority
🟡 **High** - Should be done before full rollout

## Recommended Tools
- Sentry (free tier for startups)
- Firebase Analytics & Crashlytics (free)
- UptimeRobot (free tier)
"@ `
  --label "devops,monitoring,backend,mobile-app,priority:high"

# Issue #5: Create Operator Onboarding Guide
Write-Host "[5/9] Creating: Create Operator Onboarding Guide" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Create Operator Onboarding Documentation" `
  --body @"
## Description
Comprehensive documentation and training materials for bus operators joining TransConnect platform.

## Documentation Tasks
- [ ] Write operator registration guide
- [ ] Create QR scanner usage instructions
- [ ] Document manifest/schedule management
- [ ] Explain payment settlement process
- [ ] FAQ for common operator questions
- [ ] Terms and conditions for operators

## Training Materials
- [ ] Step-by-step onboarding checklist
- [ ] Screenshot walkthrough for admin panel
- [ ] Video tutorial (optional but recommended)
- [ ] Quick reference card (printable PDF)

## Admin Panel Features to Document
- [ ] Adding buses and routes
- [ ] Managing schedules
- [ ] Scanning tickets with QR reader
- [ ] Viewing bookings and manifests
- [ ] Accessing revenue reports

## Deliverables
- Operator handbook (PDF)
- Video tutorial (5-10 minutes)
- Quick start guide (1-page)

## Priority
🟡 **High** - Needed for operator onboarding

## Timeline
Complete before marketing to bus companies
"@ `
  --label "documentation,operators,admin-panel,priority:high"

# Issue #6: Implement User Feedback System
Write-Host "[6/9] Creating: Implement User Feedback System" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Add In-App Feedback and Support System" `
  --body @"
## Description
Enable users to provide feedback and get support directly through the mobile app.

## Features to Implement
- [ ] In-app feedback form
- [ ] Rating prompt after first successful booking
- [ ] Support/Help section in app
- [ ] Report a problem feature
- [ ] Contact support button (email/WhatsApp)

## Backend Support
- [ ] Create feedback submission endpoint
- [ ] Store feedback in database
- [ ] Email notifications for new feedback
- [ ] Admin panel to view feedback

## User Experience
- [ ] Non-intrusive rating prompt (after 1st booking)
- [ ] Easy access to help/support
- [ ] Clear response expectations
- [ ] Thank you message after submission

## Integration Points
- Support email: support@transconnect.app
- WhatsApp support (optional)
- Help center/FAQ page

## Priority
🟢 **Medium** - Post-launch enhancement

## Success Metrics
- Feedback submission rate
- Average user rating
- Support ticket response time
"@ `
  --label "enhancement,mobile-app,user-experience,priority:medium"

# Issue #7: Add Route Notifications
Write-Host "[7/9] Creating: Add Route Notifications" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Implement Trip Reminder Notifications" `
  --body @"
## Description
Notify users about upcoming trips, boarding times, and schedule changes via push notifications.

## Notification Types
- [ ] Trip reminder (24 hours before departure)
- [ ] Boarding reminder (2 hours before departure)
- [ ] Route delay/cancellation alerts
- [ ] Payment confirmation
- [ ] Booking confirmation

## Technical Implementation
- [ ] Schedule notification system (cron jobs)
- [ ] FCM notification templates
- [ ] User notification preferences
- [ ] Notification history in app
- [ ] Deep linking to booking details

## Backend Tasks
- [ ] Create notification scheduling service
- [ ] Queue system for batch notifications
- [ ] Retry logic for failed deliveries
- [ ] Admin interface to send manual notifications

## User Settings
- [ ] Toggle notifications on/off
- [ ] Set reminder preferences
- [ ] Quiet hours setting

## Priority
🟢 **Medium** - Valuable for user retention

## Dependencies
- Firebase Cloud Messaging (already configured)
- User booking data
- Route schedule data
"@ `
  --label "enhancement,notifications,mobile-app,backend,priority:medium"

# Issue #8: Set Up Automated Testing
Write-Host "[8/9] Creating: Set Up Automated Testing" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Implement Automated Testing Suite" `
  --body @"
## Description
Set up comprehensive automated testing to catch bugs early and ensure code quality.

## Backend Testing
- [ ] Unit tests for API endpoints (Jest)
- [ ] Integration tests for booking flow
- [ ] Database migration tests
- [ ] Payment processing tests (mocked)
- [ ] Authentication/authorization tests

## Mobile App Testing
- [ ] Component unit tests (Jest + React Native Testing Library)
- [ ] Integration tests for screens
- [ ] E2E tests (Detox or Maestro)
- [ ] API integration tests

## CI/CD Pipeline
- [ ] GitHub Actions workflow
- [ ] Run tests on pull requests
- [ ] Automated deployment to staging
- [ ] Code coverage reporting
- [ ] Lint and format checks

## Test Coverage Goals
- Backend: 70%+ coverage
- Mobile: 60%+ coverage
- Critical flows: 100% coverage

## Tools
- Jest (unit/integration testing)
- Supertest (API testing)
- Detox/Maestro (E2E mobile testing)
- GitHub Actions (CI/CD)

## Priority
🟢 **Medium** - Technical debt reduction

## Timeline
Implement incrementally over next sprint
"@ `
  --label "testing,technical-debt,backend,mobile-app,priority:medium"

# Issue #9: Google Service Account for EAS
Write-Host "[9/9] Creating: Google Service Account for EAS" -ForegroundColor Yellow
gh issue create --repo $repo `
  --title "Set Up Automated Play Store Uploads via EAS" `
  --body @"
## Description
Configure Google Service Account to enable automated app submissions to Play Store via EAS CLI.

## Benefits
- Automate Play Store uploads
- Skip manual APK/AAB downloads
- Streamline release process
- Faster deployment cycles

## Steps
- [ ] Go to Google Play Console → Setup → API access
- [ ] Click "Create new service account"
- [ ] Follow link to Google Cloud Console
- [ ] Create service account: 'transconnect-eas-submit'
- [ ] Assign role: Service Account User
- [ ] Create and download JSON key
- [ ] Save key as: transconnect-mobile/android-service-account.json
- [ ] Add to .gitignore (security)
- [ ] Update eas.json with key path
- [ ] Grant Play Console permissions to service account
- [ ] Set permissions: Admin (Release to production)
- [ ] Test automated submission: \`eas submit --platform android\`

## Configuration
\`\`\`json
// eas.json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./android-service-account.json"
      }
    }
  }
}
\`\`\`

## Security Notes
- Never commit JSON key to Git
- Use GitHub Secrets for CI/CD
- Rotate keys periodically
- Limit service account permissions

## Priority
🔵 **Low** - Nice to have (manual upload works fine)

## Status
Manual upload currently working. This is an optimization for future releases.
"@ `
  --label "devops,mobile-app,automation,priority:low"

Write-Host "`n✅ All 9 issues created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/3bsolutionsltd/transconnect-app/issues" -ForegroundColor White
Write-Host "2. Add issues to your GitHub Project" -ForegroundColor White
Write-Host "3. Assign team members as needed" -ForegroundColor White
Write-Host "4. Start working on Critical priority issues first!" -ForegroundColor White
