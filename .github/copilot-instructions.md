# TransConnect MVP1 - Copilot Instructions

## Project Overview
**TransConnect MVP1** is a comprehensive bus ticketing and ride connector platform with the following components:
- **Mobile App**: Flutter (Android + iOS) for passengers
- **Web Portal**: React/Next.js for booking
- **Admin Dashboard**: React for operators
- **Backend API**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL
- **Features**: QR ticketing, payment integration, ride connector, real-time tracking

## Technical Stack
- **Mobile**: Flutter + Riverpod + Firebase Cloud Messaging (FCM)
- **Web Frontend**: React (Next.js) + TypeScript
- **Admin Dashboard**: React + TypeScript
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Payments**: MTN Mobile Money, Airtel Money, Flutterwave (sandbox)
- **Maps**: Google Maps SDK
- **QR Code**: `qrcode` library + `mobile_scanner`
- **Hosting**: Render or Railway

## Repository Structure
```
transconnect-backend/     # Node.js API server
transconnect-web/         # React web booking portal
transconnect-mobile/      # Flutter mobile app
transconnect-admin/       # React admin dashboard
transconnect-infra/       # Docker, CI/CD configurations
transconnect-docs/        # Documentation
```

## Database Schema
Core tables:
- `users` - Passenger accounts
- `operators` - Bus company accounts
- `buses` - Vehicle information
- `routes` - Travel routes and schedules
- `bookings` - Ticket reservations
- `payments` - Transaction records
- `rides` - Ride connector data
- `verifications` - QR ticket validations

## Key Features to Implement

### User Flows
1. **Registration/Login**: Email/phone authentication
2. **Route Search**: Origin, destination, date selection
3. **Seat Selection**: Interactive seat map
4. **Payment**: Mobile money integration
5. **QR Ticket**: Generate and display ticket
6. **Ride Connector**: Match passengers for shared rides

### Operator Flows
1. **Bus Management**: Add/edit vehicles and routes
2. **Manifest Management**: Trip schedules and capacity
3. **QR Scanner**: Validate passenger tickets
4. **Analytics**: Revenue and usage reports

### Admin Flows
1. **Operator Approval**: Verify and approve bus companies
2. **Transaction Monitoring**: Payment oversight
3. **System Analytics**: Platform usage metrics

## Development Guidelines

### Code Standards
- Use TypeScript for all JavaScript/Node.js components
- Follow Flutter/Dart conventions for mobile development
- Implement proper error handling and validation
- Use environment variables for configuration
- Include comprehensive logging

### API Design
- RESTful endpoints with proper HTTP status codes
- JWT authentication for secure access
- Rate limiting and request validation
- Swagger/OpenAPI documentation

### Mobile Development
- State management with Riverpod
- Offline capability for tickets
- Push notifications via FCM
- Platform-specific UI optimizations

### Security Requirements
- Secure payment processing
- QR code encryption/validation
- User data protection
- API endpoint security

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Widget tests for Flutter UI
- End-to-end testing for critical flows

## Project Milestones
- **M1**: Repository setup and project scaffolding
- **M2**: Core API development (auth, routes, bookings)
- **M3**: QR ticketing and payment integration
- **M4**: Mobile app integration and testing
- **M5**: Pilot release preparation

## Environment Setup
Each component should include:
- README.md with setup instructions
- Dockerfile for containerization
- .env.example for environment variables
- CI/CD pipeline configuration

## Communication Preferences
- Keep explanations concise and focused
- Provide practical code examples
- Focus on TransConnect-specific requirements
- Reference the technical stack when suggesting solutions
- Prioritize MVP features over advanced functionality

When implementing features, always consider:
1. Mobile-first design approach
2. Offline functionality where applicable
3. Payment security and compliance
4. User experience optimization
5. Scalability for pilot deployment