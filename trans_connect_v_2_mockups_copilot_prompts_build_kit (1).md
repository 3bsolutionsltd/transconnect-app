# TransConnect v2 — Mockups, Copilot Prompts & Build Kit

> Hybrid Smart Mobility — Desktop + Mobile UI mockups, component specs, Copilot prompts, flow map, tech stack and implementation plan.

---

## 1) Project overview
- **Goal:** Upgrade TransConnect to a context-aware, multi-modal mobility hub with real-time elements, predictive suggestions, and crisp map-driven UI.
- **Design style:** Option D — *Hybrid Smart Mobility* (Uber + Bolt + Booking.com fusion).
- **Deliverables in this document:** Desktop & Mobile mockup blueprints, component breakdown, copy-ready Copilot prompts, smart flow map, tech stack, implementation milestones, analytics/events list, accessibility checklist, A/B test ideas.

---

## 2) Design system (foundation)

### Palette
- Primary: Deep Navy (#0B1A2B) — anchor for header, nav
- Accent: Electric Teal (#00B3A6) — primary CTAs, map pins
- Highlight: Warm Gold (#FFC857) — micro-copy accents, badges
- Surface: Off-white (#FAFBFC) — cards, containers
- Muted: Slate Gray (#6B7A86) — secondary text

> Note: Use high contrast for CTAs. Provide alternate dark-mode palette (swap surface to #0B1A2B, text to #F3F6F9).

### Typography
- Headline: Inter / Montserrat (600) — large, modern
- Body: Inter (400) — readable, compact
- Sizes: H1 28–34px (desktop), H2 20–24px, body 14–16px, small 12px

### Spacing & radius
- Card radius: 12px
- Buttons: 10–12px padding
- Grid: 8px baseline

---

## 3) Desktop mockups (wireframe descriptions)

### A. Home / Landing (Desktop)
- Top nav: logo left, search center, profile & quick actions right.
- Hero region (left): Large unified search bar placeholder “Where are you headed?” with Mode selector above (Intercity / Local Ride / Stay / Explore).
- Hero region (right): Map panel (interactive) showing nearby drivers, terminals, and highlighted route preview.
- Suggestions strip (below hero): horizontally scrollable cards: “Bus to Gulu — Leaves in 20m”, “Ride to Garden City — 12m away”, each card contains small map thumbnail, ETA, price, CTA.
- Smart Summary card (right column): context-aware suggestion — auto-selected mode, prediction rationale (e.g., "You’re near Nakasero — quick ride likely"), quick actions.

### B. Mode-specific pages
- **Local Ride:** full-screen map, bottom sheet driver cards, fare estimator, quick-book button.
- **Intercity:** list of coaches, departure times, seat layout previews, station map snippet.
- **Stay:** destination-aware hotels list, distance & rating, booking CTA.
- **Explore:** POI cards with distance/time and suggested itineraries.

---

## 4) Mobile mockups (phone-first)

### A. Mobile Home
- Top: compact header with hamburger, logo, profile.
- Search: sticky unified search bar, large tap target.
- Mode selector: horizontally scrollable chips with subtle background change when active.
- Main: Map-first view with overlayed suggestion cards at bottom (drag to expand). Cards include small map snapshot (40% width), title, ETA, price & CTA.
- Micro-interactions: search focus expansion, mode ripple, suggestion card swipe to dismiss.

### B. Booking flow (mobile)
- Step 1: Choose mode & destination.
- Step 2: Confirm pickup; show drivers or buses as map markers.
- Step 3: Fare & seats (if intercity) + recommended nearby stay/POI suggestions.
- Step 4: Payment + confirmation + follow-up: “Hotels near Jinja Terminal” suggestion post-confirmation.

---

## 5) Component breakdown (props & behaviour)

### 1. `ModeSelector` (chips)
- Props: `modes: [{id,label,icon}]`, `activeMode`, `onChange(modeId)`, `contextHints`.
- Behaviour: auto-suggest based on `contextHints` (see Copilot prompt). Styles change based on activeMode.

### 2. `UnifiedSearch` (search bar)
- Props: `placeholder`, `onSearch(query)`, `recentTrips`, `locationHint`.
- Behaviour: predictive autocomplete, quick suggestions (recent + predicted), keyboard-friendly.

### 3. `SuggestionCard`
- Props: `type`, `title`, `subtitle`, `eta`, `price`, `mapSnapshotUrl`, `ctaLabel`, `onClick`.
- Behaviour: shows small map, updates live ETA, supports swipe gestures on mobile.

### 4. `MapSnippet`
- Props: `markers`, `center`, `zoom`, `showRoutePreview`.
- Behaviour: lightweight map tile (static or interactive depending on performance), supports click-to-expand.

### 5. `SmartSummary`
- Props: `prediction`, `explainability` (small text why suggested), `actions`.
- Behaviour: shows why a suggestion was chosen; allows quick override.

### 6. `AnalyticsLayer`
- Exposes: `trackEvent(name, props)`; standard events listed below.

---

## 6) Copilot prompts (paste-ready)

> Paste each prompt into GitHub Copilot/CoPilot Chat to scaffold components. Include the code comments as guidance.

### Prompt A — Mode auto-select logic (React)
```
// Copilot prompt: Implement a React hook `useAutoMode` that suggests the best mode (Intercity / Local Ride / Stay / Explore) based on: geolocation, timeOfDay, userRecentHistory, and deviceType. Return { mode, score, reasons }.
// Keep the hook pure and mock any external services (e.g., reverseGeocode) with clear TODOs for backend calls.
```

### Prompt B — Suggestion engine shell
```
// Copilot prompt: Create a `SuggestionEngine` module that accepts context {location, mode, timeOfDay, recentTrips, nearbyDrivers, schedules} and returns ranked suggestions. Provide a simple rule-based ranking function and placeholder spots for ML model hooks.
```

### Prompt C — MapSnippet component (React + Leaflet or Mapbox)
```
// Copilot prompt: Build a lightweight `MapSnippet` React component using Mapbox GL JS (or Leaflet) that accepts `markers`, `center`, and `onMarkerClick`. Add prop to render static snapshot for low-performance devices.
```

### Prompt D — SuggestionCard with real-time ETA
```
// Copilot prompt: SuggestionCard React component that subscribes to a `etaService` (mock) and updates ETA every 15s. Show micro-animations on update (pulse, fade). Make sure to clean up timers on unmount.
```

### Prompt E — Analytics events helper
```
// Copilot prompt: Implement analytics helper `trackEvent(name, payload)` that batches events and sends to `/api/analytics/batch`. Include debounce and offline queueing.
```

### Prompt F — Accessibility and keyboard navigation
```
// Copilot prompt: Add keyboard navigation to ModeSelector and UnifiedSearch components. Ensure aria roles and live regions for ETA updates. Provide unit tests for focus management.
```

---

## 7) Smart Experience Flow Map (step-by-step)

1. **Initialization** — app reads geolocation, time, device type and loads userProfile (if logged in).
2. **Context Engine** — `useAutoMode` returns suggested mode + reasons.
3. **UI Adapt** — ModeSelector highlights suggested mode; hero changes theme (map vs. imagery).
4. **Suggestions Fetch** — `SuggestionEngine` queries local caches + API for drivers, bus schedules, hotels, POIs.
5. **Ranking & Explainability** — suggestions ranked; `SmartSummary` shows one-line rationale.
6. **User Action** — user taps a suggestion or searches; booking modal opens.
7. **Real-time Updates** — ETA, driver locations update via WebSocket.
8. **Post-booking Hooks** — show follow-up suggestions (stay/explore), prompt feedback after trip.

---

## 8) Tech stack & infra recommendations

- **Frontend:** React (Vite or Next.js) + Tailwind CSS. Use mapbox-gl or Leaflet for maps.
- **State management:** React Query (data), Zustand/MobX for UI ephemeral state.
- **Realtime:** WebSockets (Socket.IO) or Pusher/Ably for location/ETA streaming.
- **Backend:** Node.js (NestJS or Express) + Postgres. Use Redis for caches and short-lived predictions.
- **ML/Prediction (v2+):** Lightweight Python microservice (FastAPI) for personalisation.
- **Analytics:** Segment or self-hosted collector; store events in ClickHouse or Postgres.
- **Hosting:** Vercel for frontend, AWS/GCP for backend services.

---

## 9) Implementation plan & milestones (4-week sprint)

**Week 1 — Foundation**
- Scaffolding (Next.js + Tailwind)
- Design tokens + ModeSelector + UnifiedSearch
- `useAutoMode` hook (rule-based)

**Week 2 — Mapping & Suggestions**
- MapSnippet component
- SuggestionCard + SuggestionEngine (rule-based)
- Basic analytics tracking

**Week 3 — Booking flows & realtime**
- Local Ride booking flow (map + drivers)
- Intercity listing & seat selection
- WebSocket integration for driver locations

**Week 4 — Polish & A/B tests**
- Mobile responsiveness & micro-interactions
- Accessibility audit
- A/B test variants for suggestion wording & CTA

---

## 10) Analytics & events (must-capture)
- `mode_suggested` {mode, score, reasons}
- `mode_changed` {from, to, userInitiated}
- `suggestion_shown` {suggestionId, rank}
- `suggestion_clicked` {suggestionId, mode}
- `search_submitted` {query, mode}
- `booking_initiated` {bookingType, priceEstimate}
- `booking_confirmed` {bookingId, amount}
- `trip_completed` {tripId, rating}

---

## 11) Accessibility & performance checklist
- Ensure colour contrast >= 4.5:1 for body text.
- Provide `aria-live` region for ETA updates.
- Keyboard nav for all interactive controls.
- Lazy-load map tiles & heavy assets; use static snapshots by default on low-memory devices.
- Use image `srcset` and optimized SVG icons.

---

## 12) A/B test ideas
- **CTA wording:** "Ride Now" vs "Book Ride" vs "Get Driver".
- **Suggestion phrasing:** "Fastest option" vs "Cheapest option".
- **Map vs List:** default map-first vs list-first for mobile home.

---

## 13) Deliverables & next steps
- I will create: Desktop + Mobile visual mockups (high-fidelity) ready for Figma handoff, and actionable Copilot prompts.
- Optionally: I can export sample React components as a starter repo.

---

## 14) Files & assets to prepare (for dev handoff)
- Logo in SVG + PNG
- Primary brand colors & font files (or Google Fonts links)
- Example user data (recent trips) for mock personalization
- Map API key (Mapbox)

---

### End of document

*Open this document and tell me which deliverable you'd like next (high-fidelity mockups, a Figma-ready file, or a starter React repo).*

