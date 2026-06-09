# Changelog

This document records all significant changes across all Pixuli platforms
(Desktop, Web, Mobile).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> **M1 减负与归档**（REF-101～REF-112, 2025–2026）. Detailed backlog:
> [docs/backlog.md](docs/backlog.md). Refactor tracker:
> [REFACTOR_PLAN.md](REFACTOR_PLAN.md).

Applies to **Web**, **Desktop**, and **Mobile** on the refactoring `main`
branch. **Baseline product version: 2.0.0** (unified across platforms; MAJOR
over 1.x). The next tagged release will be `v2.0.0-desktop`, `v2.0.0-mobile`,
and `v2.0.0-web` when cut. See
[03-Release-Versioning.md](docs/01-product/03-Release-Versioning.md) (REF-409).

### ⚠️ Breaking Changes

#### Product — removed (not planned to return)

- **Slideshow** — standalone routes, player, auto-play
- **Timeline** — time-grouped browsing
- **Photo Wall** and **3D Gallery** — enhanced display components
- **Browse mode tabs** — file / slideshow / timeline switching; replaced by
  **photo host grid/list** at `/photos`
- **Web placeholder routes** — `analyze`, `edit`, `generate` (redirect to
  `/photos`)
- **Mobile** — browse-mode tab and `SlideShowPlayer` removed

**New navigation (Web/Desktop):** Photos · Compress · Convert · Settings.

#### Architecture — removed or archived

- **`packages/wasm`** — moved to `archive/wasm/`; removed from `pnpm` workspace
- **`benchmark/`** — moved to `archive/benchmark/`
- **`server/`** (NestJS) — moved to `archive/server/`; **not** an official
  deliverable
- **Electron WASM IPC** and **`pixuli-wasm`** dependency — removed from Desktop
  build
- **`performance` / `devtools`** — unused UI modules removed
- **`pptxgenjs`** and slideshow-related dependencies — removed

#### Changed behavior

- **Image processing** — Web/Desktop use **Canvas** in the renderer; Rust WASM
  is no longer required to build or run the main app
- **Desktop development** — **Rust toolchain no longer required** (WASM
  archived)
- **Gitee images** — dev/prod proxy via `@pixuli/provider-gitee/proxy` (REF-313)

### Migration notes

| If you used…                                | Now…                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| Slideshow / Timeline / Photo Wall           | Use grid/list at `/photos`; see [backlog](docs/backlog.md)                  |
| Desktop WASM / AI via Rust                  | Canvas-based processing; archived WASM in `archive/wasm/`                   |
| Official NestJS server                      | Self-host from `archive/server/` or a custom `StorageProvider` plugin       |
| Releases `v1.3.0-desktop` / `v1.0.0-mobile` | Pre-2.0 lines; upgrade target is **2.0.0** (not 1.4.x); read `[Unreleased]` |

---

## 🖥️ Desktop

### [Unreleased]

See **[Unreleased](#unreleased)** above for M1 breaking changes.

#### 🔧 Changed (refactor branch)

- Desktop shares `apps/pixuli` + `@pixuli/ui` with Web; Gitee image proxy in
  Electron main process (REF-313)

---

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

> **Historical note (REF-409):** Slideshow was removed on the post-M1 `main`
> branch. Pre-refactor installs of this release still include slideshow.

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

> **Release note:** Git tag `v1.0.0-desktop` points to this changelog entry; the
> GitHub Release page was published on 2025-11-12 **without** install artifacts.
> See [03-Release-Versioning.md](docs/01-product/03-Release-Versioning.md).

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

See **[Unreleased](#unreleased)** above for M1 breaking changes.

#### 🔧 Changed (refactor branch)

- Vite dev Gitee image proxy plugin; PWA and grid/list photo host as primary UX

> **Note:** Entries below in older Web `[Unreleased]` drafts (e.g. slideshow
> added) describe pre-M1 work and are **superseded** by the breaking changes
> section until the next release is cut.

---

## 📱 Mobile

### [Unreleased]

See **[Unreleased](#unreleased)** above for M1 breaking changes.

#### ⚠️ Breaking Changes (summary)

- Browse-mode tab and slideshow player removed (aligned with Web/Desktop product
  cut)

---

### [1.0.0][1.0.0-mobile] - 2025-11-21

> **Pre-M1 release.** Includes slideshow and browse-mode features removed on the
> refactoring branch. See `[Unreleased]` before upgrading from this tag.

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
