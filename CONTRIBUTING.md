# Contributing to Pocket Bass

Thank you for your interest in contributing to Pocket Bass! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/Pocket-bass-.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test locally: `npm run dev`
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code structure
- Run `npm run lint` before committing
- Use meaningful variable and function names

### Collections

When adding new collections:
- Create a new file in `src/collections/`
- Export a `CollectionConfig` object
- Add appropriate access controls
- Include TypeScript types
- Add to `payload.config.ts`

### Commit Messages

Use clear and descriptive commit messages:
- `feat: Add user profile page`
- `fix: Resolve authentication bug`
- `docs: Update deployment guide`
- `refactor: Improve database queries`

### Testing

Before submitting:
- Test locally with `npm run dev`
- Verify admin panel works at `/admin`
- Test API endpoints
- Check for TypeScript errors: `npm run build`

## Pull Request Process

1. Ensure your PR addresses a specific issue or feature
2. Update documentation if needed (README, DEPLOYMENT, etc.)
3. Add comments to complex code sections
4. Test thoroughly before submitting
5. Link to relevant issues in the PR description

## Feature Requests

Have an idea? Open an issue with:
- Clear description of the feature
- Use case / problem it solves
- Proposed implementation (if applicable)

## Bug Reports

Found a bug? Open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Screenshots (if applicable)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## Questions?

Feel free to open an issue for questions or join discussions.

Thank you for contributing! 🎸
