# TransConnect Styling Quick Start Guide

## 🎨 How to Use the Centralized Design System

This guide shows you how to apply uniform TransConnect styling to any page.

---

## 1️⃣ Import the Design System

```typescript
// Method 1: Use styled React components
import { 
  Section, 
  Container, 
  Heading, 
  Lead,
  StyledCard, 
  StyledButton, 
  StyledInput,
  Badge 
} from '@/components/styled';

// Method 2: Import design tokens
import { theme, colors, spacing, typography } from '@/lib/theme';

// Method 3: Use CSS classes (no import needed)
// Classes like tc-card, tc-button-primary, tc-heading-1, etc.
```

---

## 2️⃣ Common Patterns

### 🏠 Page Structure

```tsx
export default function MyPage() {
  return (
    <>
      {/* Header with navigation */}
      <header className="bg-white shadow-sm">
        <Container>
          <nav className="py-4 flex items-center justify-between">
            <Link href="/">TransConnect</Link>
            <button className="btn-primary">Book Now</button>
          </nav>
        </Container>
      </header>

      {/* Hero section - Light background */}
      <Section variant="light">
        <Container>
          <Heading as="h1">Welcome to TransConnect</Heading>
          <Lead>Your journey starts here</Lead>
          <StyledButton variant="primary" size="lg">
            Get Started
          </StyledButton>
        </Container>
      </Section>

      {/* Features section - Gray background */}
      <Section variant="gray">
        <Container>
          <Heading as="h2">Why Choose Us</Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {features.map(feature => (
              <StyledCard key={feature.id}>
                <h3 className="tc-heading-4 mb-3">{feature.title}</h3>
                <p className="tc-text-body">{feature.description}</p>
              </StyledCard>
            ))}
          </div>
        </Container>
      </Section>

      {/* Dark section - Like "Why Book Direct" */}
      <Section variant="dark">
        <Container>
          <Heading as="h2">Special Offer</Heading>
          <p className="tc-text-lead mt-4">Book direct and save!</p>
          <StyledButton variant="secondary" size="lg" className="mt-6">
            Learn More
          </StyledButton>
        </Container>
      </Section>
    </>
  );
}
```

---

## 3️⃣ Before & After Examples

### ❌ Before: Embedded Styling

```tsx
// ❌ Inline Tailwind with hardcoded colors
<div className="py-20 bg-white">
  <div className="container mx-auto px-6">
    <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
      Book Your Bus Ticket
    </h1>
    <p className="text-lg md:text-xl leading-relaxed font-medium text-gray-600 mb-8">
      Travel safely and comfortably
    </p>
    <button className="bg-[#00D9A3] hover:bg-[#00E5B0] text-white font-bold px-10 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all">
      Search Routes
    </button>
  </div>
</div>
```

### ✅ After: Centralized Styling

```tsx
// ✅ Using styled components
<Section variant="light">
  <Container>
    <Heading as="h1">Book Your Bus Ticket</Heading>
    <Lead className="text-gray-600 mb-8">
      Travel safely and comfortably
    </Lead>
    <StyledButton variant="primary" size="lg">
      Search Routes
    </StyledButton>
  </Container>
</Section>
```

---

### ❌ Before: Card with Inline Styles

```tsx
// ❌ Repetitive class strings
<div className="bg-white rounded-xl shadow-lg border-0 p-6 hover:shadow-2xl transition-all duration-300">
  <div className="flex items-center gap-4 mb-4">
    <div className="w-12 h-12 bg-[#00D9A3] rounded-lg flex items-center justify-center">
      <BusIcon className="text-white" />
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900">Express Bus</h3>
      <p className="text-sm text-gray-500">Daily departures</p>
    </div>
  </div>
  <button className="w-full bg-[#00D9A3] text-white font-bold py-3 px-8 rounded-xl transition-all">
    Book Now
  </button>
</div>
```

### ✅ After: Card Component

```tsx
// ✅ Clean and reusable
<StyledCard hover>
  <div className="flex items-center gap-4 mb-4">
    <Badge variant="primary">
      <BusIcon />
    </Badge>
    <div>
      <h3 className="tc-heading-4">Express Bus</h3>
      <p className="text-sm text-gray-500">Daily departures</p>
    </div>
  </div>
  <StyledButton variant="primary" className="w-full">
    Book Now
  </StyledButton>
</StyledCard>
```

---

### ❌ Before: Form with Manual Styling

```tsx
// ❌ Form elements with repetitive classes
<form className="space-y-6">
  <div>
    <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-widest">
      Origin
    </label>
    <input
      type="text"
      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00D9A3] focus:border-transparent font-medium text-gray-900 text-base"
      placeholder="Enter origin"
    />
  </div>
  
  <button
    type="submit"
    className="w-full bg-[#00D9A3] hover:bg-[#00E5B0] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
  >
    Search
  </button>
</form>
```

### ✅ After: Form Components

```tsx
// ✅ Consistent form styling
<form className="space-y-6">
  <StyledInput 
    label="Origin"
    type="text"
    placeholder="Enter origin"
  />
  
  <StyledButton 
    variant="primary" 
    type="submit" 
    className="w-full"
  >
    Search
  </StyledButton>
</form>
```

---

## 4️⃣ Using CSS Classes Directly

For simple cases, use global CSS classes:

```tsx
// Headings
<h1 className="tc-heading-1">Main Title</h1>
<h2 className="tc-heading-2">Section Title</h2>
<h3 className="tc-heading-3">Subsection</h3>

// Text
<p className="tc-text-lead">Lead paragraph</p>
<p className="tc-text-body">Body text</p>

// Buttons
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline">Outlined Button</button>

// Cards
<div className="tc-card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Inputs
<input className="tc-input" placeholder="Enter value" />
<select className="tc-select">
  <option>Option 1</option>
</select>

// Badges
<span className="tc-badge-primary">Active</span>
<span className="tc-badge-success">Confirmed</span>
<span className="tc-badge-warning">Pending</span>

// Sections
<section className="tc-section-light">Light background</section>
<section className="tc-section-gray">Gray background</section>
<section className="tc-section-dark">Dark blue background</section>
```

---

## 5️⃣ Design Tokens Reference

When you need custom styling, use design tokens:

```tsx
// Colors
import { colors } from '@/lib/theme';

<div style={{ 
  backgroundColor: colors.primary.DEFAULT,    // #00D9A3
  color: colors.secondary.light               // #1a3a5c
}} />

// Spacing
import { spacing } from '@/lib/theme';

<section style={{ 
  paddingTop: spacing.section.lg,            // 5rem
  paddingBottom: spacing.section.lg 
}} />

// Typography
import { typography } from '@/lib/theme';

<p style={{ 
  fontSize: typography.fontSize.xl,          // 1.25rem
  fontWeight: typography.fontWeight.bold,    // 700
  lineHeight: typography.lineHeight.relaxed  // 1.75
}} />
```

---

## 6️⃣ Special Cases

### Operator-Specific Branding

For pages that need dynamic brand colors (operator portal):

```tsx
// Still use theme for base, but allow overrides
const brandColor = operator?.brandColor || colors.primary.DEFAULT;

<div style={{ backgroundColor: brandColor }}>
  {/* Operator-specific content */}
</div>
```

### Status Colors

Use semantic color names:

```tsx
// Success (green)
<Badge variant="success">Confirmed</Badge>

// Warning (yellow)
<Badge variant="warning">Pending</Badge>

// Error (red)
<Badge variant="error">Cancelled</Badge>

// Info (teal)
<Badge variant="primary">Active</Badge>
```

---

## 7️⃣ Mobile-First Approach

All components are responsive by default. Add breakpoint variants when needed:

```tsx
<Heading as="h1" className="text-4xl md:text-6xl lg:text-7xl">
  Responsive Heading
</Heading>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
  {/* Responsive grid */}
</div>

<StyledButton 
  variant="primary" 
  className="w-full md:w-auto"
>
  Responsive Button
</StyledButton>
```

---

## 8️⃣ Testing Checklist

After applying styling to a page:

- [ ] **Colors**: All teal (#00D9A3), no blue remnants
- [ ] **Typography**: Bold/Extrabold headings
- [ ] **Spacing**: Generous padding (py-20 sections, px-6 containers)
- [ ] **Shadows**: Prominent shadows (shadow-xl)
- [ ] **Borders**: Rounded corners (rounded-xl)
- [ ] **Hover States**: Smooth transitions
- [ ] **Focus States**: Teal focus rings on forms
- [ ] **Mobile**: Test on phone (Chrome DevTools)
- [ ] **Consistency**: Matches other migrated pages

---

## 🚀 Quick Migration Steps

1. **Copy imports** from example above
2. **Replace hardcoded colors** with theme tokens or components
3. **Wrap sections** in `<Section>` and `<Container>`
4. **Replace buttons** with `<StyledButton>`
5. **Replace cards** with `<StyledCard>`
6. **Replace forms** with `<StyledInput>` / `<StyledSelect>`
7. **Test on mobile** and desktop
8. **Check colors** match TransConnect teal theme

---

## 📚 Additional Resources

- **Theme Config**: `transconnect-web/src/lib/theme.ts`
- **Global CSS**: `transconnect-web/src/app/globals.css`
- **Styled Components**: `transconnect-web/src/components/styled/index.tsx`
- **Migration Plan**: `STYLING_MIGRATION_PLAN.md`
- **Roblyn Reference**: Operator portal page for design inspiration

---

**Need help?** Check the operator portal page (`/operator/[slug]`) - it's fully styled and serves as a reference implementation.
