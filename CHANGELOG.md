# Changelog

This document records all significant changes across all Pixuli platforms
(Desktop, Web, Mobile).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 🖥️ Desktop

### [1.3.0][1.3.0] - 2025-11-21

#### ✨ Added

- **Enhanced Metadata Tags**: Support for adding multiple tags, fixed tag data
  loss issue during upload
- **Image Browser UI Optimization**: Unified card height, fixed list mode issues
- **Repository Source Management Layout Optimization**: Changed to vertical list
  layout, added collapse animation effects
- **Enhanced Image Upload Component**: Added image compression functionality

#### 🔧 Changed

- Fixed desktop image upload/edit/delete full-screen loading freeze issue
- Optimized image size and file size retrieval logic
- Optimized Gitee storage service metadata loading
- Optimized release-desktop pipeline, support for selecting different branches
  and platforms for release
- Code optimization and feature improvements

#### 🐛 Fixed

- Fixed TypeScript compilation errors
- Fixed Gitee storage service metadata loading issues
- Fixed metadata tag functionality related issues

#### 🗑️ Removed

- **Removed Upyun Repository Source Support**: Removed Upyun storage support

#### 🎯 Technical

- Upgraded all platforms to React 19.1.0
- Implemented slide show functionality and migrated to common component library

---

### [1.2.0][1.2.0] - 2025-10-26

#### ✨ Added

- **Operation Log Feature**: Implemented complete operation log recording and
  viewing functionality
- **Batch Image Deletion**: Support for batch selection and deletion of images
- **Gitee Storage Support**: Added Gitee as a repository source, supporting dual
  storage with GitHub and Gitee
  - Gitee configuration page
  - Configuration import/export functionality
  - Configuration clear functionality
  - GitHub and Gitee configurations can coexist
- **System Tray Feature**: Support for system tray, can open image compression
  and conversion independent windows from tray
- **Version Information Viewing**: Added version information viewing
  functionality
- **Left Menu Collapse**: Support for left menu collapse functionality with
  persistent state
- **ESC Shortcut Key**: Support for ESC shortcut key to close dialogs and modals
- **Enhanced Image Preview**: Image preview added left/right arrows to switch
  current preview image
- **AI Analysis Optimization**: Migrated AI analysis to Rust WASM, optimized tag
  and description generation
- **Image Size Optimization**: Optimized image size and file size retrieval
  logic

#### 🔧 Changed

- Refactored directory structure and optimized data management
- Completed component internationalization and image compression service
  organization
- Optimized WASM module build and verification process
- Support for multi-architecture Mac builds and Linux platform
- Optimized electron-builder configuration, excluded pixuli-wasm unused files
- Fixed desktop layout scrolling issues
- Unified dialog component open/close methods
- Optimized App.tsx data management, moved component internal state to
  corresponding components

#### 🎯 Technical

- Refactored project to monorepo structure
- Integrated web and desktop common components into packages/ui
- Replaced duplicate components in desktop with packages/ui components
- Removed Tailwind CSS dependency, switched to custom CSS styles
- Added Prettier code formatting tool
- Language pack refactoring, Toast internationalization fixes
- Electron CSP security configuration optimization

---

### [1.1.0][1.1.0] - 2025-09-15

#### ✨ Added

- **Image Compression Feature**: New independent compression window
  - WebP compression support
  - Adjustable compression quality (10%-100%)
  - Batch compression functionality
  - Compression preview functionality
- **Image Format Conversion Feature**: New independent conversion window
  - Support for JPEG, PNG, WebP format conversion
  - Batch format conversion
  - Conversion preview functionality
- **Enhanced GitHub Configuration Management**
  - Configuration import/export functionality
  - Configuration clear functionality
- **Upyun Storage Support** (removed in later versions)
- **Menu Feature**: Added application menu bar functionality
- **Improved Internationalization**: Completed image component
  internationalization functionality support
- **Layout Optimization**: Refactored desktop layout components

#### 🔧 Changed

- Fixed build issues
- Optimized documentation structure and content
- Fixed wasm import persistence issues

---

### [1.0.0][1.0.0] - 2025-09-13

#### ✨ Added

- Initial desktop version release
- **Image Management**
  - Image grid display (responsive layout)
  - Drag-and-drop upload (single/batch)
  - Full-screen preview (supports zoom and rotation)
  - Metadata viewing (name, size, description, tags)
  - Search functionality (by name, description, tags)
  - Tag system (add, filter)
- **GitHub Storage Integration**
  - GitHub configuration management
  - Use GitHub repositories as image storage backend
- **Theme Switching**: Support for light/dark themes
- **Multi-language Support**: Chinese and English interface switching
- **Multi-window Management**: Support for main window, compression window,
  conversion window, AI analysis window

#### 🎯 Technical

- Built with Electron + React + TypeScript
- High-performance image processing using Rust WASM modules
- Support for macOS (x64, ARM64) and Windows (x64)
- Refactored WASM modules and optimized AI analysis functionality

---

## 🌐 Web

### [Unreleased]

#### ✨ Added

- **Slide Show Feature**: Support slide show mode for browsing images with
  multiple transition effects
- **Gitee Storage Support**: Added Gitee as a repository source, supporting dual
  storage with GitHub and Gitee
  - Gitee configuration page
  - Configuration import/export functionality
  - Configuration clear functionality
  - GitHub and Gitee configurations can coexist
  - Vercel proxy support for Gitee image resource access
- **Enhanced Image Upload Component**: Added image compression and cropping
  functionality
- **Complete PWA Features**: Implemented full Progressive Web App functionality
  - Install to home screen
  - Offline support
  - Background sync
  - Push notifications

#### 🔧 Changed

- Optimized image size and file size retrieval logic
- Optimized image search performance
- Optimized web version information, added Git branch and commit information
- Web packaging optimization, configured code splitting strategy
- Added page loading animation, consistent with desktop
- Language pack refactoring, Toast internationalization fixes
- Optimized App.tsx data management, moved component internal state to
  corresponding components
- Simplified image cropping functionality, removed multi-shape cropping, only
  retained rectangular cropping
- Refactored UI components and type definitions
- Integrated web and desktop common components into packages/ui

#### 🐛 Fixed

- Fixed web demo mode internationalization language display issue
- Fixed web metadata URL format and replaced error with warning
- Fixed Vercel platform deployment errors
- Temporarily disabled PWA cache functionality and update prompts

#### 🎯 Technical

- Upgraded all platforms to React 19.1.0
- Refactored theme system, created independent theme management for web
  applications
- Removed Tailwind CSS dependency, switched to custom CSS styles
- Improved internationalization functionality and component refactoring
- Added Prettier code formatting tool
- Added demo environment support and environment variable configuration

---

## 📱 Mobile

### [1.0.0][1.0.0-mobile] - 2025-11-21

#### ✨ Added

- Initial Android version release
- **Image Management**: Browse, upload, delete, preview
- **Image Processing**: Compression, format conversion, size adjustment,
  cropping
- **Cloud Storage**: GitHub and Gitee integration
- **Search and Filter**: Support for name search, tag/size/date filtering,
  multiple sorting options
- **Camera Integration**: Photo capture upload, post-capture editing
- **Slide Show**: Support for auto-play, sequential/random modes, multiple
  transition effects
  - Auto-play: Configurable playback interval and auto-play mode
  - Playback Modes: Support for sequential and random playback
  - Transition Effects: Fade, slide, zoom, and other transition animations
  - Loop Playback: Support for looping through all images
  - Playback Controls: Play/pause/stop, previous/next
  - Image List: Sidebar displaying all image thumbnails
  - Image Information: Show/hide image metadata information
- **Theme Switching**: Light/dark/auto themes
- **Multi-language Support**: Chinese and English interfaces
- **Responsive Design**: Adapted to different screen sizes

#### 🎯 Technical

- Built with React Native 0.81.5
- Using Expo SDK 54
- TypeScript type safety
- Smooth animations and interactive experience

#### ⚠️ Known Issues

- iOS version not yet released
- Batch upload functionality under development

---

[Unreleased]: https://github.com/trueLoving/Pixuli/compare/v1.3.0-desktop...HEAD

<!-- Desktop -->

[1.3.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.3.0-desktop
[1.2.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.2.0-desktop
[1.1.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.1.0-desktop
[1.0.0]: https://github.com/trueLoving/Pixuli/releases/tag/v1.0.0-desktop

<!-- Mobile -->

[1.0.0-mobile]: https://github.com/trueLoving/Pixuli/releases/tag/v1.0.0-mobile
