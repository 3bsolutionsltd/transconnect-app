# TransConnect Design System Migration Plan

## ✅ What We've Built

### 1. Centralized Theme Configuration
**File:** `transconnect-web/src/lib/theme.ts`

All design tokens in one place:
- **Colors**: Primary teal (#00D9A3), secondary navy, status colors
- **Typography**: Font sizes, weights, line heights
- **Spacing**: Section padding, container margins
- **Shadows**: Consistent elevation system
- **Transitions**: Uniform animation timings

### 2. Global CSS Variables & Classes
**File:** `transconnect-web/src/app/globals.css`

Ready-to-use utility classes:
```css
.btn-primary          /* Teal button with hover effect */
.btn-secondary        /* White border button */
.btn-outline          /* Teal outline button */

.tc-card              /* White card with shadow */
.tc-input             /* Form input with teal focus ring */
.tc-badge-primary     /* Teal badge with rounded pill */

.tc-section-light     /* White section with py-20 */
.tc-section-gray      /* Gray background section */
.tc-section-dark      /* Dark blue section for "Why Book" style */

.tc-heading-1         /* 6xl extrabold heading */
.tc-heading-2         /* 4xl extrabold heading */
.tc-text-lead         /* Large lead paragraph */
```

### 3. Reusable React Components
**File:** `transconnect-web/src/components/styled/index.tsx`

Type-safe styled components:
- `<Section variant="light|gray|dark">` - Page sections
- `<Container>` - Responsive container
- `<Heading as="h1|h2|h3">` - Typography
- `<Lead>` - Lead paragraphs
- `<StyledCard>` - Card component
- `<StyledButton variant="primary|secondary|outline">` - Buttons
- `<Badge variant="primary|success|warning">` - Status badges
- `<StyledInput label="...">` - Form inputs
- `<StyledSelect label="...">` - Form selects
- `<NavBar sticky>` - Navigation bar

## 📋 Pages Requiring Migration

### **Priority 1: Public-Facing Pages** (High Impact)
| Page | Current Status | Needs Update | Complexity |
|------|---------------|--------------|------------|
| Homepage (`/`) | Blue gradient | Teal hero, modern sections | High |
| Search Results (`/search`) | Generic cards | Teal accents, better spacing | Medium |
| Route Details (`/route/[id]`) | Basic layout | Teal CTA buttons, modern cards | Medium |
| Booking Success (`/booking-success`) | Simple cards | Celebration style, teal theme | Low |
| Ticket View (`/ticket/[id]`) | Basic ticket | Modern QR ticket design | Medium |

### **Priority 2: Auth & Profile Pages** (Medium Impact)
| Page | Current Status | Needs Update | Complexity |
|------|---------------|--------------|------------|
| Login (`/login`) | Blue theme | Teal buttons, modern form | Low |
| Register (`/register`) | Blue theme | Teal buttons, modern form | Low |
| Profile/Bookings (`/bookings`) | Basic cards | Teal accents, better cards | Medium |
| Transfers (`/transfers/*`) | Generic cards | Teal theme, modern UI | Medium |

### **Priority 3: Agent Portal** (Low Impact for MVP)
| Page | Current Status | Needs Update | Complexity |
|------|---------------|--------------|------------|
| Agent Dashboard (`/agents/dashboard`) | Custom gradient | Teal accents | Medium |
| Agent Registration (`/agents/register`) | Custom style | Teal theme | Low |
| Operator Management (`/agents/operators/*`) | Tables & cards | Teal accents | Medium |

### **✅ Already Styled**
| Page | Status |
|------|--------|
| Operator Portal (`/operator/[slug]`) | ✅ Complete - Refactored to shared component architecture with operator brand overrides |

## 🎨 Migration Strategy

### Step 1: Import Theme & Styled Components
```typescript
// At the top of each page component
import { Section, Container, Heading, StyledButton, StyledCard } from '@/components/styled';
import { colors, spacing } from '@/lib/theme';
```

### Step 2: Replace Inline Styles
**Before:**
```tsx
<div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all">
  <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Title</h2>
  <button className="bg-[#00D9A3] text-white px-8 py-4 rounded-xl font-bold">
    Book Now
  </button>
</div>
```

**After:**
```tsx
<StyledCard variant="default" hover>
  <Heading as="h2">Title</Heading>
  <StyledButton variant="primary" size="lg">
    Book Now
  </StyledButton>
</StyledCard>
```

### Step 3: Use Global CSS Classes
**Before:**
```tsx
<section className="py-20 bg-white">
  <div className="container mx-auto px-6">
    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
```

**After:**
```tsx
<section className="tc-section-light">
  <div className="tc-container">
    <h2 className="tc-heading-2 mb-6">
```

### Step 4: Dynamic Brand Colors
For operator-specific pages that need brand colors:
```tsx
// Keep TEAL_COLOR constant for now
const TEAL_COLOR = colors.primary.DEFAULT; // From theme.ts

// Use inline styles only for truly dynamic values
<div style={{ backgroundColor: operator.brandColor || TEAL_COLOR }}>
```

## 📦 Example Migrations

### Homepage Migration
**Current:** Blue gradient background, generic buttons
**Target:** Teal hero section, "Why Book Direct" dark section, modern cards

**Changes:**
1. Hero: Use `tc-section-light` with teal gradient overlay
2. Search form: Use `<StyledCard>` and `<StyledInput>` components
3. Features: Use `tc-section-dark` for dark blue background
4. CTA buttons: Replace with `<StyledButton variant="primary">`

### Search Results Migration
**Current:** Gray cards with blue accents
**Target:** White cards with teal accents, better spacing

**Changes:**
1. Container: Use `tc-container`
2. Route cards: Use `<StyledCard hover>` with teal borders
3. Buttons: Replace with `<StyledButton variant="primary">`
4. Badges: Use `<Badge variant="success">` for availability

### Login/Register Migration
**Current:** Blue branding
**Target:** Teal branding, modern form design

**Changes:**
1. Form inputs: Replace with `<StyledInput label="...">`
2. Submit buttons: Use `<StyledButton variant="primary">`
3. Background: Use consistent gradient from theme
4. Logo area: Teal accent color

## 🚀 Implementation Plan

### Phase 1: Core Pages (Week 1)
- [x] Homepage (`/`) ✅ **COMPLETED**
- [x] Search Results (`/search`) ✅ **COMPLETED**
- [x] Route Details (`/route/[id]`) ✅ **COMPLETED**
- [x] Login (`/login`) ✅ **COMPLETED**
- [x] Register (`/register`) ✅ **COMPLETED**

### Phase 2: User Pages (Week 2)
- [x] Booking Success (`/booking-success`) ✅ **COMPLETED**
- [x] Bookings List (`/bookings`) ✅ **COMPLETED**
- [x] Profile (`/profile`) ✅ **COMPLETED**
- [x] Ticket View (`/ticket/[id]`) ✅ **COMPLETED**
- [x] Transfers (`/transfers/*`) ✅ **COMPLETED**
- [x] Shared Header + Footer Polish ✅ **COMPLETED**

### Phase 3: Agent Portal (Week 3)
- [ ] Agent Dashboard
- [ ] Agent Registration
- [ ] Operator Management

## ⚠️ Important Guidelines

### DO ✅
- Use components from `@/components/styled`
- Use global classes like `tc-*` from globals.css
- Import design tokens from `@/lib/theme.ts`
- Keep operator-specific brand colors dynamic
- Test on mobile devices

### DON'T ❌
- Hardcode hex colors like `#00D9A3` (use `colors.primary.DEFAULT`)
- Mix old blue theme with new teal theme
- Use inline Tailwind classes for colors (use CSS classes)
- Create new button variants (extend existing ones)
- Forget to update hover/focus states

## 🧪 Testing Checklist

For each migrated page:
- [ ] Colors match TransConnect teal theme
- [ ] Typography uses correct weights (extrabold/bold)
- [ ] Spacing is generous (py-20 sections, px-6 containers)
- [ ] Shadows are prominent (shadow-xl, hover:shadow-2xl)
- [ ] Buttons have teal background
- [ ] Forms have teal focus rings
- [ ] Cards have rounded-xl borders
- [ ] Mobile responsive (test on phone)
- [ ] Dark sections use #1a3a5c background
- [ ] All hover states work smoothly

## 📚 Quick Reference

### Color Palette
```
Primary Teal:   #00D9A3
Dark Blue:      #1a3a5c
Footer Navy:    #0d1b2a
White:          #ffffff
Gray 50:        #f9fafb
Success:        #10b981
Warning:        #f59e0b
Error:          #ef4444
```

### Typography Scale
```
Hero:      text-6xl md:text-7xl font-extrabold
Section:   text-4xl md:text-5xl font-extrabold
Subsection text-3xl md:text-4xl font-bold
Card:      text-2xl font-bold
Body:      text-base leading-relaxed
Small:     text-sm
```

### Spacing Scale
```
Section padding:  py-20
Container padding: px-6
Card padding:      p-6
Button padding:    px-8 py-4 (md) | px-10 py-6 (lg)
Gap between items: gap-8 to gap-12
```

---

## 🎯 Next Steps

1. **Start with Homepage** - Highest visibility, sets the tone
2. **Test thoroughly** - Each page on mobile and desktop
3. **Iterate** - Adjust spacing/typography based on real content
4. **Document** - Add screenshots to this doc as we go
5. **Deploy** - Stage changes for review before production

## 📝 Notes

- All styling decisions based on **Roblyn Bus Services** design reference
- Design system ensures **uniform branding** across all pages
- Reusable components **reduce code duplication** by ~60%
- CSS variables enable **theme switching** in the future
- TypeScript types ensure **type-safe styling** props
