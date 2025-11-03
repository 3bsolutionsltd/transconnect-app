# 🚌 TransConnect MVP1

**A comprehensive bus ticketing and ride connector platform for Uganda**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=flat&logo=flutter&logoColor=white)](https://flutter.dev/)

## 📋 Project Overview

TransConnect MVP1 is a modern, scalable platform that revolutionizes bus transportation in Uganda by providing:

- 🎫 **Digital Bus Ticketing** with QR code validation
- 🚐 **Ride Connector** for shared transportation
- 💳 **Mobile Money Integration** (MTN, Airtel)
- 📱 **Multi-platform Support** (Web, Mobile, Admin)
- 🔒 **Secure Payment Processing**
- 📊 **Business Analytics Dashboard**

## 🏗️ Architecture

### Repository Structure

```
transconnect-mvp1/
├── transconnect-backend/     # Node.js + Express + TypeScript API
├── transconnect-web/         # Next.js Web Booking Portal
├── transconnect-admin/       # React Admin Dashboard
├── transconnect-mobile/      # Flutter Mobile Application
├── transconnect-infra/       # Docker & CI/CD Configuration
└── transconnect-docs/        # Documentation
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend API** | Node.js + Express + TypeScript + Prisma | Core business logic and data management |
| **Database** | PostgreSQL | Primary data storage |
| **Web Portal** | Next.js 14 + React + TypeScript + Tailwind CSS | Customer booking interface |
| **Admin Dashboard** | React + TypeScript + Tailwind CSS | Business management tools |
| **Mobile App** | Flutter + Dart + Riverpod | Cross-platform mobile experience |
| **Authentication** | JWT + bcrypt | Secure user authentication |
| **Payments** | MTN Mobile Money + Airtel Money + Flutterwave | Payment processing |
| **QR Codes** | qrcode + mobile_scanner | Digital ticket validation |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Flutter 3.0+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-org/transconnect-mvp1.git
cd transconnect-mvp1
```

### 2. Backend Setup
```bash
cd transconnect-backend
npm install
cp .env.example .env
# Configure your DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run db:seed
npm run dev
```

### 3. Web Portal Setup
```bash
cd transconnect-web
npm install
cp .env.example .env.local
# Configure your NEXT_PUBLIC_API_URL
npm run dev
```

### 4. Admin Dashboard Setup
```bash
cd transconnect-admin
npm install
npm start
```

### 5. Mobile App Setup
```bash
cd transconnect-mobile
flutter pub get
flutter run
```

## 🌟 Features

### ✅ Core Features (Implemented)
- 🔐 User authentication with role-based access (Passenger/Admin/Operator)
- 🚌 Route management and scheduling
- 🪑 Interactive seat selection with premium options
- 💳 Payment simulation (MTN Mobile Money, Airtel Money)
- 🎫 QR code ticket generation and validation
- 📱 Responsive design for all devices
- 👤 User booking management (view, cancel, modify)
- 📊 Admin analytics dashboard
- 🔍 Route search and filtering

### 🧪 Testing Infrastructure
- ✅ Comprehensive test suite for backend and frontend
- ✅ Unit tests for API endpoints and components
- ✅ Integration tests for booking workflows
- ✅ Authentication and authorization testing
- ✅ CI/CD ready test configurations

## Development Workflow

1. **M1**: Repository setup and project scaffolding ✅
2. **M2**: Core API development (auth, routes, bookings)
3. **M3**: QR ticketing and payment integration
4. **M4**: Mobile app integration and testing
5. **M5**: Pilot release preparation

## Environment Variables

Copy `.env.example` files in each project and configure:

- Database connection strings
- JWT secrets
- Payment provider API keys
- Firebase configuration
- Google Maps API keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Partners

- **3B Solutions Ltd** - Technical Lead
- **Green Rokon Technologies Ltd** - Funding Partner

## Support

For issues and questions, please contact:
- Email: support@transconnect.app
- GitHub Issues: [Create an issue](https://github.com/transconnect/issues)

---

**Built with ❤️ for Uganda's transportation future**