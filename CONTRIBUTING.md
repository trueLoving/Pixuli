# Contributing Guide

Thank you for your interest in the Pixuli project! This document will help you
understand how to contribute to the project development.

## 📋 Table of Contents

- [Requirements](#requirements)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Commit Standards](#commit-standards)
- [Workflow](#workflow)
- [Feedback](#feedback)

## 🔧 Requirements

### Common Requirements

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0 (Required, project only supports pnpm)
- **Git** >= 2.0.0

### Desktop Development

- **Rust** >= 1.70.0 - For building WASM modules
- **Platform Support**:
  - 🍎 macOS (x64, ARM64)
  - 🪟 Windows (x64)

### Web Development

- **Modern Browser** - Support for Canvas API

### Mobile Development

#### Android Development

- **Android Studio** - Android development environment
- **Android SDK** - Android SDK Platform 33 or higher
- **Java Development Kit (JDK)** - JDK 17

## 🚀 Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli
```

### 2. Install Dependencies

```bash
# Install all dependencies from project root
pnpm install
```

## 💻 Development Workflow

### Desktop

```bash
# Development mode
pnpm run dev:desktop

# Build application
pnpm run build:desktop
```

### Web

```bash
# Development mode
pnpm dev:web

# Build application
pnpm build:web

# Preview build result
pnpm preview:web
```

### Mobile

#### Android

```bash
# Start Android development
pnpm dev:mobile --android

# Build Android APK
cd apps/mobile
pnpm android
```

## 📦 Project Structure

### App (apps/pixuli)

```
apps/pixuli/
├── src/                           # Source code
│   ├── components/                # React components
│   ├── config/                    # Configuration files
│   ├── features/                  # Feature modules
│   ├── i18n/                      # Internationalization
│   ├── layouts/                   # Layout components
│   ├── pages/                     # Page components
│   ├── services/                  # Business services
│   └── stores/                    # State management
├── electron/                      # Electron main process
│   ├── main/                      # Main process code
│   └── preload/                   # Preload scripts
├── build/                         # Build resources
├── dist/                          # Build output
└── release/                       # Distribution files
```

### Web (apps/web)

```
apps/web/
├── src/                        # Source code
│   ├── components/             # React components
│   ├── config/                 # Configuration files
│   ├── i18n/                   # Internationalization
│   ├── services/               # Business services
│   ├── stores/                 # State management
│   └── utils/                  # Utility functions
├── public/                     # Static resources
├── api/                        # API proxy (for Vercel)
└── dist/                       # Build output
```

### Mobile (apps/mobile)

```
apps/mobile/
├── app/                         # Expo Router routes (pages)
├── components/                  # Reusable components
├── services/                    # Business services
├── stores/                      # State management (Zustand)
├── hooks/                       # Custom Hooks
├── utils/                       # Utility functions
├── config/                      # Configuration files
├── constants/                   # Constants
├── i18n/                        # Internationalization
├── assets/                      # Static resources
└── android/                     # Android native code
```

## 📝 Code Standards

### TypeScript

- Use TypeScript for development
- All files use `.ts` or `.tsx` extensions
- Avoid using `any` type, prefer specific types
- Use interfaces to define object types

### Component Standards

- Use functional components and Hooks
- Component files use PascalCase naming
- Components should be exported as named exports
- Use TypeScript to define Props types

### File Naming

- Component files: `PascalCase.tsx`
- Utility files: `camelCase.ts`
- Constant files: `camelCase.ts`

### Code Style

- Use 2 spaces for indentation
- Use single quotes (') instead of double quotes (")
- Use semicolons at the end of statements
- Use ESLint and Prettier to maintain consistent code style

## 📤 Commit Standards

### Git Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code style changes (no functional changes)
- `refactor`: Code refactoring
- `perf`: Performance optimization
- `test`: Test related
- `chore`: Build process or auxiliary tool changes

### Commit Example

```bash
feat(desktop): Add image compression feature

- Support WebP format compression
- Adjustable compression quality
- Real-time compression preview

Closes #123
```

### Scope

- `desktop` - Desktop related
- `web` - Web related
- `mobile` - Mobile related
- `common` - Shared packages related
- `wasm` - WASM module related
- `docs` - Documentation related

## 🔄 Workflow

### 1. Fork Repository

Fork this project to your account on GitHub.

### 2. Create Branch

```bash
git checkout -b feat/your-feature-name
```

### 3. Develop

- Write code
- Add tests
- Update documentation

### 4. Commit Changes

```bash
git add .
git commit -m "feat(scope): Add new feature"
```

### 5. Push Branch

```bash
git push origin feat/your-feature-name
```

### 6. Create Pull Request

Create a Pull Request on GitHub with a detailed description of your changes.

### 7. Code Review

Wait for maintainers to review the code and make modifications based on
feedback.

## 📚 Related Resources

### Common Resources

- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [i18next Documentation](https://www.i18next.com/)

### Desktop Resources

- [Electron Documentation](https://electronjs.org/)
- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

### Web Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

### Mobile Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

## 🙏 Acknowledgments

Thank you to all developers who contribute to the Pixuli project!

---

If you have any questions, please contact us through
[Issues](https://github.com/trueLoving/Pixuli/issues).
