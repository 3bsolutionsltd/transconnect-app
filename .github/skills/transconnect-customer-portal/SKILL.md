# TransConnect Customer Portal Skill

## Purpose
Define implementation behavior for the main traveller-facing TransConnect web portal so new and updated pages consistently match the approved General Portal visual direction.

## Product Surface
- transconnect-web public and authenticated customer pages.
- Includes landing, auth, search, route details, booking, ticket, profile, and bookings history flows.
- Explicitly excludes operator-branded portal customization patterns (handled by the operator portal skill).

## Use This Skill When
- Designing or implementing customer-facing screens and flows.
- Updating navigation, search, booking, ticket, and account experiences.
- Refining UI to match approved reference outcomes.
- Migrating older pages away from page-level hardcoded styles into shared primitives.

## Experience Pillars
1. Fast route discovery.
2. Clear price and schedule confidence.
3. Low-friction booking and payment.
4. Reliable post-booking support and ticket access.
5. Consistent trust language and layout rhythm across all customer pages.

## Reference Alignment (Main Portal)
Implement to match the approved customer references for:
1. Landing: immersive hero, elevated route search strip, trust-value sections, strong CTA hierarchy.
2. Auth (Sign in / Register): split layout with left brand story panel and right form panel.
3. Search: dense route list cards with filter rail, strong price/time hierarchy, quick CTA.
4. Bookings list: summary stat cards, filter tabs, searchable rows, prominent ticket and payment actions.
5. Booking/Ticket detail: dual-column layout with itinerary confidence panel, ticket card, and support actions.
6. Profile: sidebar account nav, stats strip, editable profile form with clear save path.

## Visual Direction
- Match approved general portal look and feel from current references.
- Use the shared TransConnect Design System Skill for all styling decisions.
- Keep hierarchy clear: route, time, price, availability, action.
- Keep the global shell consistent: dark header, clean light content surface, branded footer.
- Preserve strong information grouping with cards, section headers, and subtle separators.

## Interaction Rules
1. Search is always prominent and easy to retry.
2. Route cards must show operator, departure, arrival, duration, price, and CTA.
3. Booking/ticket screens must show status clearly (confirmed, pending, cancelled).
4. Empty and error states should include clear next action.
5. Important account actions must remain visible on mobile and desktop.
6. Payment-related or post-booking actions should not be hidden behind secondary menus.
7. Primary CTA must remain visually dominant over secondary actions.

## Content Tone
- Reassuring, practical, and concise.
- Prioritize clarity over marketing language in transactional screens.
- Use explicit action labels: Search Routes, View Ticket, Pay Now, Save Changes, Contact Support.

## Technical Guardrails
- Compose with shared components from transconnect-web/src/components/styled/index.tsx.
- Use tokens/classes from transconnect-web/src/lib/theme.ts and transconnect-web/src/app/globals.css.
- Avoid hardcoded colors, spacing systems, and one-off typography per page.
- Prefer extending shared primitives/utilities over creating isolated page-only visual helpers.
- Preserve responsive behavior as first-class, not post-fix.

## Implementation Workflow
1. Start from shared shell: Header, page container, section rhythm, footer.
2. Build page-specific blocks using shared cards/buttons/badges/inputs.
3. Apply token classes for status, spacing, typography, and state.
4. Validate hierarchy against reference intent (not just pixel mimicry).
5. Verify mobile usability for primary actions and forms before closing work.

## Do / Do Not
### Do
- Reuse existing primitives and extend them when a pattern repeats.
- Keep route and ticket data legible with predictable row/card structure.
- Keep status indicators consistent across bookings and tickets.

### Do Not
- Rebuild core styles ad hoc in individual page files.
- Introduce page-specific color palettes that diverge from the main portal.
- Hide critical conversion actions below weak or ambiguous labels.

## Done Criteria
- UI matches approved general portal style direction.
- Flow remains readable and efficient on small screens.
- Styling is reusable and consistent with system primitives.
- Core customer journeys (discover, book, manage, support) are visually and behaviorally coherent end-to-end.
