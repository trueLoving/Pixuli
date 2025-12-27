English | [中文](./README-ZH.md)

> ⚠️ **迁移通知** **Web 端代码已与桌面端合并到
> [`apps/pixuli`](../pixuli/README.md)**
> 该目录（`apps/web`）将逐步迁移直至删除。新的开发请使用
> `apps/pixuli`，它支持 Web 和 Desktop 两种运行模式。查看
> [Pixuli App 文档](../pixuli/README.md) 了解更多信息。

---

# Pixuli Web - Intelligent Image Management Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

## 📖 Project Overview

**Pixuli Web** is an intelligent image management web application built with
React + TypeScript + Vite. Using GitHub and Gitee as storage backends, it
provides complete image management, upload, browsing, and editing capabilities.

**Core Technology**: React + TypeScript + Vite

## ✨ Key Features

| Feature Module              | Sub-feature              | Description                                                                     |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| 📸 **Image Management**     | Smart Browsing           | Grid layout display with lazy loading and responsive layout                     |
|                             | Drag & Drop Upload       | Support for single and batch image uploads                                      |
|                             | Batch Operations         | Batch upload and delete with real-time progress display                         |
|                             | Tag System               | Custom tags with multi-tag management and filtering                             |
|                             | Search                   | Quick search by name, description, and tags                                     |
|                             | Metadata Editing         | Edit image name, description, and tags                                          |
|                             | Full-screen Preview      | Support for zoom and rotation operations                                        |
|                             | Slide Show               | Support for slide show mode to browse images                                    |
| 🔧 **Image Processing**     | Pre-upload Compression   | Configurable compression options (quality, size, format, etc.)                  |
| ☁️ **Cloud Storage**        | GitHub Integration       | Use GitHub repositories as image storage backend                                |
|                             | Gitee Integration        | Support Gitee repositories for faster access in China                           |
|                             | Storage Source Switching | Flexible switching between GitHub and Gitee                                     |
|                             | Configuration Management | Support for configuration import, export, and clear                             |
|                             | Version Control          | Leverage Git version control with complete operation history                    |
|                             | Metadata Storage         | Store image metadata as hidden files                                            |
| 📱 **PWA Features**         | Install to Home Screen   | Support for installing the app to home screen, providing native-like experience |
|                             | Offline Support          | Support for offline access and background sync                                  |
| ⌨️ **Keyboard Shortcuts**   | Keyboard Shortcuts       | Rich keyboard shortcut support for improved efficiency                          |
| 🌐 **Internationalization** | Multi-language Support   | Complete Chinese and English interface switching                                |
| 🎨 **Theme**                | Theme Switching          | Support for light/dark theme switching                                          |

**Supported Platforms**: 🌐 Modern browsers (Chrome, Firefox, Safari, Edge,
etc.) | 📱 Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## 📸 Feature Details

### Image Management

Pixuli Web provides powerful image management features to help you easily
organize and browse images:

| Feature                 | Description                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **Smart Browsing**      | Grid layout display with lazy loading and responsive layout                        |
| **Drag & Drop Upload**  | Support for single and batch image uploads with intuitive drag-and-drop operations |
| **Batch Operations**    | Batch upload and delete with real-time progress display                            |
| **Tag System**          | Custom tags with multi-tag management and filtering                                |
| **Search**              | Quick search by name, description, and tags                                        |
| **Metadata Editing**    | Edit image name, description, and tags                                             |
| **Full-screen Preview** | Immersive full-screen preview experience with zoom and rotation support            |
| **Slide Show**          | Support for slide show mode to browse images with multiple transition effects      |

### Image Processing

Pre-upload image processing to optimize storage space:

| Feature                    | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| **Pre-upload Compression** | Configurable compression options (quality, size, format, etc.) |

### Cloud Storage

Version-controlled storage solution based on Git, providing secure and reliable
cloud storage services:

| Feature                      | Description                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **GitHub Integration**       | Use GitHub repositories as image storage backend                                  |
| **Gitee Integration**        | Support Gitee repositories for faster access in China                             |
| **Storage Source Switching** | Flexible switching between GitHub and Gitee storage sources                       |
| **Configuration Management** | Support for configuration import, export, and clear for easy migration and backup |
| **Version Control**          | Fully leverage Git version control with complete operation history                |
| **Metadata Storage**         | Store image metadata as hidden files                                              |

### PWA Features

Progressive Web App features providing native-like experience:

| Feature                    | Description                                                                     |
| -------------------------- | ------------------------------------------------------------------------------- |
| **Install to Home Screen** | Support for installing the app to home screen, providing native-like experience |
| **Offline Support**        | Support for offline access and background sync                                  |

### User Experience

User experience design focused on details for more convenient use:

| Feature                  | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| **Keyboard Shortcuts**   | Rich keyboard shortcut support for improved efficiency |
| **Responsive Design**    | Adapted for desktop and mobile devices                 |
| **Toast Notifications**  | Real-time feedback on operation results                |
| **Loading States**       | Display upload and processing progress                 |
| **Theme Switching**      | Support for light/dark theme switching                 |
| **Internationalization** | Complete Chinese and English interface switching       |

## 🚀 Quick Start

> **⚠️ Migration Notice** **Web functionality has been merged into
> [`apps/pixuli`](../pixuli/README.md)** This directory (`apps/web`) will be
> gradually migrated and eventually removed. For new development, please use
> `apps/pixuli`, which supports both Web and Desktop modes.
>
> ```bash
> # Web mode development
> pnpm dev:app:web
>
> # Web mode build
> pnpm build:app:web
> ```
>
> See [Pixuli App Documentation](../pixuli/README.md) for more information.

Want to start using Pixuli Web? Check out our
[Contributing Guide](../../CONTRIBUTING.md).

## 🐳 Docker Local Build

> **⚠️ Note**: Docker build instructions are for reference only. For new
> deployments, please use `apps/pixuli` with Web mode build.

### Prerequisites

- Docker installed (version >= 20.10)
- Node.js (version >= 22.0.0) and pnpm (version >= 8.0.0) installed
- Ensure Docker service is running

### Build Process

**Optimized build process**:

1. First build the application locally (generate `dist` directory)
2. Then copy the build artifacts to the Docker image
3. Use Nginx to serve static files

**Advantages**:

- ✅ Smaller image size (only includes Nginx, not Node.js build environment)
- ✅ Faster build speed (local build can utilize cache)
- ✅ Reduced image layers, optimized storage space

### Using Build Script (Recommended)

1. **Grant script execution permission**:

   ```bash
   chmod +x apps/web/build-docker.sh
   ```

2. **Execute build script**:

   ```bash
   # Use default tag latest (script will automatically detect and build the application)
   ./apps/web/build-docker.sh

   # Or specify version tag
   ./apps/web/build-docker.sh 1.0.0
   ```

   The script will automatically execute the following steps:
   - Check if `dist` directory exists
   - If not, automatically execute `pnpm build:web` to build the application
   - Build Docker image

3. **Run container**:

   ```bash
   docker run -d -p 8080:80 --name pixuli-web pixuli-web:latest
   ```

4. **Access application**: Open browser and visit `http://localhost:8080`

### Manual Build

If you don't want to use the script, you can also build manually:

```bash
# Step 1: Build application in project root directory
pnpm build:web

# Step 2: Build Docker image (ensure dist directory exists)
docker build -f apps/web/Dockerfile -t pixuli-web:latest .

# Step 3: Run container
docker run -d -p 8080:80 --name pixuli-web pixuli-web:latest
```

### Common Docker Commands

```bash
# View running containers
docker ps

# View container logs
docker logs -f pixuli-web

# Stop container
docker stop pixuli-web

# Start stopped container
docker start pixuli-web

# Remove container
docker rm pixuli-web

# Remove image
docker rmi pixuli-web:latest

# View image list and sizes
docker images | grep pixuli-web
```

### Build Notes

- **Build Context**: Build context is project root directory, Dockerfile is
  located at `apps/web/Dockerfile`
- **Build Artifacts**: Need to execute `pnpm build:web` first to generate
  `apps/web/dist` directory
- **Image Contents**: Only includes Nginx and static files, not Node.js build
  environment and startup scripts
- **Image Size**: Optimized image size is approximately 20-30MB (only includes
  Nginx Alpine and static files)
- **Port Mapping**: Container uses port 80 internally, mapped to host port 8080
  (customizable)

### Environment Variable Configuration

Environment variables need to be configured through `.env` file **at build
time**. Vite will inject environment variables into application code during
build.

#### Configuration Steps

1. **Create environment variable file**:

   ```bash
   # Copy example file in apps/web directory
   cd apps/web
   cp env.example .env

   # Edit configuration file
   nano .env
   ```

2. **Configure environment variables**:

   Edit `.env` file and set required environment variables:

   ```bash
   # Demo mode settings
   VITE_DEMO_MODE=false

   # GitHub demo configuration
   VITE_DEMO_GITHUB_OWNER=your-owner
   VITE_DEMO_GITHUB_REPO=your-repo
   VITE_DEMO_GITHUB_BRANCH=main
   VITE_DEMO_GITHUB_TOKEN=your-token
   VITE_DEMO_GITHUB_PATH=/images

   # Gitee demo configuration
   VITE_DEMO_GITEE_OWNER=your-owner
   VITE_DEMO_GITEE_REPO=your-repo
   VITE_DEMO_GITEE_BRANCH=main
   VITE_DEMO_GITEE_TOKEN=your-token
   VITE_DEMO_GITEE_PATH=/images

   # Gitee proxy configuration
   VITE_USE_GITEE_PROXY=true
   ```

3. **Rebuild application and image**:

   ```bash
   # Build application (will automatically read .env file)
   pnpm build:web

   # Build Docker image
   ./apps/web/build-docker.sh
   ```

#### Supported Environment Variables

Refer to `apps/web/env.example` file, the following environment variables are
supported:

- `VITE_DEMO_MODE` - Demo mode switch
- `VITE_DEMO_GITHUB_OWNER` - GitHub repository owner
- `VITE_DEMO_GITHUB_REPO` - GitHub repository name
- `VITE_DEMO_GITHUB_BRANCH` - GitHub branch name
- `VITE_DEMO_GITHUB_TOKEN` - GitHub access token
- `VITE_DEMO_GITHUB_PATH` - GitHub image path
- `VITE_DEMO_GITEE_OWNER` - Gitee repository owner
- `VITE_DEMO_GITEE_REPO` - Gitee repository name
- `VITE_DEMO_GITEE_BRANCH` - Gitee branch name
- `VITE_DEMO_GITEE_TOKEN` - Gitee access token
- `VITE_DEMO_GITEE_PATH` - Gitee image path
- `VITE_USE_GITEE_PROXY` - Whether to use Gitee proxy

#### Environment Variable Injection Mechanism

- Vite will read environment variables starting with `VITE_` from `.env` file
  during build
- Environment variables will be injected into build artifacts and accessed via
  `import.meta.env`
- Environment variables are determined at build time and cannot be modified at
  runtime

Access in application code:

```typescript
// Access environment variables
const demoMode = import.meta.env.VITE_DEMO_MODE;
const githubOwner = import.meta.env.VITE_DEMO_GITHUB_OWNER;
```

### Notes

- If you modify source code, you need to re-execute `pnpm build:web` before
  building Docker image
- `dist` directory will be copied to the image, ensure build artifacts are up to
  date
- Build script will automatically detect `dist` directory and prompt if it
  doesn't exist
- **Environment variables are injected at build time**, modifications to `.env`
  file require rebuilding application and image to take effect
- `.env` file should be placed in `apps/web/` directory, Vite will automatically
  read it
- It's recommended to add `.env` to `.gitignore` to avoid committing sensitive
  information

## 🤝 Contributing

We welcome all forms of contributions! If you'd like to contribute to the
project, please check the [Contributing Guide](../../CONTRIBUTING.md) for
details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - User interface library
- [Vite](https://vitejs.dev/) - Build tool
- [Octokit](https://octokit.github.io/) - GitHub API client
- [Lucide React](https://lucide.dev/) - Icon library
- [React Hot Toast](https://react-hot-toast.com/) - Notification component
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [i18next](https://www.i18next.com/) - Internationalization framework

---

⭐ If this project is helpful to you, please give us a star!
