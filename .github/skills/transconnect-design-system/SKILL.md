# TransConnect Design System Skill

## Purpose
Single source of truth for shared UI foundations across all web surfaces in this repository.

## Scope
- Shared tokens, primitives, spacing, typography, states, and accessibility rules.
- Applies to both traveller-facing and operator-facing products.
- Enforces a token-first approach so page-level hardcoded styling is avoided.

## Use This Skill When
- Creating or updating UI in transconnect-web.
- Creating or updating UI in operator portal pages in transconnect-web/src/app/operator/[slug].
- Refactoring repeated styles into reusable components/utilities.

## Core Rule
Do not hardcode visual styles in individual pages when a reusable token, utility, or styled component can be used.

## Source of Truth
- transconnect-web/src/lib/theme.ts
- transconnect-web/src/components/styled/index.tsx
- transconnect-web/src/app/globals.css

## Standards
1. Colors: use design tokens from theme and CSS variables from globals.css.
2. Typography: use heading and text utility classes (tc-heading-*, tc-text-*).
3. Spacing/layout: use shared section/container patterns.
4. Inputs/buttons/cards: use shared primitives before creating new variants.
5. States: include hover, focus, disabled, loading, and error states.
6. Accessibility: keyboard navigable, visible focus ring, semantic labels, contrast-safe colors.

## Implementation Protocol
1. Check if an existing component or utility already solves the need.
2. If no existing primitive fits, extend shared component files first.
3. Keep page files focused on composition, not styling internals.
4. Keep new class additions generic and reusable.
5. Validate desktop and mobile layouts before finishing.

## Output Expectations
- A reusable component or utility update, plus page adoption.
- No duplicated style blocks across multiple pages.
- Consistent TransConnect brand language across all portals.

## Done Criteria
- No obvious hardcoded one-off styles in page components.
- Shared primitives are used for repeated UI patterns.
- UI remains visually consistent with existing migrated pages.
