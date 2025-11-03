# Contributing to TransConnect MVP1

Thank you for your interest in contributing to TransConnect MVP1! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Flutter 3.0+
- Git
- VS Code (recommended)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/3bsolutionsltd/transconnect-mvp1.git
   cd transconnect-mvp1
   ```

2. **Set up the backend**
   ```bash
   cd transconnect-backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

3. **Set up the frontend**
   ```bash
   cd transconnect-web
   npm install
   cp .env.example .env.local
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## 📋 Development Guidelines

### Branch Strategy

We follow GitFlow workflow:

- `master` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `hotfix/*` - Critical fixes
- `release/*` - Release preparation

### Creating a Feature

1. **Start from develop**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/TRANS-123-feature-name
   ```

2. **Make your changes**
   - Write clean, testable code
   - Follow TypeScript best practices
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm test
   npm run test:coverage
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(component): add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/TRANS-123-feature-name
   # Create Pull Request on GitHub
   ```

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(auth): add JWT authentication
fix(booking): resolve seat selection bug
docs(readme): update setup instructions
test(api): add booking integration tests
```

## 🧪 Testing Guidelines

### Writing Tests

1. **Unit Tests** - Test individual functions/components
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user workflows

### Test Structure
```typescript
describe('Component/Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  describe('specific functionality', () => {
    it('should behave correctly', () => {
      // Test implementation
    });
  });
});
```

### Test Coverage
- Aim for 80%+ code coverage
- All new features must include tests
- Bug fixes should include regression tests

## 📝 Code Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type usage
- Use meaningful variable names

### React/Next.js
- Use functional components with hooks
- Implement proper error boundaries
- Follow React best practices
- Use TypeScript for props

### Node.js/Express
- Use async/await for asynchronous operations
- Implement proper error handling
- Use middleware for common functionality
- Follow RESTful API conventions

### Database
- Use Prisma ORM for database operations
- Write proper migrations
- Use database indexes appropriately
- Follow normalization principles

## 🎨 UI/UX Guidelines

### Design System
- Use Tailwind CSS for styling
- Follow responsive design principles
- Maintain consistent spacing and typography
- Use accessible color contrasts

### Components
- Create reusable UI components
- Use proper prop types
- Implement loading and error states
- Follow accessibility guidelines

## 🔒 Security Guidelines

### Authentication
- Use JWT tokens securely
- Implement proper session management
- Hash passwords with bcrypt
- Validate all user inputs

### API Security
- Use HTTPS in production
- Implement rate limiting
- Validate and sanitize inputs
- Use proper CORS configuration

## 📊 Performance Guidelines

### Frontend
- Optimize bundle sizes
- Use code splitting
- Implement lazy loading
- Optimize images

### Backend
- Use database indexes
- Implement caching strategies
- Optimize API queries
- Monitor performance metrics

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description** - Clear description of the issue
2. **Steps to Reproduce** - Detailed steps
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - OS, browser, Node.js version
6. **Screenshots** - If applicable

### Bug Report Template
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 96]
- Node.js: [e.g., 18.17.0]

## Screenshots
If applicable, add screenshots
```

## 💡 Feature Requests

When requesting features, include:

1. **Problem Statement** - What problem does this solve?
2. **Proposed Solution** - How should it work?
3. **Use Cases** - Who would use this feature?
4. **Alternatives** - Other solutions considered

## 📞 Communication

### Slack Channels
- `#transconnect-dev` - Development discussions
- `#transconnect-bugs` - Bug reports and fixes
- `#transconnect-general` - General project updates

### Meetings
- **Daily Standups** - 9:00 AM EAT
- **Sprint Planning** - Every 2 weeks
- **Code Reviews** - As needed

## 🎯 Project Structure

```
transconnect-mvp1/
├── transconnect-backend/     # Node.js API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Express middleware
│   │   └── index.ts         # Server entry point
│   ├── tests/               # Test files
│   └── prisma/              # Database schema
├── transconnect-web/        # Next.js web app
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities
│   └── __tests__/          # Frontend tests
├── transconnect-admin/      # Admin dashboard
├── transconnect-mobile/     # Flutter mobile app
└── docs/                   # Documentation
```

## 🏆 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Annual contributor awards

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Create an issue on GitHub
- Join our Slack workspace
- Email: dev@3bsolutionsltd.com

---

**Happy coding! 🚀**