# TransConnect Backend API

Node.js + Express + TypeScript backend API for the TransConnect bus ticketing and ride connector platform.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for live bus tracking and ride updates
- **QR Codes**: Generate and validate QR tickets
- **Payments**: Integration with MTN, Airtel, Flutterwave
- **Validation**: Express-validator for input validation
- **Security**: Helmet, CORS, rate limiting

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables
# Edit .env with your database URL and other settings

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/transconnect_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Payment API Keys
MTN_API_KEY=your-mtn-api-key
AIRTEL_API_KEY=your-airtel-api-key
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Email & SMS
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Operators
- `GET /api/operators` - List operators
- `POST /api/operators` - Create operator
- `PUT /api/operators/:id` - Update operator

### Buses
- `GET /api/buses` - List buses
- `POST /api/buses` - Add bus
- `PUT /api/buses/:id` - Update bus

### Routes
- `GET /api/routes` - Search routes
- `POST /api/routes` - Create route
- `PUT /api/routes/:id` - Update route

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details

### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment status

### QR Verification
- `POST /api/qr/verify` - Verify QR ticket
- `GET /api/qr/:bookingId` - Get QR code

### Rides (Ride Connector)
- `GET /api/rides` - Search available rides
- `POST /api/rides` - Create ride offer
- `POST /api/rides/:id/join` - Join ride

## Database Schema

Key models:
- **User** - User accounts (passengers, operators, admins)
- **Operator** - Bus company information
- **Bus** - Vehicle details and capacity
- **Route** - Travel routes with pricing and schedules
- **Booking** - Ticket reservations with QR codes
- **Payment** - Transaction records
- **Ride** - Ride connector offers
- **Verification** - QR ticket validations

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm test             # Run tests
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

The API is configured for deployment on platforms like:
- Render
- Railway
- Heroku
- DigitalOcean App Platform

Ensure environment variables are properly configured in your deployment platform.

## Health Check

The API includes a health check endpoint:
- `GET /health` - Returns API status and timestamp

## Socket.io Events

Real-time features powered by Socket.io:

**Client → Server:**
- `join-ride-room` - Join ride-specific room
- `bus-location-update` - Send bus location (operators)

**Server → Client:**
- `bus-location` - Broadcast bus location updates
- `ride-update` - Ride status changes
- `booking-confirmed` - Booking confirmations

## Rate Limiting

API includes rate limiting:
- 100 requests per 15 minutes per IP
- Configurable per endpoint

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Input validation
- CORS protection
- Helmet security headers
- Rate limiting
- SQL injection prevention (Prisma)

## Error Handling

Centralized error handling with:
- Validation errors
- Authentication errors
- Database errors
- Payment processing errors
- Custom error responses

---

For more information, see the main [README](../README.md).