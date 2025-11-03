# TransConnect MVP1 - Git Branch Strategy

## Branching Model

We follow GitFlow workflow with the following branches:

### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch for features

### Supporting Branches
- `feature/*` - New features (branch from develop)
- `hotfix/*` - Critical production fixes (branch from main)
- `release/*` - Release preparation (branch from develop)

## Branch Naming Convention

```
feature/TRANS-123-add-payment-integration
hotfix/TRANS-456-fix-booking-bug
release/v1.2.0
```

## Commit Message Convention

We use Conventional Commits:

```
type(scope): description

feat(auth): add JWT authentication
fix(booking): resolve seat selection bug
docs(readme): update setup instructions
test(api): add booking integration tests
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

## Workflow

1. **Feature Development**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/TRANS-123-feature-name
   # Make changes
   git add .
   git commit -m "feat(component): add new feature"
   git push origin feature/TRANS-123-feature-name
   # Create Pull Request to develop
   ```

2. **Release Process**
   ```bash
   git checkout develop
   git checkout -b release/v1.1.0
   # Update version numbers, finalize features
   git commit -m "release: prepare v1.1.0"
   git checkout main
   git merge release/v1.1.0
   git tag v1.1.0
   git checkout develop
   git merge release/v1.1.0
   ```

3. **Hotfix Process**
   ```bash
   git checkout main
   git checkout -b hotfix/TRANS-456-critical-fix
   # Make critical fix
   git commit -m "fix(critical): resolve production issue"
   git checkout main
   git merge hotfix/TRANS-456-critical-fix
   git tag v1.1.1
   git checkout develop
   git merge hotfix/TRANS-456-critical-fix
   ```

## Pull Request Guidelines

- Use descriptive titles
- Include ticket number in description
- Add screenshots for UI changes
- Ensure all tests pass
- Get at least one review approval
- Update documentation if needed

## Protected Branches

- `main` - Requires PR review, no direct commits
- `develop` - Requires PR review for external contributors