# Pixuli Common

Pixuli Common is the shared library for the Pixuli project, providing common
React components, Hooks, utility functions, and services across three platforms
(Web, Desktop, Mobile).

## 📦 Installation

```bash
# Use in monorepo
pnpm add pixuli-common

# Or import directly from source
import { ImageBrowser } from 'pixuli-common/src'
```

## 🚀 Feature Modules

### Components

Components are organized by functionality for easy discovery and maintenance:

#### 📷 Image Components (`components/image/`)

- **ImageBrowser** - Main image browser component
- **ImageGrid** - Image grid view
- **ImageList** - Image list view
- **ImageSorter** - Image sorter
- **ImagePreviewModal** - Image preview modal
- **ImageUrlModal** - Image URL modal
- **ImageEditModal** - Image edit modal
- **ImageUpload** - Image upload component
- **ImageCropModal** - Image crop modal
- **PhotoWall** - Photo wall component
- **Gallery3D** - 3D gallery component
- **Timeline** - Timeline component

#### 🎨 Layout Components (`components/layout/`)

- **Sidebar** - Sidebar component
- **Header** - Header component
- **EmptyState** - Empty state component

#### ⚙️ Config Components (`components/config/`)

- **GitHubConfigModal** - GitHub configuration modal
- **GiteeConfigModal** - Gitee configuration modal

#### 🎯 UI Components (`components/ui/`)

- **Search** - Search component
- **Toaster** - Toast notification component
- **UploadButton** - Upload button component
- **RefreshButton** - Refresh button component
- **ActionButton** - Action button component
- **KeyboardHelpModal** - Keyboard shortcuts help modal
- **LanguageSwitcher** - Language switcher
- **FullScreenLoading** - Full-screen loading component

#### 🚀 Feature Components (`components/features/`)

- **SlideShowPlayer** - Slideshow player
- **SlideShowSettings** - Slideshow settings
- **BrowseModeSwitcher** - Browse mode switcher
- **VersionInfoModal** - Version info modal

#### 🛠️ Development Tools (`components/dev/`)

- **Demo** - Demo component
- **DevTools** - Development tools component

### Hooks

- **useVirtualScroll** - Virtual scroll Hook
- **useLazyLoad** - Lazy load Hook
- **useInfiniteScroll** - Infinite scroll Hook
- **useImageDimensions** - Image dimensions Hook
- **useImageInfo** - Image info Hook
- **useImageDimensionsFromUrl** - Get image dimensions from URL Hook
- **useKeyboard** - Keyboard event Hook
- **useKeyboardShortcut** - Keyboard shortcut Hook
- **useKeyboardMultiple** - Multiple key listener Hook
- **useEscapeKey** - Escape key Hook
- **useEnterKey** - Enter key Hook
- **useArrowKeys** - Arrow keys Hook
- **useNumberKeys** - Number keys Hook
- **useLetterKeys** - Letter keys Hook

### Utility Functions

- **toast** - Toast notification utility
- **fileSizeUtils** - File size formatting utility
- **filterUtils** - Filter utility functions
- **imageUtils** - Image processing utilities (compression, conversion,
  dimension retrieval, etc.)
- **keyboardShortcuts** - Keyboard shortcut management system
- **sortUtils** - Sorting utility functions
- **dateUtils** - Date utility functions

### Services

- **GiteeStorageService** - Gitee storage service
- **GitHubStorageService** - GitHub storage service

### Type Definitions

- **image.ts** - Image-related types
- **github.ts** - GitHub-related types
- **gitee.ts** - Gitee-related types

### Internationalization (Locales)

- Supports Chinese (zh-CN) and English (en-US)
- Provides locale merging and default translation functionality

## 📝 Usage Examples

### Basic Component Usage

```tsx
import {
  ImageBrowser,
  ImageUpload,
  Search,
  Sidebar,
  Header,
} from 'pixuli-common';

function App() {
  return (
    <>
      <Header />
      <Sidebar />
      <Search searchQuery={query} onSearchChange={setQuery} variant="header" />
      <ImageBrowser images={images} />
      <ImageUpload onUpload={handleUpload} />
    </>
  );
}
```

### Hooks Usage

```tsx
import { useImageDimensions, useKeyboard } from 'pixuli-common';

function MyComponent() {
  const { dimensions, loading } = useImageDimensions(file);
  const { isPressed } = useKeyboard('Escape', () => {
    // Handle Escape key
  });

  return <div>...</div>;
}
```

### Utility Functions Usage

```tsx
import { formatFileSize, compressImage, keyboardManager } from 'pixuli-common';

// Format file size
const size = formatFileSize(1024 * 1024); // "1 MB"

// Compress image
const compressed = await compressImage(file, { quality: 0.8 });

// Register keyboard shortcut
keyboardManager.register({
  key: 's',
  ctrlKey: true,
  description: 'Save',
  action: () => save(),
  category: 'General',
});
```

## 🛠️ Development

### Build

```bash
pnpm build
```

### Development Mode (Watch File Changes)

```bash
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# UI mode
pnpm test:ui

# Coverage
pnpm test:coverage
```

## 📊 Test Coverage

The package includes comprehensive unit tests covering:

- ✅ All Hooks (6)
- ✅ All utility functions (7)
- ✅ Component functionality tests (27 test files, 632 test cases)

Tests use Vitest + React Testing Library with jsdom environment.

## 📁 Directory Structure

Components are organized by functionality with a clear structure:

```
components/
├── layout/              # Layout components (3)
│   ├── sidebar/
│   ├── header/
│   └── empty-state/
├── image/               # Image-related components (6)
│   ├── image-browser/
│   ├── image-upload/
│   ├── image-preview-modal/
│   ├── photo-wall/
│   ├── gallery-3d/
│   └── timeline/
├── config/              # Config-related components (2)
│   ├── github-config/
│   └── gitee-config/
├── ui/                  # General UI components (8)
│   ├── search/
│   ├── toaster/
│   ├── upload-button/
│   ├── refresh-button/
│   ├── action-button/
│   ├── language-switcher/
│   ├── keyboard-help/
│   └── fullscreen-loading/
├── features/            # Feature components (3)
│   ├── slide-show/
│   ├── browse-mode-switcher/
│   └── version-info/
└── dev/                 # Development tools (2)
    ├── demo/
    └── devtools/
```

Each component directory structure:

```
component-name/
├── locales/             # Internationalization files (use plural form)
│   ├── index.ts
│   ├── zh-CN.json
│   └── en-US.json
├── common/              # Cross-platform shared code (optional)
│   ├── types.ts
│   ├── hooks.ts
│   └── utils.ts
├── web/                 # Web platform implementation
│   ├── index.ts
│   ├── ComponentName.tsx
│   └── ComponentName.css
└── native/              # React Native implementation (optional)
    ├── index.ts
    └── ComponentName.native.tsx
```

## 📄 License

MIT

## 👤 Author

trueLoving
