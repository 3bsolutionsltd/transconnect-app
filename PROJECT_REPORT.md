# TransConnect MVP1 — Project Report

**Date:** June 4, 2026
**Developed by:** 3B Solutions Ltd & Green Rokon Technologies Ltd
**Repository:** `3bsolutionsltd/transconnect-app` (`main` branch)

---

## 1. Executive Summary

TransConnect MVP1 is a full-stack bus ticketing and ride-connector platform built for the Ugandan market. It consists of four client applications backed by a single REST API, deployed via automated CI/CD to a VPS staging environment. The platform is feature-complete for pilot operations, with production deployment remaining as the final step.

---

## 2. Architecture Overview

| Layer | Technology | Status |
|---|---|---|
| Backend API | Node.js + Express + TypeScript + Prisma ORM v5 | ✅ Complete |
| Database | PostgreSQL 15 | ✅ Running (staging) |
| Web Portal | Next.js 14.0.3, App Router, TypeScript, Tailwind | ✅ Complete |
| Mobile App | React Native (Expo ~54), TypeScript, Zustand | ✅ Complete |
| Admin Dashboard | React CRA, TypeScript, Tailwind, Recharts | ✅ Complete |
| Infrastructure | Docker Compose, Nginx, GitHub Actions CI/CD | ✅ Running |
| Hosting | VPS `207.180.206.147`, staging domain `staging.transconnect.app` | ✅ Live |

---

## 3. Backend API

**Stack:** `express` + `prisma` + `bcryptjs` + `jsonwebtoken` + `socket.io` + `firebase-admin` + `qrcode`

### API Route Modules (20 route files)

| Module | Coverage |
|---|---|
| `auth.ts` | Register, login, JWT refresh, password reset |
| `users.ts` | Profile CRUD, device tokens |
| `operators.ts` | Operator registration, approval, management |
| `buses.ts` | Fleet management |
| `routes.ts` | Route CRUD, search |
| `segments.ts` | Segment-based pricing, stop-over fares |
| `bookings.ts` | Booking creation, seat management |
| `booking-transfers.ts` | Customer transfer requests |
| `manager-transfers.ts` | Manager/admin transfer approval workflow |
| `payments.ts` | Payment initiation, webhook handling |
| `qr.ts` | QR generation and validation |
| `rides.ts` | Ride connector matching |
| `notifications.ts` | Push + in-app notification dispatch |
| `operator-management.ts` | Operator user admin |
| `operator-payments.ts` | Operator revenue views |
| `operator-users.ts` | Staff accounts under operators |
| `admin-operator-users.ts` | Admin-level operator user management |
| `agents/` | Agent onboarding, KYC, profile, wallet, operator assignment |
| `admin/database.ts` | Admin DB utilities |
| `distance.ts` | Google Maps distance calculation |

### Database Schema (14 models)

`User` · `Operator` · `Bus` · `Route` · `RouteStop` · `RouteSegment` · `SegmentPriceVariation` · `Booking` · `Payment` · `Verification` · `BookingTransfer` · `BookingSeatHistory` · `Notification` / `DeviceToken` · `Agent` / `AgentOperator` / `OperatorUser`

> **Notable:** Segment-based pricing supports per-stop fares with weekend/holiday price variations. The booking transfer system includes a full approval workflow with audit trail (`BookingSeatHistory`).

### Key Integrations

- **Payments:** MTN Mobile Money, Airtel Money, Flutterwave, Cash
- **Push Notifications:** Firebase Admin SDK (FCM)
- **SMS/OTP:** Twilio + eSMS Africa
- **Maps:** Google Maps SDK (distance/duration auto-calculation)
- **QR:** `qrcode` library (generate) + scanner validation endpoint
- **Real-time:** Socket.io
- **Email:** Nodemailer
- **Storage:** AWS S3 SDK (document uploads)

### Migrations History

| Migration | Change |
|---|---|
| `20251029` | Init — core schema |
| `20251103` | Payment metadata + webhook logs |
| `20251103` | Notification system |
| `20251107` | Via column, route stops |
| `20251113` | Operator users |
| `20251124` | Agent onboarding + management |
| `20251125` | Agent online tracking |
| `20251126` | MoMo number on agent profile |
| `20260128` | Route segments + segment pricing |
| `20260130` | Optional notification templates |

---

## 4. Web Portal (transconnect-web)

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Zustand · react-hook-form · framer-motion · qrcode.react

### Pages

| Route | Purpose |
|---|---|
| `/` | Landing / home |
| `/search` | Route search |
| `/route/[id]` | Route detail |
| `/payment` | Payment flow |
| `/booking-success` | Confirmation + QR ticket |
| `/bookings` | My bookings |
| `/login` · `/register` | Authentication |
| `/forgot-password` · `/reset-password` | Password recovery |
| `/operators` | Operator listing |
| `/agents` | Agent directory |

---

## 5. Mobile App (transconnect-mobile)

**Stack:** Expo ~54 · React Native 0.81 · TypeScript · Zustand · React Navigation · expo-camera · react-native-qrcode-svg

### Screens

| Section | Screens |
|---|---|
| Auth | Login, Register, ForgotPassword |
| Home | HomeScreen (route search entry) |
| Search | Search results |
| Booking | RouteDetails → SeatSelection → Payment → BookingConfirmation |
| Tickets | TicketDetail (QR display, offline-capable) |
| Bookings | Bookings list |
| Profile | Profile management |
| Agents | Agent flow |

> EAS build configured (`eas.json`). Play Store release notes prepared (`PLAY_STORE_RELEASE_NOTES.txt`).

---

## 6. Admin Dashboard (transconnect-admin)

**Stack:** React CRA · TypeScript · Tailwind · Recharts · react-router-dom · jsqr

### Components

| Component | Function |
|---|---|
| `LoginPage` | Admin authentication |
| `UserManagement` | Platform-wide user admin |
| `OperatorManagement` | Approve/reject bus operators |
| `AgentManagement` | Field agent management |
| `OnlineAgentsView` | Real-time agent tracking |
| `RouteManagement` | Add/edit routes |
| `OperatorUserTable` / Modals | Manage operator staff |
| `QRScannerPage` | Web-based QR ticket validation |
| `TransferBookingModal` | Process booking transfers |

---

## 7. Infrastructure & DevOps

### Docker Services (staging)

| Container | Image | Port |
|---|---|---|
| `backend_staging` | `node:20-alpine` | `127.0.0.1:5001→5000` |
| `web_staging` | `node:18-alpine` | `3010` |
| `admin_staging` | `node:18-alpine` + nginx | `3011` |
| `tc_postgres_staging` | `postgres:15` | internal |

### CI/CD (GitHub Actions)

| Workflow | Trigger | Status |
|---|---|---|
| `deploy-staging.yml` | Push to `main` | ✅ Working (40m timeout, Slack notifications) |
| `deploy-production.yml` | Manual / `production` env | Configured, not yet used |
| `ci-cd.yml` | Pull requests | Configured |

### Backups

- **Script:** `transconnect-infra/scripts/backup.sh`
- **Cron:** `/etc/cron.d/transconnect-backup` — daily at 2am
- **Location:** `/opt/transconnect/staging/backups/` (14-day retention)
- **Tested:** ✅ `transconnect_staging_20260604_133655.sql.gz` (52K)

---

## 8. Development Timeline

| Period | Commits | Focus |
|---|---|---|
| Nov 2025 | 177 | Core platform build (API, web, mobile, admin) |
| Dec 2025 | 23 | Bug fixes, operator flows |
| Jan 2026 | 40 | Route segments, booking transfers (Week 4 & 5) |
| Feb 2026 | 3 | Stabilisation |
| Apr 2026 | 6 | Mobile deployment prep |
| Jun 2026 | 19 | Staging CI/CD, backups, favicon |
| **Total** | **268** | |

---

## 9. Milestone Status

| Milestone | Description | Status |
|---|---|---|
| M1 | Repository setup, scaffolding | ✅ Complete |
| M2 | Core API — auth, routes, bookings | ✅ Complete |
| M3 | QR ticketing + payment integration | ✅ Complete |
| M4 | Mobile app integration | ✅ Complete |
| M5 | Pilot release preparation | 🔄 In Progress |

---

## 10. Outstanding Items

| Item | Priority |
|---|---|
| Production environment setup (VPS env + DB + deploy) | High |
| Play Store submission (build + upload) | Medium |
| Load / stress testing against staging | Medium |
| Flutterwave go-live credentials (sandbox → production) | High |
| FCM production keys | High |

---

> **Codebase summary:** 268 commits · 4 applications · 20 API modules · 14 DB models · fully containerised · automated deploys live.
