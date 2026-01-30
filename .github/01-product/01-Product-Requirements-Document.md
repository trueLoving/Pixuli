# Pixuli Product Requirements Document (PRD)

- **Document Version**: 1.4
- **Created Date**: 2025-01-27
- **Last Updated**: 2025-01-29
- **Project Name**: Pixuli - Intelligent Image Management Application

---

## I. Document Overview

### 1.1 Purpose

This document systematically describes the product requirements for the Pixuli
project, including implemented features, features in progress, and features to
be implemented, providing a basis for product iteration, development scheduling,
and acceptance.

### 1.2 Scope

- Product Managers, Project Managers: Requirement understanding and scheduling
- Development Engineers: Feature implementation and interface design
- Test Engineers: Test case design and acceptance criteria
- Operations and Deployment: Runtime environment and constraints

### 1.3 Terms and Abbreviations

| Term     | Description                                             |
| -------- | ------------------------------------------------------- |
| PRD      | Product Requirements Document                           |
| PWA      | Progressive Web App                                     |
| WASM     | WebAssembly, high-performance binary instruction format |
| CRUD     | Create / Read / Update / Delete                         |
| Monorepo | Single codebase managing multiple packages/applications |

---

## II. Project Overview

### 2.1 Background

Pixuli originates from two needs:

1. **Practical Need**: Unified image storage, compression, and batch processing
   requirements for blog and website operations.
2. **Technical Practice**: Based on previous experience developing an image
   management application with Vue3, reimplementing using the React technology
   stack and expanding capabilities across multiple platforms (Web, Desktop,
   Mobile).

### 2.2 Product Positioning

Pixuli is an **intelligent image management solution based on Monorepo
architecture**, supporting multi-platform deployment with a unified experience:

- **Desktop**: Electron + React, supporting Windows, macOS (including Apple
  Silicon)
- **Web**: Vite + React, supporting PWA and online access
- **Mobile**: React Native + Expo, supporting Android (iOS planned)

**Core Value**: Using GitHub / Gitee repositories as storage backends, providing
image browsing, uploading, editing, compression, format conversion, and metadata
management, with unified cloud storage and version control capabilities.

### 2.3 Target Users

- Personal blog / static site operators: Need stable, versioned image hosting
- Content creators: Need batch upload, compression, and format conversion
- Developers and DevOps: Need self-hosted, integrable image management
  capabilities

---

## III. System Architecture and Technology Stack

### 3.1 Project Structure

```
Pixuli/
├── apps/
│   ├── pixuli/          # Web + Desktop unified application (Vite + React + Electron)
│   └── mobile/          # Mobile application (React Native + Expo)
├── packages/
│   ├── common/          # Shared components, Hooks, utilities, storage services across platforms
│   └── wasm/             # Rust WASM image processing core (Web/Desktop)
├── server/               # Optional backend service (NestJS + Prisma + MySQL/MinIO)
├── benchmark/            # Performance testing
├── .github/design/       # Design documents (cross-platform resources, image processing, performance, logging, etc.)
```

### 3.2 Technology Stack Overview

| Layer              | Technology                           | Description                                   |
| ------------------ | ------------------------------------ | --------------------------------------------- |
| Frontend Framework | React 19.x + TypeScript              | Unified UI and logic                          |
| Build Tool         | Vite                                 | Web/Desktop build                             |
| Desktop Runtime    | Electron                             | Cross-platform desktop application            |
| Mobile             | React Native + Expo                  | Cross-platform mobile application             |
| State Management   | Zustand                              | Lightweight state management                  |
| Image Processing   | Rust (WASM) / expo-image-manipulator | Web/Desktop uses WASM, Mobile uses native     |
| Cloud Storage      | GitHub API / Gitee API               | Repositories as image hosting                 |
| Optional Backend   | NestJS + Prisma + MySQL              | Image metadata and file storage (Local/MinIO) |

### 3.3 Platform Capability Matrix

| Capability                                  | Web                            | Desktop                        | Mobile                                               |
| ------------------------------------------- | ------------------------------ | ------------------------------ | ---------------------------------------------------- |
| Repository Source Management (GitHub/Gitee) | ✅                             | ✅                             | ✅                                                   |
| Image CRUD                                  | ✅                             | ✅                             | ✅ (Batch upload done; batch edit: ⏳ High priority) |
| Slideshow / Timeline Browsing               | ✅                             | ✅                             | ✅ (Slideshow implemented)                           |
| Operation Log                               | ✅                             | ✅                             | ✅                                                   |
| PWA / Offline                               | ✅                             | ⏳ To be implemented           | ⏳ Medium priority                                   |
| Format Conversion / Compression / Editing   | Framework ready, logic pending | Framework ready, logic pending | ✅ Partially implemented                             |
| Batch Edit Metadata                         | ⏳ To be implemented           | ⏳ To be implemented           | ⏳ High priority                                     |
| Layout Optimization (Columns/Waterfall)     | ⏳ To be implemented           | ⏳ To be implemented           | ⏳ Medium priority                                   |
| Private Repository Access Control           | ⏳ To be implemented           | ⏳ To be implemented           | ⏳ Medium priority                                   |
| AI Features Integration                     | ⏳ To be implemented           | ⏳ To be implemented           | ⏳ Low priority                                      |
| Favorites and Grouping                      | ⏳ To be implemented           | ⏳ To be implemented           | ⏳ Low priority                                      |
| Statistics and Insights                     | ⏳ To be implemented           | ⏳ To be implemented           | ⏳ Low priority                                      |
| Camera / Gallery                            | —                              | —                              | ✅                                                   |

---

## IV. Functional Requirements

### 4.1 Repository Source Management (Implemented)

**Overview**: Users can configure multiple GitHub or Gitee repositories as image
storage sources and switch between them.

#### 4.1.1 Feature Points

| ID           | Requirement                                                                          | Priority | Status | Platforms              |
| ------------ | ------------------------------------------------------------------------------------ | -------- | ------ | ---------------------- |
| F-SOURCE-001 | Support adding multiple GitHub repository sources (owner, repo, branch, token, path) | P0       | ✅     | Web / Desktop / Mobile |
| F-SOURCE-002 | Support adding multiple Gitee repository sources (same structure as above)           | P0       | ✅     | Web / Desktop / Mobile |
| F-SOURCE-003 | Support switching between configured sources as the current active source            | P0       | ✅     | All platforms          |
| F-SOURCE-004 | Support editing and deleting existing repository sources                             | P0       | ✅     | All platforms          |
| F-SOURCE-005 | Configuration persistence (Web/Desktop: localStorage; Mobile: AsyncStorage)          | P0       | ✅     | All platforms          |
| F-SOURCE-006 | Configuration form validation (required fields, format, etc.)                        | P1       | ✅     | All platforms          |
| F-SOURCE-007 | Configuration import, export, and clear                                              | P1       | ✅     | All platforms          |

#### 4.1.2 Business Rules

- GitHub and Gitee configurations can coexist; switching only changes the
  "currently active" storage service.
- Sensitive information such as tokens is only persisted locally and not
  uploaded to servers not controlled by the user.

---

### 4.2 Image CRUD (Implemented)

**Overview**: Create, read, update, and delete images in the currently selected
repository source.

#### 4.2.1 Create

| ID         | Requirement                                                        | Priority | Status | Platforms     |
| ---------- | ------------------------------------------------------------------ | -------- | ------ | ------------- |
| F-CRUD-C01 | Single image upload with metadata (name, description, tags, etc.)  | P0       | ✅     | All platforms |
| F-CRUD-C02 | Batch image upload with progress display (progress bar/percentage) | P0       | ✅     | All platforms |
| F-CRUD-C03 | Mobile: Support camera capture and gallery selection for upload    | P0       | ✅     | Mobile        |

#### 4.2.2 Read

| ID         | Requirement                                                                  | Priority | Status | Platforms     |
| ---------- | ---------------------------------------------------------------------------- | -------- | ------ | ------------- |
| F-CRUD-R01 | Load image list from current source                                          | P0       | ✅     | All platforms |
| F-CRUD-R02 | Display images in grid/list formats                                          | P0       | ✅     | All platforms |
| F-CRUD-R03 | Full-screen preview, zoom, left/right navigation, etc.                       | P0       | ✅     | All platforms |
| F-CRUD-R04 | View single image metadata (name, description, tags, dimensions, time, etc.) | P1       | ✅     | All platforms |
| F-CRUD-R05 | Pull-to-refresh to sync latest list                                          | P1       | ✅     | All platforms |
| F-CRUD-R06 | Mobile: Metadata caching for optimized loading and offline browsing          | P1       | ✅     | Mobile        |

#### 4.2.3 Update

| ID         | Requirement                                                             | Priority | Status               | Platforms              |
| ---------- | ----------------------------------------------------------------------- | -------- | -------------------- | ---------------------- |
| F-CRUD-U01 | Edit image metadata (description, tags, etc.), support rename detection | P0       | ✅                   | All platforms          |
| F-CRUD-U02 | Batch edit metadata (tags, description, name) for multiple images       | P1       | ⏳ To be implemented | Web / Desktop / Mobile |

#### 4.2.4 Delete

| ID         | Requirement                                       | Priority | Status | Platforms     |
| ---------- | ------------------------------------------------- | -------- | ------ | ------------- |
| F-CRUD-D01 | Single image deletion with confirmation mechanism | P0       | ✅     | All platforms |
| F-CRUD-D02 | Batch selection and batch deletion                | P0       | ✅     | All platforms |

---

### 4.3 Browse Modes (Implemented)

**Overview**: Provide three browsing modes for the same set of image data: file
mode, slideshow, and timeline.

| ID          | Requirement                                                                     | Priority | Status | Platforms     |
| ----------- | ------------------------------------------------------------------------------- | -------- | ------ | ------------- |
| F-BROWSE-01 | File mode: Grid/list display, support click preview, image switching            | P0       | ✅     | Web / Desktop |
| F-BROWSE-02 | Slideshow mode: Auto/manual playback, transition animations, loop, etc.         | P0       | ✅     | Web / Desktop |
| F-BROWSE-03 | Timeline mode: Grouped display by time                                          | P0       | ✅     | Web / Desktop |
| F-BROWSE-04 | Sidebar menu to switch between the three modes and route to corresponding pages | P0       | ✅     | Web / Desktop |
| F-BROWSE-05 | Mobile: Slideshow playback with auto/manual modes, transitions, loop, controls  | P0       | ✅     | Mobile        |

---

### 4.4 Operation Log (All Platforms Implemented)

**Overview**: Record and display key user operations within the application for
auditing and backtracking. All three platforms share the same types and business
logic (`packages/common`: `types/log`, `OperationLogService`); only the storage
adapter differs (Web/Desktop: localStorage; Mobile: AsyncStorage). Web/Desktop
entry: Header and Ctrl+Shift+L shortcut; Mobile entry: Settings → "Operation
Log" menu, modal showing the latest 10 entries, export JSON/CSV, and clear all.

| ID       | Requirement                                                                                            | Priority | Status | Platforms                                         |
| -------- | ------------------------------------------------------------------------------------------------------ | -------- | ------ | ------------------------------------------------- |
| F-LOG-01 | Record operations such as upload, delete, edit, configuration changes, batch upload                    | P1       | ✅     | All platforms                                     |
| F-LOG-02 | Provide log viewing interface (modal/standalone view), support filtering by type, time, keywords, etc. | P1       | ✅     | Web/Desktop; Mobile modal shows latest 10 entries |
| F-LOG-03 | Display statistics (e.g., operation counts by type, today's count, success rate)                       | P2       | ✅     | All platforms                                     |
| F-LOG-04 | Support exporting logs as JSON/CSV files                                                               | P2       | ✅     | All platforms (Mobile via system share)           |
| F-LOG-05 | Implement equivalent log capabilities on Mobile as Web/Desktop                                         | P2       | ✅     | Mobile                                            |

---

### 4.5 PWA and Offline (Web Implemented)

**Overview**: Web provides offline and "installable" experience in PWA form.

| ID       | Requirement                                       | Priority | Status                  | Platforms |
| -------- | ------------------------------------------------- | -------- | ----------------------- | --------- |
| F-PWA-01 | Service Worker registration and offline caching   | P1       | ✅                      | Web       |
| F-PWA-02 | Install prompt (PWAInstallPrompt)                 | P1       | ✅                      | Web       |
| F-PWA-03 | Offline status indicator (e.g., OfflineIndicator) | P1       | ✅                      | Web       |
| F-PWA-04 | PWA update detection and prompt                   | P2       | ⏳ To be fixed/improved | Web       |

---

### 4.6 Image Processing Tools (Partially Implemented)

**Overview**: Provide compression, format conversion, editing, analysis, and
generation capabilities; progress varies by platform.

#### 4.6.1 Format Conversion

| ID            | Requirement                                             | Priority | Status                       | Platforms     |
| ------------- | ------------------------------------------------------- | -------- | ---------------------------- | ------------- |
| F-TOOL-CVT-01 | Support format conversion between JPEG, PNG, WebP, etc. | P0       | ⏳ Page ready, logic pending | Web / Desktop |
| F-TOOL-CVT-02 | Mobile: Already supports JPEG, PNG, WebP conversion     | P0       | ✅                           | Mobile        |

#### 4.6.2 Image Compression

| ID            | Requirement                                                        | Priority | Status                       | Platforms     |
| ------------- | ------------------------------------------------------------------ | -------- | ---------------------------- | ------------- |
| F-TOOL-CMP-01 | Adjustable compression quality (e.g., 10%-100%), real-time preview | P0       | ⏳ Page ready, logic pending | Web / Desktop |
| F-TOOL-CMP-02 | Mobile: Already implements quality-adjustable compression          | P0       | ✅                           | Mobile        |

#### 4.6.3 Image Editing

| ID            | Requirement                                             | Priority | Status                       | Platforms     |
| ------------- | ------------------------------------------------------- | -------- | ---------------------------- | ------------- |
| F-TOOL-EDT-01 | Crop, resize, metadata editing                          | P0       | ⏳ Page ready, logic pending | Web / Desktop |
| F-TOOL-EDT-02 | Mobile: Already supports crop, resize, metadata editing | P0       | ✅ Partial                   | Mobile        |

#### 4.6.4 Image Analysis

| ID            | Requirement                                                                                                         | Priority | Status                       | Platforms              |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------- | ---------------------- |
| F-TOOL-ANZ-01 | Basic information (dimensions, format, channels, etc.) and extended analysis (e.g., tag and description generation) | P1       | ⏳ Page ready, logic pending | Web / Desktop / Mobile |

#### 4.6.5 Image Generation

| ID            | Requirement                                                                     | Priority | Status     | Platforms     |
| ------------- | ------------------------------------------------------------------------------- | -------- | ---------- | ------------- |
| F-TOOL-GEN-01 | Generate images based on text or conditions (including future Dify integration) | P2       | ⏳ Planned | All platforms |

---

### 4.7 Search and Filter (Partially Implemented)

**Overview**: Narrow image scope through keywords and filter conditions.

| ID          | Requirement                                                      | Priority | Status                                        | Platforms     |
| ----------- | ---------------------------------------------------------------- | -------- | --------------------------------------------- | ------------- |
| F-SEARCH-01 | Search by name, description, and tags                            | P0       | ✅ (e.g., Photos page and SearchContext)      | Web / Desktop |
| F-SEARCH-02 | Filter by tags, dimensions, date, etc.                           | P1       | ✅ (e.g., filterImages, createDefaultFilters) | Web / Desktop |
| F-SEARCH-03 | Mobile: Already supports search and multi-dimensional filtering  | P1       | ✅                                            | Mobile        |
| F-SEARCH-04 | Multi-condition combination, search history, and advanced search | P2       | ⏳ To be implemented                          | All platforms |

---

### 4.8 Internationalization and Theme (Implemented)

| ID         | Requirement                                                     | Priority | Status                                                                     | Platforms               |
| ---------- | --------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- | ----------------------- |
| F-I18N-01  | Chinese/English switching, interface text changes with language | P0       | ✅                                                                         | All platforms           |
| F-THEME-01 | Light/dark theme switching                                      | P1       | ✅ (e.g., Mobile); Web/Desktop can be marked as per current implementation | Partial / All platforms |

---

### 4.9 Keyboard Shortcuts and Help (Implemented)

| ID       | Requirement                                                                                                                                                     | Priority | Status | Platforms     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------------- |
| F-KBD-01 | Common operations support keyboard shortcuts (Esc close modal, F1 help, F5 refresh, Ctrl+, config, / search box, Ctrl+V view, Ctrl+Shift+L operation log, etc.) | P1       | ✅     | Web / Desktop |
| F-KBD-02 | Provide keyboard shortcut help modal (KeyboardHelpModal), press F1 to open                                                                                      | P2       | ✅     | Web / Desktop |

---

### 4.10 Web/Desktop Extensions (Partially Implemented / Planned)

**Overview**: Enhanced features and experience optimizations for Web and Desktop
platforms.

| ID            | Requirement                                                                                | Priority | Status               | Platforms     |
| ------------- | ------------------------------------------------------------------------------------------ | -------- | -------------------- | ------------- |
| F-WEB-DESK-01 | Batch edit metadata (tags, description, name)                                              | P1       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-02 | Grid layout optimization (column switching, waterfall, list view)                          | P1       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-03 | Loading experience optimization (skeleton screens, lazy loading optimization, preloading)  | P1       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-04 | Private repository image access control (auto-detect repository type, token-based access)  | P1       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-05 | Enhanced error handling (retry mechanism, clear error messages, error recovery)            | P1       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-06 | Desktop offline support (offline browsing, upload queue, network status detection)         | P1       | ⏳ To be implemented | Desktop       |
| F-WEB-DESK-07 | Web touch device gesture support (long-press menu, swipe operations)                       | P2       | ⏳ To be implemented | Web           |
| F-WEB-DESK-08 | AI features integration (auto-tagging, scene recognition, OCR, object detection)           | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-09 | Favorites and grouping (favorites, custom albums, tag management)                          | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-10 | Statistics and insights (storage usage, image count, upload history, operation statistics) | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-11 | Quick actions (recent uploads, common tags, quick upload templates)                        | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-12 | Animation and transitions (page transitions, loading animations, feedback animations)      | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-13 | Accessibility support (screen reader, keyboard navigation, font size, high contrast)       | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-14 | Performance optimization (image caching strategy, virtual lists, compressed image cache)   | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-15 | Sharing and collaboration (share links, QR code generation, multi-user editing)            | P2       | ⏳ To be implemented | Web / Desktop |
| F-WEB-DESK-16 | Desktop auto-update (electron-updater, update check, download, and installation)           | P1       | ⏳ To be implemented | Desktop       |
| F-WEB-DESK-17 | Desktop system tray (tray icon, tray menu, minimize to tray, tray notifications)           | P1       | ⏳ To be implemented | Desktop       |

---

### 4.11 Mobile Extensions (Partially Implemented / Planned)

**Overview**: Mobile-specific features and enhancements based on mobile platform
capabilities.

| ID          | Requirement                                                                           | Priority | Status             | Platforms |
| ----------- | ------------------------------------------------------------------------------------- | -------- | ------------------ | --------- |
| F-MOBILE-01 | Batch upload with progress tracking and error handling                                | P0       | ✅                 | Mobile    |
| F-MOBILE-02 | Batch edit metadata (tags, description, name) for multiple images                     | P0       | ⏳ High priority   | Mobile    |
| F-MOBILE-03 | Grid layout optimization (2/3/4 columns, waterfall, list view)                        | P1       | ⏳ Medium priority | Mobile    |
| F-MOBILE-04 | Loading experience optimization (skeleton screens, lazy loading, preloading)          | P1       | ⏳ Medium priority | Mobile    |
| F-MOBILE-05 | Private repository image access control (auto-detect repo type, token-based access)   | P1       | ⏳ Medium priority | Mobile    |
| F-MOBILE-06 | Enhanced error handling (retry mechanism, clear error messages)                       | P1       | ⏳ Medium priority | Mobile    |
| F-MOBILE-07 | Offline support (offline browsing, upload queue, network status detection)            | P1       | ⏳ Medium priority | Mobile    |
| F-MOBILE-08 | Gesture enhancements (long-press menu, swipe to delete, double-tap zoom)              | P1       | ⏳ Medium priority | Mobile    |
| F-MOBILE-09 | AI features integration (auto-tagging, scene recognition, OCR, object detection)      | P2       | ⏳ Low priority    | Mobile    |
| F-MOBILE-10 | Favorites and grouping (favorites, custom albums, tag management)                     | P2       | ⏳ Low priority    | Mobile    |
| F-MOBILE-11 | Statistics and insights (storage usage, image count, upload history)                  | P2       | ⏳ Low priority    | Mobile    |
| F-MOBILE-12 | Quick actions (recent uploads, common tags, quick upload)                             | P2       | ⏳ Low priority    | Mobile    |
| F-MOBILE-13 | Animation and transitions (page transitions, loading animations, feedback animations) | P2       | ⏳ Low priority    | Mobile    |
| F-MOBILE-14 | Accessibility support (screen reader, keyboard navigation, font size)                 | P2       | ⏳ Low priority    | Mobile    |
| F-MOBILE-15 | Performance optimization (image caching, virtual lists, compressed image cache)       | P2       | ⏳ Low priority    | Mobile    |
| F-MOBILE-16 | Sharing and collaboration (share links, QR codes, multi-user editing)                 | P2       | ⏳ Low priority    | Mobile    |

---

### 4.12 Server Features (Planned / In Development)

**Overview**: Optional backend service (Pixuli Server) providing enhanced
capabilities including MCP Server, image repository management, authentication,
and advanced features.

#### 4.12.1 Core Features (High Priority)

| ID          | Requirement                                                                                                             | Priority | Status           | Platform |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- | -------- |
| F-SERVER-01 | MCP Server core functionality (Model Context Protocol support, model management, context management, model interaction) | P0       | ⏳ High priority | Server   |
| F-SERVER-02 | Image repository core functionality (image storage management, metadata management, version control, RESTful API)       | P0       | ⏳ High priority | Server   |
| F-SERVER-03 | Authentication and authorization system (JWT authentication, RBAC, security features, rate limiting)                    | P0       | ⏳ High priority | Server   |

#### 4.12.2 Enhanced Features (Medium Priority)

| ID          | Requirement                                                                                                          | Priority | Status             | Platform |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | -------- | ------------------ | -------- |
| F-SERVER-04 | Intelligent search (AI-based image search, full-text search with Elasticsearch, search performance optimization)     | P1       | ⏳ Medium priority | Server   |
| F-SERVER-05 | Batch processing (batch upload, batch operations, task queue with Bull/BullMQ)                                       | P1       | ⏳ Medium priority | Server   |
| F-SERVER-06 | Caching and performance optimization (Redis caching, database optimization, CDN integration)                         | P1       | ⏳ Medium priority | Server   |
| F-SERVER-07 | Monitoring and logging system (Prometheus metrics, Winston logging, Grafana dashboards)                              | P1       | ⏳ Medium priority | Server   |
| F-SERVER-08 | Error handling and fault tolerance (unified error responses, retry mechanisms, circuit breakers, Sentry integration) | P1       | ⏳ Medium priority | Server   |

#### 4.12.3 Extended Features (Low Priority)

| ID          | Requirement                                                                                           | Priority | Status          | Platform |
| ----------- | ----------------------------------------------------------------------------------------------------- | -------- | --------------- | -------- |
| F-SERVER-09 | Image processing service integration (compression, format conversion, resize, crop)                   | P2       | ⏳ Low priority | Server   |
| F-SERVER-10 | Webhook and event system (webhook registration, event pub/sub, event history)                         | P2       | ⏳ Low priority | Server   |
| F-SERVER-11 | Data import/export (metadata export/import, batch operations, task management)                        | P2       | ⏳ Low priority | Server   |
| F-SERVER-12 | Multi-tenant support (tenant management, resource isolation, billing and statistics)                  | P2       | ⏳ Low priority | Server   |
| F-SERVER-13 | API rate limiting and quota management (IP/user/endpoint-based rate limiting, storage/request quotas) | P2       | ⏳ Low priority | Server   |
| F-SERVER-14 | Documentation and testing (Swagger/OpenAPI docs, comprehensive test coverage >80%)                    | P2       | ⏳ Low priority | Server   |
| F-SERVER-15 | Internationalization support (multi-language error messages, timezone support)                        | P2       | ⏳ Low priority | Server   |
| F-SERVER-16 | GraphQL API support (GraphQL schema, queries/mutations/subscriptions, coexist with REST)              | P2       | ⏳ Low priority | Server   |

---

## V. Non-Functional Requirements

### 5.1 Performance

| ID         | Requirement                                                                                                                          | Description                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| NF-PERF-01 | List rendering should be acceptable in scenarios with many images (e.g., lazy loading, pagination, or virtual scrolling)             | Currently has lazy loading, etc.; virtual scrolling is a pending optimization |
| NF-PERF-02 | Image processing (compression, conversion) on Web/Desktop should prioritize WASM, controlling initial bundle size and runtime memory | See packages/wasm and design documents                                        |
| NF-PERF-03 | Mobile can implement metadata caching to reduce duplicate requests                                                                   | Partially implemented                                                         |

### 5.2 Security and Privacy

| ID        | Requirement                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| NF-SEC-01 | GitHub/Gitee tokens are only stored locally on user devices and not uploaded to servers not controlled by the user |
| NF-SEC-02 | If using self-hosted Server, support API Key authentication (see server documentation)                             |

### 5.3 Compatibility

| ID           | Requirement                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------- |
| NF-COMPAT-01 | Web: Modern browsers (Chrome, Firefox, Safari, Edge, etc.); requires WASM-capable environment |
| NF-COMPAT-02 | Desktop: Windows 10/11 x64; macOS 10.15+ (x64/ARM64)                                          |
| NF-COMPAT-03 | Mobile: Android 5.0+ (API 21); iOS TBD                                                        |

### 5.4 Usability and Maintainability

| ID          | Requirement                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NF-USAB-01  | Main workflows support bilingual (Chinese/English), key operations have feedback (e.g., Toast, loading states)                                                                               |
| NF-MAINT-01 | Common logic and UI are consolidated in packages/common for reuse across platforms, facilitating maintenance and consistent experience (including operation log types and service in common) |

---

## VI. Integration with Optional Backend (Pixuli Server)

Pixuli frontend defaults to **GitHub / Gitee** as storage and does not require a
self-hosted backend. **Pixuli Server** is an optional backend service that
provides enhanced capabilities including:

- **MCP Server**: Model Context Protocol support for AI model integration
- **Image Repository**: Advanced image storage and management with version
  control
- **Authentication & Authorization**: JWT-based authentication and RBAC
- **Intelligent Search**: AI-based image search and full-text search
- **Batch Processing**: Task queue for large-scale image processing
- **Monitoring & Logging**: Comprehensive monitoring and logging capabilities

### 6.1 Server Capabilities Overview

**Current Implementation** (as per `server/README.md`):

- Image upload, list, detail, metadata update, deletion
- Local storage and MinIO object storage
- API Key authentication
- Tags and simple queries

**Planned Features** (see Section 4.12 for detailed requirements):

- MCP Server core functionality
- Enhanced image repository with version control
- Complete authentication and authorization system
- Intelligent search with Elasticsearch
- Batch processing with task queues
- Caching and performance optimization
- Monitoring and logging systems

### 6.2 Frontend-Server Integration Requirements (if enabled)

- Use Server-provided REST API (e.g., `/api/images/*`) for upload, list, delete,
  metadata update.
- Switch between "repository source" and "Server source" via environment
  variables or configuration, and abstract as "current image hosting source" in
  the frontend.
- Support future GraphQL API (when implemented) alongside REST API.
- Integrate with MCP Server for AI-powered features (when available).

---

## VII. Requirement Priority

- **P0**: Core workflows; product unusable or significantly degraded without
  them.
- **P1**: Important features affecting experience and differentiation.
- **P2**: Enhancement features that can be iterated later.

---

## VIII. Appendix

### 8.1 Related Documents

- [Project README](https://github.com/trueLoving/Pixuli/blob/main/README.md)
- [Pixuli App Documentation](https://github.com/trueLoving/Pixuli/blob/main/apps/pixuli/README.md)
- [Mobile Documentation](https://github.com/trueLoving/Pixuli/blob/main/apps/mobile/README.md)
- [Server Documentation](https://github.com/trueLoving/Pixuli/blob/main/server/README.md)
- [Common Package Documentation](https://github.com/trueLoving/Pixuli/blob/main/packages/common/README.md)
- [WASM Package Documentation](https://github.com/trueLoving/Pixuli/blob/main/packages/wasm/README.md)

### 8.2 Revision History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                    | Author |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1.0     | 2025-01-27 | Initial draft, based on repository code and documentation                                                                                                                                                                                                                                                                                                  | —      |
| 1.1     | 2025-01-28 | Synced with implementation: Operation log Web/Desktop implemented                                                                                                                                                                                                                                                                                          | —      |
| 1.2     | 2025-01-29 | Updated based on Mobile and Server roadmaps: Mobile batch upload/edit status, Mobile slideshow, Server features (MCP, repository, auth, etc.)                                                                                                                                                                                                              | —      |
| 1.3     | 2025-01-29 | Extended requirements: Incorporated Mobile extension features suitable for Web/Desktop into requirements planning (batch edit, layout optimization, loading optimization, private repository, error handling, offline, AI, favorites/grouping, statistics, quick actions, animation, accessibility, performance optimization, sharing/collaboration, etc.) | —      |
| 1.4     | 2025-01-29 | Synced with implementation: Mobile operation log implemented (Settings → "Operation Log", modal with latest 10 entries, export JSON/CSV, clear all); operation log types and service unified in packages/common (OperationLogService + storage adapters); Mobile batch upload marked as implemented                                                        | —      |

---

_This document is updated with project iterations. Please refer to the code and
latest design documents for the most current information._
