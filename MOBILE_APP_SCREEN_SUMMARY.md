# TransConnect Mobile App - Complete Screen Summary
**For Skywork Design UI/UX Improvements**  
**Version**: 1.0.11 (versionCode 12)  
**Platform**: React Native (Expo)  
**Date**: July 2, 2026

---

## 📱 **APP OVERVIEW**

**Purpose**: Bus ticketing and ride connector platform for Uganda  
**Target Users**: Passengers booking intercity bus travel  
**Primary Functions**: Search routes, book tickets, make payments, view QR tickets, manage bookings  
**Navigation**: Bottom Tab Navigation + Stack Navigation  
**Design System**: Custom with Ionicons, Blue/Green color scheme

---

## 🎨 **DESIGN SYSTEM OVERVIEW**

### Color Palette
- **Primary Blue**: #3B82F6 (buttons, active states, links)
- **Success Green**: #10B981 (confirmed bookings, selected seats)
- **Warning Yellow**: #F59E0B (pending status)
- **Error Red**: #EF4444 (cancelled, booked seats)
- **Purple Accent**: #8B5CF6 (transfer features)
- **Gray Scale**: 
  - Dark: #1F2937 (text)
  - Medium: #6B7280 (secondary text)
  - Light: #9CA3AF (placeholders)
  - Background: #E5E7EB (disabled, backgrounds)
  - White: #FFFFFF (cards, backgrounds)

### Typography
- **Title**: Large, bold, dark gray (#1F2937)
- **Subtitle**: Medium, regular, gray (#6B7280)
- **Body**: 14-16px, regular, dark gray
- **Small Text**: 12px, gray (#9CA3AF)

### Components
- **Buttons**: Rounded corners (8px), shadow, bold text
- **Cards**: White background, rounded (12px), shadow elevation
- **Input Fields**: Border (1px), rounded (8px), icon prefix
- **Badges**: Rounded pill (20px), colored background with opacity

---

## 📋 **SCREEN-BY-SCREEN BREAKDOWN**

---

## 1️⃣ **SPLASH SCREEN**
**File**: `SplashScreen.tsx`  
**Purpose**: App launch animation and branding

### Layout Structure
```
┌─────────────────────────┐
│                         │
│                         │
│      [TransConnect      │
│          Logo]          │
│                         │
│  "Connect, Move,        │
│     Optimize"           │
│                         │
│                         │
└─────────────────────────┘
```

### Components
- **Logo**: Centered TransConnect logo image (animated fade-in + scale)
- **Slogan**: Tagline text below logo
- **Background**: Solid blue (#1E40AF)
- **Animation**: Parallel fade (800ms) + spring scale animation

### Design Elements
- Full-screen centered layout
- White text on blue background
- Animated entry (opacity 0→1, scale 0.8→1)
- Auto-dismiss after 1.2 seconds
- Status bar: Light content

### Improvement Opportunities
- Add subtle gradient background
- Consider animated logo elements (not just scale)
- Loading indicator for network check
- Version number display

---

## 2️⃣ **AUTHENTICATION SCREENS**

### 2A. **LOGIN SCREEN**
**File**: `auth/LoginScreen.tsx`  
**Purpose**: User authentication via email/password

#### Layout Structure
```
┌─────────────────────────────┐
│  Welcome Back               │
│  Sign in to your...         │
│                             │
│  📧 [Email Address]         │
│                             │
│  🔒 [Password]        👁️   │
│                             │
│  [Forgot Password?]         │
│                             │
│  [Sign In Button]           │
│                             │
│  Don't have account?        │
│  [Create Account]           │
│                             │
│  ─────── OR ───────         │
│                             │
│  [📱 Sign in with Phone]    │
│                             │
│  Test Accounts:             │
│  • passenger@test.com       │
│  • password: password       │
└─────────────────────────────┘
```

#### Components
- **Header**: "Welcome Back" title + subtitle
- **Email Input**: Icon prefix (mail-outline), email keyboard
- **Password Input**: Icon prefix (lock-closed-outline), toggle visibility (eye icon), secure text entry
- **Forgot Password Link**: Right-aligned, blue text
- **Sign In Button**: Full-width, blue background, white text, loading state
- **Create Account Link**: Centered, gray text with blue link
- **OR Divider**: Horizontal line with text
- **Phone Login Button**: Outlined button with phone icon
- **Test Account Info**: Collapsible info card with demo credentials

#### User Flow
1. User enters email + password
2. Validation checks (required fields)
3. Loading state during authentication
4. Success → Navigate to Home
5. Error → Alert with message

#### Design Elements
- Safe area insets
- Keyboard avoiding view
- Scroll view for small screens
- Icon-prefixed inputs
- Toggle password visibility
- Demo mode fallback

#### Improvement Opportunities
- Social login buttons (Google, Apple)
- Biometric authentication option
- Remember me checkbox
- Better error state visualization (inline errors vs alerts)
- Password strength indicator
- Accessibility labels

---

### 2B. **REGISTER SCREEN**
**File**: `auth/RegisterScreen.tsx`  
**Purpose**: New user account creation

#### Layout Structure
```
┌─────────────────────────────┐
│  Create Account             │
│  Join TransConnect today    │
│                             │
│  👤 [First Name]            │
│                             │
│  👤 [Last Name]             │
│                             │
│  📧 [Email Address]         │
│                             │
│  📱 [Phone Number]          │
│                             │
│  🔒 [Password]        👁️   │
│                             │
│  🔒 [Confirm Password] 👁️  │
│                             │
│  [Create Account Button]    │
│                             │
│  Already have account?      │
│  [Sign In]                  │
└─────────────────────────────┘
```

#### Components
- **Header**: "Create Account" title + subtitle
- **First Name Input**: Icon prefix, text input
- **Last Name Input**: Icon prefix, text input
- **Email Input**: Icon prefix, email keyboard, validation
- **Phone Input**: Icon prefix, number keyboard, format validation
- **Password Input**: Icon prefix, toggle visibility, min 8 chars
- **Confirm Password Input**: Match validation
- **Create Account Button**: Full-width, loading state
- **Sign In Link**: Bottom navigation to login

#### Validation Rules
- All fields required
- Email format validation (regex)
- Phone format validation (10-15 digits)
- Password min 8 characters
- Passwords must match

#### User Flow
1. User fills all fields
2. Client-side validation
3. Submit to backend
4. Success → Auto-login → Home
5. Error → Alert with specific message

#### Design Elements
- Keyboard avoiding scroll view
- Icon-prefixed inputs
- Password visibility toggles
- Loading state with spinner
- Error handling with alerts

#### Improvement Opportunities
- Real-time field validation with inline errors
- Password strength meter
- Phone number formatting (256 prefix auto-add)
- Terms & conditions checkbox
- Email verification step
- Profile photo upload during registration

---

### 2C. **FORGOT PASSWORD SCREEN**
**File**: `auth/ForgotPasswordScreen.tsx`  
**Purpose**: Password reset request

#### Layout (Assumed based on pattern)
```
┌─────────────────────────────┐
│  Forgot Password            │
│  Enter email to reset       │
│                             │
│  📧 [Email Address]         │
│                             │
│  [Send Reset Link Button]   │
│                             │
│  [← Back to Login]          │
└─────────────────────────────┘
```

---

### 2D. **PHONE LOGIN SCREEN**
**File**: `auth/PhoneLoginScreen.tsx`  
**Purpose**: Alternative authentication via phone number

#### Layout (Assumed)
```
┌─────────────────────────────┐
│  Sign in with Phone         │
│  Enter your phone number    │
│                             │
│  📱 [+256 Phone Number]     │
│                             │
│  [Send OTP Button]          │
│                             │
│  ─── OTP Verification ───   │
│                             │
│  [□][□][□][□][□][□]         │
│                             │
│  [Verify Button]            │
│                             │
│  [← Back to Login]          │
└─────────────────────────────┘
```

---

## 3️⃣ **MAIN APP SCREENS (Bottom Tab Navigation)**

### 3A. **HOME SCREEN (Tab 1)**
**File**: `home/HomeScreen.tsx`  
**Purpose**: Main route search interface

#### Layout Structure
```
┌─────────────────────────────────┐
│  Find Your Journey              │
│  Book bus tickets across Uganda │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║  📍 From: [Kampala▼]      ║ │
│  ║  • Suggestions dropdown   ║ │
│  ║  ─────────────────────    ║ │
│  ║  🔄 [Swap Locations]      ║ │
│  ║  ─────────────────────    ║ │
│  ║  📍 To: [Gulu▼]           ║ │
│  ║  • Suggestions dropdown   ║ │
│  ║  ─────────────────────    ║ │
│  ║  📅 Date: Jun 29, 2026    ║ │
│  ║  ─────────────────────    ║ │
│  ║  👥 Passengers: [1] [+]   ║ │
│  ║  ─────────────────────    ║ │
│  ║  [Search Routes Button]   ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  Quick Actions:                 │
│  [My Bookings] [My Transfers]   │
│                                 │
│  Popular Routes:                │
│  • Kampala → Gulu               │
│  • Kampala → Mbale              │
│  • Kampala → Mbarara            │
└─────────────────────────────────┘
```

#### Components

##### Search Card (White card with shadow)
- **From Location Input**
  - Icon: location-outline (blue)
  - Placeholder: "From (e.g., Kampala)"
  - Auto-suggestions dropdown
  - 18 Uganda cities available
  - Error state: red border + error text

- **Swap Locations Button**
  - Icon: swap-vertical-outline
  - Circular button, centered
  - Swaps from ↔ to values

- **To Location Input**
  - Icon: location-outline (blue)
  - Placeholder: "To (e.g., Gulu)"
  - Auto-suggestions dropdown
  - Filters out "from" city

- **Date Picker**
  - Icon: calendar-outline
  - Default: Today
  - Opens native date picker
  - Format: "MMM dd, yyyy"

- **Passenger Counter**
  - Icon: people-outline
  - Decrement button (min: 1)
  - Number display
  - Increment button (max: 8)
  - Inline layout

- **Search Button**
  - Full-width
  - Blue background (#3B82F6)
  - White text: "Search Routes"
  - Disabled state when invalid

##### Auto-Suggestion Dropdown
- White background
- Shadow/elevation
- Max 5 suggestions
- City name + country
- Tap to select
- Closes on selection

##### Quick Actions Section
- Horizontal button row
- Icon + text buttons
- Navigate to Bookings/Transfers

##### Popular Routes Section
- List of common routes
- Arrow indicator (origin → destination)
- Tap to auto-fill search

#### Validation
- From location required
- To location required
- From ≠ To validation
- Date ≥ Today
- Passengers 1-8

#### User Flow
1. User enters/selects from location
2. User enters/selects to location
3. User selects travel date
4. User adjusts passenger count
5. Tap "Search Routes"
6. Navigate to Search Results screen

#### Design Elements
- Safe area with header
- Scroll view for content
- Card-based design
- Icon-prefixed inputs
- Real-time suggestions
- Input error states
- Platform-specific date picker

#### Improvement Opportunities
- Recent searches history
- Favorite routes (quick select)
- Multi-city routes
- Return ticket option
- Calendar view for date selection
- Price range filter
- Route map visualization
- Live route updates/notifications
- Voice search integration

---

### 3B. **SEARCH SCREEN (Tab 2)**
**File**: `search/SearchScreen.tsx`  
**Purpose**: Display available routes and filters

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Kampala → Gulu               │
│  Jun 29, 2026 • 1 passenger     │
│                                 │
│  [🔍 Search] [⚙️ Filters]       │
│                                 │
│  Sort by: [Price▼] Time Duration│
│  Filter: [All▼] Morning Afternoon│
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Roblyn Bus               ║ │
│  ║ Kampala → Gulu           ║ │
│  ║                          ║ │
│  ║ 🕐 08:00 → 14:30 (6h 30m)║ │
│  ║ 💺 15 seats available    ║ │
│  ║ ⭐ Mercedes Benz • AC    ║ │
│  ║                          ║ │
│  ║ UGX 50,000  [Select →]   ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Gulu Luxury Coach        ║ │
│  ║ ... (same structure)     ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  [Load More Routes]             │
└─────────────────────────────────┘
```

#### Components

##### Header
- Back button
- Route summary (origin → destination)
- Date + passenger count
- Modify search button

##### Search Bar
- Search icon
- Filter routes by operator name
- Real-time search

##### Filter Bar
- **Sort Options**: Price (default), Time, Duration
- **Filter Options**: All, Morning (<12), Afternoon (12-17), Evening (>17)
- Chip-style buttons
- Active state highlighting

##### Route Cards (List)
Each card displays:
- **Operator Name**: Bold, dark text
- **Route**: Origin → Destination
- **Departure Time**: HH:mm format
- **Arrival Time**: Calculated from duration
- **Duration**: Formatted (Xh Ym)
- **Availability**: Seat count with icon
- **Bus Details**: Model + amenities (AC, WiFi, etc.)
- **Price**: Large, bold, UGX format
- **Select Button**: Blue, right-aligned

##### Expandable Route Details (Tap card)
- Stops along route
- Operator rating
- Bus amenities list
- Cancellation policy
- Contact information

##### Empty State
- Icon (search-outline)
- "No routes found" message
- Suggestions to modify search
- Return to home button

##### Error State
- Icon (alert-circle)
- Error message
- Retry button
- Offline indicator if network error

#### Data Fetching
- Query key: ['routes', from, to, date]
- Auto-refresh on focus
- Offline cache fallback
- Loading skeleton

#### User Flow
1. Results load automatically from Home search
2. User reviews available routes
3. User applies filters/sort
4. User taps route card for details
5. User taps "Select" button
6. Navigate to Route Details screen

#### Design Elements
- SafeAreaView with header
- FlatList for performance
- Pull-to-refresh
- Loading state
- Error handling
- Offline mode support
- Card shadows
- Status badges

#### Improvement Opportunities
- Route comparison view (side-by-side)
- Save/bookmark routes
- Price alerts
- Route preview on map
- Operator reviews/ratings
- Filter by amenities (AC, WiFi, etc.)
- Filter by bus type (luxury, standard)
- Multi-select for comparison
- Price history chart
- Seat map preview

---

### 3C. **BOOKINGS SCREEN (Tab 3)**
**File**: `bookings/BookingsScreen.tsx`  
**Purpose**: View and manage user's bookings

#### Layout Structure
```
┌─────────────────────────────────┐
│  My Bookings                    │
│                                 │
│  [🔍 Search bookings]           │
│                                 │
│  [All] [Upcoming] [Past]        │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ #abc12345  [CONFIRMED]   ║ │
│  ║                          ║ │
│  ║ Kampala → Gulu           ║ │
│  ║ Roblyn Bus               ║ │
│  ║                          ║ │
│  ║ 📅 Jun 29, 2026          ║ │
│  ║ 🕐 08:00                 ║ │
│  ║ 💳 UGX 50,000            ║ │
│  ║                          ║ │
│  ║ [View Ticket] [Transfer] ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ #def67890  [PENDING]     ║ │
│  ║ ... (same structure)     ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  [My Transfers →]               │
└─────────────────────────────────┘
```

#### Components

##### Header
- Title: "My Bookings"
- Notification icon (bell)

##### Search Bar
- Search icon
- Filter by booking ID, route, operator
- Real-time filtering

##### Filter Tabs
- **All**: All bookings
- **Upcoming**: Future travel dates
- **Past**: Past travel dates
- Active tab highlighted

##### Booking Cards (List)
Each card shows:
- **Booking ID**: First 8 chars (#abc12345)
- **Status Badge**: Colored pill
  - CONFIRMED: Green background
  - PENDING: Yellow background
  - CANCELLED: Red background
- **Route**: Origin → Destination
- **Operator**: Company name
- **Date**: Calendar icon + formatted date
- **Time**: Clock icon + departure time
- **Amount**: Currency + total paid
- **Actions**:
  - View Ticket button (blue)
  - Transfer button (purple, only if confirmed/pending)
  - Chevron for details

##### Status Colors
- CONFIRMED: #10B981 (green)
- PENDING: #F59E0B (yellow)
- CANCELLED: #EF4444 (red)

##### Empty State
- Icon (receipt-outline)
- "No bookings yet" message
- "Start exploring routes" button
- Navigate to Search tab

##### Pull-to-Refresh
- Swipe down to refresh
- Loading indicator
- Updates booking statuses

##### Auto-Refresh
- Refreshes every 30 seconds when active
- Ensures payment status updates

#### Data Fetching
- Query key: ['my-bookings']
- Stale time: 0 (always fresh)
- Cache time: 5 minutes
- Auto-refresh interval: 30s
- Offline cache fallback

#### User Flow
1. Screen loads user's bookings
2. User filters by status (tabs)
3. User searches bookings
4. User taps booking card
5. Navigate to Ticket Detail screen
6. User can transfer ticket

#### Design Elements
- Safe area layout
- FlatList with memo optimization
- RefreshControl
- Loading skeletons
- Offline indicator
- Card shadows
- Status badges with opacity
- Icon-prefixed info

#### Improvement Opportunities
- Booking history export (PDF)
- Calendar view of bookings
- Push notifications for updates
- Booking reminders (24h before)
- Trip timeline view
- Group bookings view
- Expense tracking
- Loyalty points display
- Rating/review prompts after trip
- Share booking details

---

### 3D. **PROFILE SCREEN (Tab 4)**
**File**: `profile/ProfileScreen.tsx`  
**Purpose**: User account management and settings

#### Layout Structure
```
┌─────────────────────────────────┐
│  Profile                        │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║   [👤 Avatar]            ║ │
│  ║   John Doe               ║ │
│  ║   john@example.com       ║ │
│  ║   +256 701 234 567       ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Travel Statistics        ║ │
│  ║ ─────────────────────    ║ │
│  ║ 🎫 Total Trips: 12       ║ │
│  ║ 📅 This Month: 3         ║ │
│  ║ 💰 Total Spent: 600K     ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  Menu:                          │
│  ┌───────────────────────────┐ │
│  │ 👤 Edit Profile          →│ │
│  │ Update personal info      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 💳 Payment Methods       →│ │
│  │ Manage payment options    │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔔 Notifications         →│ │
│  │ Manage notification prefs │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ ℹ️  Help & Support       →│ │
│  │ FAQs and contact          │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔒 Privacy Policy        →│ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📋 Terms & Conditions    →│ │
│  └───────────────────────────┘ │
│                                 │
│  [Logout Button]                │
│                                 │
│  App Version: 1.0.11            │
└─────────────────────────────────┘
```

#### Components

##### Profile Header Card
- Avatar placeholder (circular)
- User full name
- Email address
- Phone number
- Edit icon (top-right)

##### Statistics Card
- Title: "Travel Statistics"
- **Total Trips**: Count of all bookings
- **This Month**: Current month bookings
- **Total Spent**: Sum of all payments
- Icon prefixes for each stat

##### Menu Items (List)
Each item has:
- Leading icon
- Title (bold)
- Subtitle (gray)
- Trailing chevron
- Divider between items

Menu options:
1. **Edit Profile**
   - Icon: person-outline
   - Navigate to EditProfileScreen

2. **Payment Methods**
   - Icon: card-outline
   - Navigate to PaymentMethodsScreen

3. **Notification Settings**
   - Icon: notifications-outline
   - Navigate to NotificationSettingsScreen

4. **Help & Support**
   - Icon: help-circle-outline
   - Contact, FAQs, support

5. **Privacy Policy**
   - Icon: shield-outline
   - Opens web view

6. **Terms & Conditions**
   - Icon: document-text-outline
   - Opens web view

##### Logout Button
- Red text (#EF4444)
- Confirmation alert
- Clears auth state

##### Version Info
- Centered at bottom
- Gray text
- Current app version

#### User Flow
1. View profile summary
2. Review travel statistics
3. Navigate to settings
4. Logout with confirmation

#### Design Elements
- Safe area layout
- Scroll view
- Card-based sections
- Icon-prefixed menu items
- Dividers between sections
- Loading state for stats

#### Improvement Opportunities
- Profile photo upload
- QR code for profile
- Referral code section
- Achievements/badges
- Travel preferences
- Favorite routes
- Language selection
- Currency selection
- Dark mode toggle
- Biometric lock option
- App tutorial/walkthrough
- Delete account option

---

## 4️⃣ **BOOKING FLOW SCREENS**

### 4A. **ROUTE DETAILS SCREEN**
**File**: `booking/RouteDetailsScreen.tsx`  
**Purpose**: Detailed route information before seat selection

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Route Details                │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Roblyn Bus               ║ │
│  ║ ⭐⭐⭐⭐☆ 4.5 (120)      ║ │
│  ║                          ║ │
│  ║ 📍 Kampala → Gulu        ║ │
│  ║ Via: Luwero, Nakasongola ║ │
│  ║                          ║ │
│  ║ 🕐 Departure: 08:00 AM   ║ │
│  ║ 🕐 Arrival: 02:30 PM     ║ │
│  ║ ⏱️  Duration: 6h 30min    ║ │
│  ║                          ║ │
│  ║ 🚌 Bus: Mercedes Benz    ║ │
│  ║ 💺 45 seats total        ║ │
│  ║ ✅ 30 available          ║ │
│  ║                          ║ │
│  ║ Amenities:               ║ │
│  ║ ❄️  Air Conditioning     ║ │
│  ║ 📶 WiFi                  ║ │
│  ║ 🔌 USB Charging          ║ │
│  ║ 🎵 Entertainment         ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Pricing                  ║ │
│  ║ Base Fare: 45,000        ║ │
│  ║ Tax: 5,000               ║ │
│  ║ ─────────────────────    ║ │
│  ║ Total per person:        ║ │
│  ║ UGX 50,000               ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Stops                    ║ │
│  ║ 1. Kampala (08:00)       ║ │
│  ║ 2. Luwero (09:30)        ║ │
│  ║ 3. Nakasongola (11:00)   ║ │
│  ║ 4. Gulu (14:30)          ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Cancellation Policy      ║ │
│  ║ • Free until 24h before  ║ │
│  ║ • 50% refund 12-24h      ║ │
│  ║ • No refund <12h         ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  [Continue to Seat Selection]   │
└─────────────────────────────────┘
```

#### Components

##### Operator Header
- Company name (large, bold)
- Rating stars + average + review count
- Verified badge if applicable

##### Route Information Card
- Origin → Destination (large)
- Via stops (if intermediate)
- Departure time
- Estimated arrival time
- Total duration formatted

##### Bus Details Card
- Bus model/type
- Total capacity
- Available seats count
- Status indicator (color-coded)

##### Amenities Section
- Icon + text list
- AC, WiFi, USB, Entertainment, etc.
- Grid or list layout

##### Pricing Breakdown Card
- Base fare
- Taxes/fees
- Total per person (bold, large)
- Total for all passengers

##### Stops Timeline
- Numbered list
- Stop name + time
- Visual connector line

##### Policies Section
- Cancellation terms
- Refund policy
- Terms & conditions link

##### Continue Button
- Fixed at bottom
- Full-width
- Blue background
- "Continue to Seat Selection"

##### Duplicate Booking Alert
- Shows if user already booked this route
- Option to view existing booking

#### User Flow
1. Review route details
2. Check amenities and stops
3. Review pricing
4. Tap "Continue"
5. Navigate to Seat Selection

#### Design Elements
- Scroll view
- Multiple cards/sections
- Icon prefixes
- Status badges
- Fixed bottom button
- Loading state
- Error handling

#### Improvement Opportunities
- Route map visualization
- Real-time bus location
- Operator contact button
- Share route details
- Add to favorites
- Set price alert
- Weather forecast
- Traffic updates
- Photo gallery of bus
- Passenger reviews section
- Compare with other routes

---

### 4B. **SEAT SELECTION SCREEN**
**File**: `booking/SeatSelectionScreen.tsx`  
**Purpose**: Interactive seat map for selection

#### Layout Structure
```
┌─────────────────────────────────┐
│  Select Seats                   │
│  Choose 1 seat(s)               │
│                                 │
│  Legend:                        │
│  🟢 Available  🔴 Booked        │
│  🟩 Selected   🚪 Door          │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║     FRONT (Driver)       ║ │
│  ║  ┌────┐          🚪      ║ │
│  ║  │ 1  │ 2    3    4      ║ │
│  ║  └────┘                  ║ │
│  ║                          ║ │
│  ║   5    6    7    8       ║ │
│  ║                          ║ │
│  ║   9    10   11   12      ║ │
│  ║                          ║ │
│  ║   13   14   15   16      ║ │
│  ║                          ║ │
│  ║   ...                    ║ │
│  ║                          ║ │
│  ║   41   42   43   44      ║ │
│  ║                          ║ │
│  ║   45                     ║ │
│  ║     BACK (Restroom)      ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  Selected Seats: 5, 6           │
│  Total: UGX 100,000             │
│                                 │
│  [Clear Selection]              │
│  [Continue to Payment]          │
└─────────────────────────────────┘
```

#### Components

##### Header
- Back button
- Title: "Select Seats"
- Instruction: "Choose X seat(s)"

##### Legend
- Available: Gray circle
- Booked: Red circle
- Selected: Green circle
- Door: Door icon

##### Seat Map
- Grid layout (4 seats per row typical)
- Driver seat (seat 1, special)
- Aisle spacing
- Door position
- Restroom indicator at back

##### Individual Seat
- Seat number display
- Color-coded status:
  - Available: #E5E7EB (gray)
  - Booked: #EF4444 (red)
  - Selected: #10B981 (green)
- Icon: circle-outline (available), close-circle (booked), checkmark-circle (selected)
- Touchable (if available)
- Disabled (if booked)

##### Selection Summary
- List of selected seat numbers
- Total amount calculation
- Formatted currency

##### Action Buttons
- **Clear Selection**: Ghost button, clears all
- **Continue**: Primary button, full-width
- Disabled if selection count ≠ passenger count

##### Validation
- Max seats = passenger count
- Alert if trying to select more
- Alert if trying to select booked seat
- Alert if not enough seats selected

#### User Flow
1. View seat map
2. Tap available seats
3. See selection update
4. Verify seat numbers
5. Tap "Continue"
6. Navigate to Payment

#### Design Elements
- Scroll view for long buses
- Grid layout for seats
- Touch feedback
- Color-coded states
- Real-time updates
- Loading skeleton
- Seat availability from API

#### Improvement Opportunities
- 3D seat visualization
- Seat recommendations (best seats)
- Window/aisle indicators
- Reclining seat indicators
- Extra legroom markers
- Seat pricing tiers
- Group seat selection helper
- Seat notes (near AC, quiet, etc.)
- Previous passenger ratings
- Seat preference saving

---

### 4C. **PAYMENT SCREEN**
**File**: `booking/PaymentScreen.tsx`  
**Purpose**: Payment method selection and processing

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Payment                      │
│                                 │
│  Booking Summary:               │
│  ╔═══════════════════════════╗ │
│  ║ Kampala → Gulu           ║ │
│  ║ Jun 29, 2026 • 08:00     ║ │
│  ║ Seats: 5, 6              ║ │
│  ║ Passengers: 2            ║ │
│  ║ ─────────────────────    ║ │
│  ║ Total: UGX 100,000       ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  Select Payment Method:         │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📱 MTN Mobile Money [✓]  │ │
│  │ Pay with MTN MoMo        │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📱 Airtel Money          │ │
│  │ Pay with Airtel Money    │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 💰 Cash / Over Counter   │ │
│  │ Pay at office or agent   │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 💳 Debit/Credit Card     │ │
│  │ Visa, Mastercard         │ │
│  └───────────────────────────┘ │
│                                 │
│  Phone Number (for MoMo):       │
│  📱 [256701234567]              │
│                                 │
│  [Complete Payment]             │
│                                 │
│  🔒 Secure payment powered by   │
│     PesaPal                     │
└─────────────────────────────────┘
```

#### Components

##### Booking Summary Card
- Route (origin → destination)
- Date + time
- Selected seats (comma-separated)
- Passenger count
- Total amount (large, bold)

##### Payment Method Options
Each option is a selectable card:
- **MTN Mobile Money**
  - Icon: phone-portrait (yellow accent)
  - Description
  - Radio selection

- **Airtel Money**
  - Icon: phone-portrait (red accent)
  - Description
  - Radio selection

- **Cash/OTC**
  - Icon: cash (green accent)
  - Description
  - Radio selection

- **Card Payment**
  - Icon: card (blue accent)
  - Description
  - Radio selection

##### Phone Number Input
- Shows only if MTN/Airtel selected
- Format: 256XXXXXXXXX
- Validation: 12 digits
- Country code prefix

##### Payment Button
- Full-width
- Primary blue background
- "Complete Payment" text
- Loading state during processing
- Disabled if invalid

##### Security Badge
- Lock icon
- "Secure payment" text
- Provider logo (PesaPal)

##### Payment Modal (During Processing)
- Overlay modal
- Loading spinner
- Status text:
  - "Processing payment..."
  - "Confirming booking..."
  - "Generating ticket..."
- Cannot dismiss during process

#### Payment Flow
1. Review booking summary
2. Select payment method
3. Enter phone (if mobile money)
4. Tap "Complete Payment"
5. Show processing modal
6. Create booking (API)
7. Initiate payment (API)
8. Wait for webhook confirmation
9. Success → Navigate to confirmation
10. Failure → Show error alert

#### Duplicate Check
- Queries offline storage
- Checks for same route + date
- Shows alert if duplicate found
- Option to view existing booking

#### User Flow States
- **Pending**: Yellow badge, payment processing
- **Success**: Green badge, booking confirmed
- **Failed**: Red badge, retry option

#### Design Elements
- Scroll view
- Card selections
- Radio buttons (custom styled)
- Conditional phone input
- Loading states
- Modal overlay
- Error handling
- Offline booking cache

#### Improvement Opportunities
- Saved payment methods
- Multiple payment splits
- Promo code input
- Loyalty points redemption
- Payment installments
- QR code payment
- Bank transfer option
- Wallet integration
- Payment receipt preview
- Transaction history link
- Failed payment retry logic
- Payment timeout handling
- Alternative payment on failure

---

### 4D. **BOOKING CONFIRMATION SCREEN**
**File**: `booking/BookingConfirmationScreen.tsx`  
**Purpose**: Success confirmation and ticket access

#### Layout Structure
```
┌─────────────────────────────────┐
│  Booking Confirmed! ✅          │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║     🎉                   ║ │
│  ║  Booking Successful!     ║ │
│  ║                          ║ │
│  ║  Your ticket has been    ║ │
│  ║  confirmed and sent to   ║ │
│  ║  your email.             ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  Booking Details:               │
│  ╔═══════════════════════════╗ │
│  ║ ID: #abc12345            ║ │
│  ║                          ║ │
│  ║ Kampala → Gulu           ║ │
│  ║ Roblyn Bus               ║ │
│  ║                          ║ │
│  ║ 📅 Jun 29, 2026          ║ │
│  ║ 🕐 08:00 AM              ║ │
│  ║ 💺 Seats: 5, 6           ║ │
│  ║                          ║ │
│  ║ Amount Paid:             ║ │
│  ║ UGX 100,000              ║ │
│  ║                          ║ │
│  ║ Status: CONFIRMED        ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  [View Ticket & QR Code]        │
│  [Download Ticket]              │
│  [Book Another Trip]            │
│  [Go to My Bookings]            │
│                                 │
│  📧 Confirmation email sent to: │
│  john@example.com               │
│                                 │
│  📱 SMS sent to:                │
│  +256 701 234 567               │
└─────────────────────────────────┘
```

#### Components

##### Success Header
- Checkmark icon (green, large)
- "Booking Confirmed!" title
- Success message text
- Animated entry

##### Booking Details Card
- Booking ID (first 8 chars)
- Route summary
- Operator name
- Date + time
- Seat numbers
- Amount paid
- Status badge (green)

##### Action Buttons
- **View Ticket**: Primary button
  - Navigate to ticket detail
  - Shows QR code

- **Download Ticket**: Secondary button
  - Saves ticket as image
  - For offline access

- **Book Another Trip**: Ghost button
  - Returns to home screen
  - Clears search params

- **Go to My Bookings**: Text link
  - Navigate to bookings tab

##### Confirmation Info
- Email sent confirmation
- SMS sent confirmation
- User contact details

#### User Flow
1. Arrives from payment success
2. Reviews booking details
3. Views/downloads ticket
4. Starts new search or views bookings

#### Design Elements
- Centered layout
- Success theme (green)
- Clear visual hierarchy
- Multiple CTAs
- Confetti animation (optional)
- Auto-save to offline storage

#### Improvement Opportunities
- Add to calendar button
- Share booking details
- Trip reminders setup
- Related route suggestions
- Operator feedback prompt
- Refer-a-friend promotion
- Booking celebration animation
- Social sharing options
- Travel checklist
- Weather forecast for travel date

---

### 4E. **TRANSFER REQUEST SCREEN**
**File**: `booking/TransferRequestScreen.tsx`  
**Purpose**: Transfer ticket to another person

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Transfer Ticket              │
│                                 │
│  Original Booking:              │
│  ╔═══════════════════════════╗ │
│  ║ #abc12345                ║ │
│  ║ Kampala → Gulu           ║ │
│  ║ Jun 29, 2026 • 08:00     ║ │
│  ║ Seat: 5                  ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  Transfer To:                   │
│                                 │
│  👤 [Recipient Name]            │
│                                 │
│  📧 [Recipient Email]           │
│                                 │
│  📱 [Recipient Phone]           │
│                                 │
│  💬 Reason for Transfer:        │
│  [Text area - optional]         │
│                                 │
│  ⚠️ Transfer Policy:            │
│  • Free until 24h before        │
│  • UGX 5,000 fee 12-24h         │
│  • No transfer <12h             │
│                                 │
│  Transfer Fee: UGX 0            │
│                                 │
│  [Cancel] [Submit Transfer]     │
└─────────────────────────────────┘
```

#### Components
- Original booking summary
- Recipient information form
- Transfer policy notice
- Fee calculation
- Submit button

#### Improvement Opportunities
- Recipient search from contacts
- Transfer history
- QR code scanning for recipient
- Transfer tracking

---

## 5️⃣ **TICKET & TRANSFER SCREENS**

### 5A. **TICKET DETAIL SCREEN**
**File**: `tickets/TicketDetailScreen.tsx`  
**Purpose**: Display digital ticket with QR code

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Ticket                       │
│                      [⋮ Menu]   │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║   TRANSCONNECT           ║ │
│  ║   Your Digital Ticket    ║ │
│  ║                          ║ │
│  ║   ┌─────────────────┐    ║ │
│  ║   │                 │    ║ │
│  ║   │   QR CODE HERE  │    ║ │
│  ║   │                 │    ║ │
│  ║   └─────────────────┘    ║ │
│  ║                          ║ │
│  ║   Booking: #abc12345     ║ │
│  ║                          ║ │
│  ║ ─────────────────────    ║ │
│  ║                          ║ │
│  ║ FROM                     ║ │
│  ║ Kampala                  ║ │
│  ║ 📍 Kampala Bus Park      ║ │
│  ║                          ║ │
│  ║ TO                       ║ │
│  ║ Gulu                     ║ │
│  ║ 📍 Gulu Central Station  ║ │
│  ║                          ║ │
│  ║ ─────────────────────    ║ │
│  ║                          ║ │
│  ║ 📅 Date: Jun 29, 2026    ║ │
│  ║ 🕐 Time: 08:00 AM        ║ │
│  ║ 💺 Seat: 5               ║ │
│  ║ 🚌 Bus: Mercedes Benz    ║ │
│  ║ 🏢 Operator: Roblyn Bus  ║ │
│  ║                          ║ │
│  ║ ─────────────────────    ║ │
│  ║                          ║ │
│  ║ Passenger: John Doe      ║ │
│  ║ Amount: UGX 50,000       ║ │
│  ║ Status: CONFIRMED ✅     ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  [📥 Download] [📤 Share]       │
│  [❓ Help]                      │
│                                 │
│  ⚠️ Show this QR code at        │
│  boarding for verification      │
└─────────────────────────────────┘
```

#### Components

##### Header
- Back button
- "Ticket" title
- Menu (share, download, help)

##### Ticket Card (White, shadow)
- **Brand Header**
  - TransConnect logo/name
  - "Your Digital Ticket" subtitle

- **QR Code**
  - Large, centered QR code
  - Contains booking ID + verification data
  - Scannable by operator app
  - Generated from react-native-qrcode-svg

- **Booking Reference**
  - Booking ID (first 8 chars)
  - Large, monospace font

- **Route Details**
  - From location (large, bold)
  - Boarding point address
  - To location (large, bold)
  - Alighting point address
  - Visual separator

- **Trip Information**
  - Date (calendar icon)
  - Time (clock icon)
  - Seat number (seat icon)
  - Bus model (bus icon)
  - Operator name (building icon)

- **Passenger Details**
  - Full name
  - Amount paid
  - Status badge (color-coded)

##### Action Buttons
- **Download**: Captures ticket as image
  - Uses ViewShot to capture
  - Saves to device
  - Expo Sharing API
  - Offline access

- **Share**: Shares ticket details
  - Native share sheet
  - Text format
  - Includes booking ID, route, date

- **Help**: Support options
  - Contact operator
  - FAQs
  - Cancel/modify booking

##### Instructions
- Bottom notice
- Warning icon
- "Show QR code at boarding"

#### QR Code Data
Encoded information:
- Booking ID
- User ID
- Route ID
- Travel date
- Seat number
- Verification hash

#### User Flow
1. Access from bookings list
2. View ticket details
3. Download for offline
4. Show QR at boarding
5. Operator scans and verifies

#### Design Elements
- ViewShot wrapper for capture
- QR code generation
- Card layout
- Icon-prefixed information
- Status badges
- Action buttons
- Offline-ready

#### Improvement Opportunities
- Live trip tracking
- Check-in button
- Boarding pass style
- Wallet integration (Apple/Google)
- Animated QR code
- Brightness auto-adjust when showing QR
- Nearby facilities map
- Weather at destination
- Travel tips
- Rating prompt after trip
- Trip timeline
- Delay notifications
- Alternative transport if cancelled

---

### 5B. **MY TRANSFERS SCREEN**
**File**: `bookings/MyTransfersScreen.tsx`  
**Purpose**: View transfer requests and history

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← My Transfers                 │
│                                 │
│  [Incoming] [Outgoing]          │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Transfer #t123           ║ │
│  ║ [PENDING]                ║ │
│  ║                          ║ │
│  ║ Kampala → Gulu           ║ │
│  ║ From: Jane Doe           ║ │
│  ║                          ║ │
│  ║ 📅 Jun 29, 2026          ║ │
│  ║ 💺 Seat: 5               ║ │
│  ║                          ║ │
│  ║ [Accept] [Decline]       ║ │
│  ╚═══════════════════════════╝ │
│                                 │
│  ╔═══════════════════════════╗ │
│  ║ Transfer #t124           ║ │
│  ║ [COMPLETED]              ║ │
│  ║ ... (same structure)     ║ │
│  ╚═══════════════════════════╝ │
└─────────────────────────────────┘
```

#### Components
- Tabs: Incoming / Outgoing
- Transfer cards with status
- Accept/Decline actions
- Transfer history

---

## 6️⃣ **PROFILE SUB-SCREENS**

### 6A. **EDIT PROFILE SCREEN**
**File**: `profile/EditProfileScreen.tsx`  
**Purpose**: Update user information

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Edit Profile                 │
│                      [Save]     │
│                                 │
│  ┌───────────────┐              │
│  │   [Avatar]    │              │
│  │  [Change Photo]│              │
│  └───────────────┘              │
│                                 │
│  First Name                     │
│  [John]                         │
│                                 │
│  Last Name                      │
│  [Doe]                          │
│                                 │
│  Email                          │
│  [john@example.com]             │
│                                 │
│  Phone                          │
│  [+256 701 234 567]             │
│                                 │
│  Date of Birth                  │
│  [Select date]                  │
│                                 │
│  Gender                         │
│  [Male ▼]                       │
│                                 │
│  [Save Changes]                 │
└─────────────────────────────────┘
```

#### Components
- Avatar upload
- Text inputs for each field
- Date picker for DOB
- Dropdown for gender
- Save button
- Validation

---

### 6B. **PAYMENT METHODS SCREEN**
**File**: `profile/PaymentMethodsScreen.tsx`  
**Purpose**: Manage saved payment options

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Payment Methods              │
│                      [+ Add]    │
│                                 │
│  Saved Methods:                 │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 💳 •••• 1234            │ │
│  │ Visa - Expires 12/25    │ │
│  │              [•••]      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📱 MTN: 0701234567      │ │
│  │ Mobile Money            │ │
│  │              [•••]      │ │
│  └───────────────────────────┘ │
│                                 │
│  [+ Add New Payment Method]     │
└─────────────────────────────────┘
```

#### Components
- List of saved methods
- Card icons
- Add new button
- Edit/delete options
- Default method indicator

---

### 6C. **NOTIFICATION SETTINGS SCREEN**
**File**: `profile/NotificationSettingsScreen.tsx`  
**Purpose**: Configure notification preferences

#### Layout Structure
```
┌─────────────────────────────────┐
│  ← Notification Settings        │
│                                 │
│  Push Notifications             │
│  ┌───────────────────────────┐ │
│  │ Booking Confirmations [✓]│ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Payment Updates       [✓]│ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Trip Reminders        [✓]│ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Promotional Offers    [ ]│ │
│  └───────────────────────────┘ │
│                                 │
│  Email Notifications            │
│  ┌───────────────────────────┐ │
│  │ Booking Receipts      [✓]│ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Newsletter            [ ]│ │
│  └───────────────────────────┘ │
│                                 │
│  SMS Notifications              │
│  ┌───────────────────────────┐ │
│  │ Ticket Codes          [✓]│ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

#### Components
- Grouped toggles
- Push, Email, SMS categories
- Individual preference switches
- Save automatically on toggle

---

## 7️⃣ **UTILITY SCREENS**

### 7A. **LOADING SCREEN**
**File**: `components/LoadingScreen.tsx`  
**Purpose**: Generic loading state

#### Layout
```
┌─────────────────────────┐
│                         │
│                         │
│      [Spinner]          │
│      Loading...         │
│                         │
│                         │
└─────────────────────────┘
```

---

## 📊 **SCREEN INVENTORY SUMMARY**

### Total Screens: 24

#### Authentication (4)
1. Splash Screen
2. Login Screen
3. Register Screen
4. Forgot Password Screen
5. Phone Login Screen (partially implemented)

#### Main Tabs (4)
6. Home Screen (Search)
7. Search Results Screen
8. Bookings Screen
9. Profile Screen

#### Booking Flow (5)
10. Route Details Screen
11. Seat Selection Screen
12. Payment Screen
13. Booking Confirmation Screen
14. Transfer Request Screen

#### Tickets & Transfers (2)
15. Ticket Detail Screen
16. My Transfers Screen

#### Profile Sub-Screens (3)
17. Edit Profile Screen
18. Payment Methods Screen
19. Notification Settings Screen

#### Utility (1)
20. Loading Screen

---

## 🎯 **DESIGN IMPROVEMENT PRIORITIES**

### **High Priority**
1. **Consistent Component Library**: Standardize buttons, inputs, cards
2. **Loading States**: Skeleton screens for better perceived performance
3. **Error States**: Better visual feedback for errors
4. **Empty States**: More engaging empty state illustrations
5. **Animations**: Smooth transitions between screens
6. **Accessibility**: ARIA labels, screen reader support, color contrast
7. **Dark Mode**: Complete dark theme support

### **Medium Priority**
8. **Iconography**: Consistent icon style and sizing
9. **Typography Scale**: Better hierarchy with defined scale
10. **Spacing System**: 8pt grid system
11. **Color System**: Expanded palette with semantic colors
12. **Shadows & Elevation**: Consistent depth system
13. **Touch Targets**: Minimum 44x44pt for all interactive elements

### **Low Priority**
14. **Illustrations**: Custom illustrations for empty states, errors
15. **Onboarding**: First-time user tutorial
16. **Micro-interactions**: Button press feedback, loading animations
17. **Haptic Feedback**: Vibration on key actions

---

## 🔧 **TECHNICAL SPECIFICATIONS**

### Navigation Structure
```
AppNavigator
├── AuthStack
│   ├── Login
│   ├── Register
│   ├── ForgotPassword
│   └── PhoneLogin
└── AppStack
    ├── MainTabs (Bottom Tabs)
    │   ├── Home
    │   ├── Search
    │   ├── Bookings
    │   └── Profile
    └── Screens (Stack)
        ├── RouteDetails
        ├── SeatSelection
        ├── Payment
        ├── BookingConfirmation
        ├── TicketDetail
        ├── TransferRequest
        ├── MyTransfers
        ├── EditProfile
        ├── PaymentMethods
        └── NotificationSettings
```

### Key Dependencies
- **React Native**: Expo SDK
- **Navigation**: @react-navigation/native, @react-navigation/stack, @react-navigation/bottom-tabs
- **Icons**: @expo/vector-icons (Ionicons)
- **Forms**: React hooks
- **Date**: date-fns
- **QR Codes**: react-native-qrcode-svg
- **API**: @tanstack/react-query, axios
- **Storage**: AsyncStorage
- **Notifications**: expo-notifications, Firebase Cloud Messaging
- **Sharing**: expo-sharing
- **Image Capture**: react-native-view-shot

### Screen Sizes Tested
- iPhone SE (375x667)
- iPhone 13 (390x844)
- iPhone 13 Pro Max (428x926)
- Android Medium (360x640)
- Android Large (412x915)

---

## 📐 **DESIGN SYSTEM RECOMMENDATIONS**

### Component Library Needed
- Button (primary, secondary, ghost, danger)
- Input (text, number, email, password, phone)
- Select / Dropdown
- Radio Button
- Checkbox
- Switch / Toggle
- Card
- Badge / Chip
- Modal
- Alert / Toast
- Loading Spinner
- Skeleton Loader
- Empty State
- Error State
- Avatar
- Divider
- Tabs
- Bottom Sheet
- Date Picker
- Time Picker

### Layout Patterns
- Safe Area Container
- Scroll Container
- Keyboard Avoiding Container
- Card Grid
- List Item
- Header with Actions
- Bottom Fixed Actions
- Modal Overlay
- Split View

---

## 📱 **USER EXPERIENCE NOTES**

### Current Strengths
✅ Clear navigation hierarchy  
✅ Consistent color usage for status  
✅ Icon-prefixed inputs for clarity  
✅ Loading and error state handling  
✅ Offline mode support  
✅ Demo mode for testing  

### Areas for Improvement
⚠️ Some screens lack empty states  
⚠️ Limited animation/transitions  
⚠️ No dark mode  
⚠️ Inconsistent spacing  
⚠️ Some alert-heavy error handling  
⚠️ Limited accessibility features  

---

## 🎨 **SKYWORK DESIGN DELIVERABLES**

For your Skywork Design review, focus on:

1. **Visual Hierarchy**: Make important elements (prices, CTAs, status) more prominent
2. **Whitespace**: More breathing room between sections
3. **Cards**: More elevation/shadow for depth
4. **Typography**: Clearer hierarchy with size/weight variations
5. **Colors**: Expand palette for better semantic meaning
6. **Icons**: Larger, more prominent icons
7. **Buttons**: More visual weight for primary actions
8. **Forms**: Better input states (focus, error, success)
9. **Empty States**: Add illustrations and helpful messaging
10. **Animations**: Subtle transitions to improve feel

### Recommended Design Tools
- Create high-fidelity mockups in Figma/Sketch
- Maintain design system in Figma
- Export assets @1x, @2x, @3x for React Native
- Use React Native design tokens
- Consider Storybook for component documentation

---

**End of Screen Summary**  
**Document Version**: 1.0  
**Date**: July 2, 2026  
**Prepared for**: Skywork Design Review
