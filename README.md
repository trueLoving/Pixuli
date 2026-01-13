English

# Pixuli - Intelligent Image Management Application

> **Name Origin**: Pixuli is a combination of **Picture** + **uli**,
> representing our vision of intelligent and user-friendly image management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange.svg)](https://pnpm.io/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-1.0.0-blue.svg)](https://pixuli-web.vercel.app/)
[![Documentation](https://img.shields.io/badge/Documentation-Wiki-blue.svg)](https://github.com/trueLoving/Pixuli/wiki)

## 📖 Project Origin

The Pixuli project originated from two reasons:

1. **Practical Need**: Image management issues encountered while operating a
   blog website, requiring unified storage, intelligent compression, and batch
   processing capabilities.
2. **Project Experience**: Based on previous experience developing an image
   management application with Vue3, decided to reimplement using the React
   technology stack to experience different framework design philosophies, and
   expand and optimize functionality on this basis.

## 🖼️ Project Overview

Pixuli is an image management solution based on a Monorepo architecture,
supporting multi-platform deployment:

- **🖥️ Desktop**: Cross-platform desktop application built with Electron +
  React + TypeScript + Rust (WASM)
- **🌐 Web**: Web application built with Vite + React + TypeScript, supporting
  PWA
- **📱 Mobile**: Mobile application built with React Native + Expo

**Core Technology Stack**:

- **Frontend**: React 19.1.0 + TypeScript + Vite
- **Desktop**: Electron
- **Mobile**: React Native + Expo
- **Image Processing**: Rust (WASM) + NAPI-RS
- **State Management**: Zustand
- **UI Components**: Shared component library
- **Cloud Storage**: GitHub / Gitee

## ✨ Key Features

| Feature Module          | Description                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 📸 **Image Management** | Smart browsing, drag-and-drop upload, batch operations, tagging system, search functionality, metadata editing, fullscreen preview, slideshow playback |
| 🔧 **Image Processing** | WebP compression, format conversion, size adjustment, batch processing, pre-upload compression                                                         |
| ☁️ **Cloud Storage**    | GitHub integration, Gitee integration, storage source switching, configuration management, version control, metadata storage                           |
| 🎨 **User Experience**  | Theme switching, multi-language support, keyboard shortcuts, responsive design, PWA support                                                            |

## 🏗️ Project Structure

```
Pixuli/
├── apps/                     # Applications
│   ├── desktop/               # Desktop application (Electron + React)
│   ├── web/                   # Web application (Vite + React)
│   └── mobile/                # Mobile application (React Native + Expo)
├── packages/                 # Shared packages
│   ├── ui/                    # UI component library
│   └── wasm/                  # WASM module (Rust)
├── benchmark/                # Performance testing
└── pnpm-workspace.yaml       # Workspace configuration
```

## 🚀 Quick Start

### Requirements

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0 (Required, project only supports pnpm)
- **Git** >= 2.0.0
- **Rust** >= 1.70.0 (For building WASM modules, desktop only)
- **Android Studio** (For Android development, mobile only)
- **XCode** (For iOS development, mobile only)

### Installation and Running

```bash
# Clone the project
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli

# Install dependencies
pnpm install

# Build WASM module (desktop only)
pnpm build:wasm

# Start development mode
pnpm dev:web      # Web (http://localhost:5500)
pnpm dev:desktop  # Desktop
pnpm dev:mobile --android   # Mobile Android
pnpm dev:mobile --ios   # Mobile iOS
```

### Detailed Development Guide

Want to learn more about development details? Check out our contributing guide:

- **[Contributing Guide](./CONTRIBUTING.md)** - Complete development guide
  covering all platforms (Desktop, Web, Mobile)

## 📦 Downloads

### 🖥️ Desktop

Desktop application supports Windows and macOS platforms, available through:

| Platform                | Download Method                                                  | Description                         |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| **Windows**             | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | Download `.exe` installer           |
| **macOS Intel**         | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | Download `mac-x64` version `.dmg`   |
| **macOS Apple Silicon** | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | Download `mac-arm64` version `.dmg` |

**System Requirements**:

- Windows: Windows 10/11 (64-bit), 4GB RAM, 2GB available disk space
- macOS: macOS 10.15+, 4GB RAM, 2GB available disk space

### 🌐 Web

Web application supports online access and Docker deployment:

| Method            | Link/Description                                             | Description                             |
| ----------------- | ------------------------------------------------------------ | --------------------------------------- |
| **Online Access** | [Live Demo](https://pixuli-web.vercel.app/)                  | Direct access, no installation required |
| **Docker**        | [Docker Hub](https://hub.docker.com/r/trueloving/pixuli-web) | Deploy using Docker                     |

#### Docker Deployment

```bash
# Pull and run the latest version
docker run -d -p 8080:80 --name pixuli-web trueloving/pixuli-web:latest

# Or use a specific version
docker run -d -p 8080:80 --name pixuli-web trueloving/pixuli-web:1.0.0
```

### 📱 Mobile

Mobile application supports iOS and Android platforms, available through:

| Platform    | Download Method                                                  | Description               |
| ----------- | ---------------------------------------------------------------- | ------------------------- |
| **Android** | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) | Download `.apk` installer |

**System Requirements**:

- Android: Android 8.0 (API 26) or higher

## 📚 Documentation

| Documentation Type   | Documentation Link                                       | Description                               |
| -------------------- | -------------------------------------------------------- | ----------------------------------------- |
| **User Guides**      | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) | Complete user documentation and tutorials |
| **Feature Docs**     | [App Documentation](./apps/pixuli/README.md)             | App features and usage (Web & Desktop)    |
|                      | [Mobile Documentation](./apps/mobile/README.md)          | Mobile features and usage                 |
| **Development Docs** | [Contributing Guide](./CONTRIBUTING.md)                  | Complete development guide                |
| **Changelog**        | [Changelog](./CHANGELOG.md)                              | Complete version history                  |

## 🙏 Acknowledgments

- [Electron](https://electronjs.org/) - Cross-platform desktop application
  framework
- [React](https://reactjs.org/) - User interface library
- [React Native](https://reactnative.dev/) - Mobile application framework
- [Vite](https://vitejs.dev/) - Fast build tool
- [Rust](https://www.rust-lang.org/) - High-performance systems programming
  language
- [NAPI-RS](https://napi.rs/) - Node.js native module bindings
- [image-rs](https://github.com/image-rs/image) - Rust image processing library
- [Zustand](https://zustand-demo.pmnd.rs/) - Lightweight state management
- [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager

---

⭐ If this project is helpful to you, please give us a star!
