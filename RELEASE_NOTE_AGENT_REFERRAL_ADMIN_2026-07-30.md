# Release Note: Agent Referral Assignment via Admin Agent Management

Date: 2026-07-30
Scope: Backend + Admin UI + Agent onboarding referral capture

## Summary
This release enables administrators to assign or correct an agent's referrer directly from the Agent Management page and fixes referral-link capture reliability during registration.

## Included Changes

### 1) Admin UI: Set Referrer action
- Added a new `Set Referrer` action in Agent Management.
- Admin can enter a referrer code and choose whether to replace an existing referrer.
- Added inline success/error notices (replaced browser alerts).

### 2) Backend API: manual referral assignment endpoint
- Added endpoint:
  - `PUT /api/agents/admin/:agentId/referral`
- Request body:
  - `referralCode` (string, required)
  - `replaceExisting` (boolean, optional, default true)
- Role restriction:
  - Admin only

### 3) Referral service hardening
- Normalizes referral codes (trim + uppercase).
- Validates and blocks:
  - invalid referral code
  - self-referral
  - conflicting existing referrer when `replaceExisting=false`
- Uses idempotent relation handling to avoid duplicate-link issues.

### 4) Registration flow reliability
- Referral code now applies for both:
  - new agent registration
  - re-registration of existing `PENDING` agents
- Ensures referral links are not lost when users re-attempt onboarding.

### 5) Agent onboarding URL support
- Agent web onboarding now reads referral from URL query params (`ref`, `referralCode`, `referral`) and pre-fills onboarding draft.

## Files Updated
- `transconnect-admin/src/components/AgentManagement.tsx`
- `transconnect-backend/src/routes/agents/index.ts`
- `transconnect-backend/src/services/agents/agent.service.ts`
- `transconnect-backend/src/services/agents/agent-referral.service.ts`
- `transconnect-backend/src/services/agents/agentOperator.service.ts`
- `transconnect-web/src/components/agents/OnboardingFlow.agent.tsx`

## Validation Performed
- Backend TypeScript build passed (`npm run build:dev`).
- Admin production build passed (`npm run build`).

## Deployment Order
1. Deploy backend
2. Deploy admin frontend
3. Deploy web frontend (for referral query prefill behavior)

## Post-Deploy Checks
1. Open Admin Agent Management and verify `Set Referrer` appears per agent.
2. Assign invalid code -> expect validation error notice.
3. Assign valid code with `replaceExisting=true` -> expect success notice.
4. Register via referral link (`/agents/register?ref=<CODE>`) and confirm linkage in admin/reporting.
