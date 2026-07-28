# TransConnect Operator Portal Skill

## Purpose
Define UX and UI behavior for operator-branded passenger portals while preserving TransConnect booking reliability.

## Product Surface
- Path-based operator portals: /operator/{operatorSlug}
- Operator-specific branded pages and booking routes.

## Use This Skill When
- Building or refining operator passenger portal pages.
- Implementing operator brand overrides (logo, brand color, tagline, hero media).
- Ensuring filtered content for operator routes, buses, and schedules.

## Experience Pillars
1. Operator brand presence.
2. Trust and legitimacy.
3. Direct booking conversion.
4. Functional parity with core booking experience.

## Brand and UX Rules
1. Operator branding is configurable data, not hardcoded per page.
2. Core layout and components still come from shared design primitives.
3. Operator pages must clearly indicate they are powered by TransConnect.
4. Route and booking interactions should mirror customer portal behavior to reduce confusion.
5. If branding fields are missing, fallback to safe TransConnect defaults.

## Data and Behavior Rules
1. Show only that operator's approved and active routes/buses.
2. Respect portalEnabled and operator approval checks.
3. Keep URL strategy stable: /operator/{operatorSlug}.
4. Display robust not-found state for invalid or disabled portals.

## Technical Guardrails
- Shared styling and components come from the TransConnect Design System Skill.
- Keep operator theming layer thin and token-driven (brandColor, logo, hero image).
- Do not duplicate generic booking UI logic between general and operator portals.

## Done Criteria
- Operator portal has strong brand identity without drifting from platform standards.
- Booking flow remains consistent, predictable, and reusable.
- Styling is maintainable and not page-hardcoded.
