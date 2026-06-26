# Pixuli — Git-based Image Host Client

> **🖼️ Pixuli** — AI-based image analysis, automatic tag generation, and batch
> processing. A **three-platform** client for managing images in **GitHub /
> Gitee repositories** (no official self-hosted server).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)
[![pnpm](https://img.shields.io/badge/pnpm-10.18.3-orange.svg)](https://pnpm.io/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-2.0.0-blue.svg)](https://pixuli-web.vercel.app/)
[![Documentation](https://img.shields.io/badge/Documentation-Wiki-blue.svg)](https://github.com/trueLoving/Pixuli/wiki)

---

## What is Pixuli?

Pixuli is a **Monorepo** image management client. Images are stored in Git
repositories you configure; the app handles browsing, upload, metadata, and
utility tools on **Web (PWA)**, **Desktop (Electron)**, and **Mobile (Expo)**.

| Principle            | Detail                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Storage**          | GitHub / Gitee via `StorageProvider` plugins (`@pixuli/provider-github`, `@pixuli/provider-gitee`) |
| **Official server**  | **None** — `server/` (NestJS) is archived; use community plugins or self-hosted APIs if needed     |
| **Image processing** | Browser **Canvas** in Web/Desktop renderers (Rust WASM removed from main build)                    |
| **Product focus**    | Grid/list photo host (L2) + compress/convert tools + settings                                      |

Removed or deferred features (slideshow, timeline, photo wall, etc.) are listed
in [docs/backlog.md](docs/backlog.md). Refactor tracking:
[REFACTOR_PLAN.md](REFACTOR_PLAN.md).

---

## Maintenance scope

| Area                                  | Status        | Notes                                                               |
| ------------------------------------- | ------------- | ------------------------------------------------------------------- |
| **Web** (`apps/pixuli`, Vite)         | ✅ Maintained | PWA; dev server `http://localhost:5500`                             |
| **Desktop** (`apps/pixuli`, Electron) | ✅ Maintained | Shares UI with Web via `@pixuli/ui`                                 |
| **Mobile** (`apps/pixuli`, Capacitor) | ✅ Maintained | Android via `dev:android` / `build:android`; same UI as Web/Desktop |
| **`@pixuli/core`**                    | ✅ Maintained | Types, utilities, `StoragePluginRegistry`                           |
| **`@pixuli/ui`**                      | ✅ Maintained | Web/Desktop/Mobile UI; `./native` deprecated                        |
| **`@pixuli/provider-*`**              | ✅ Maintained | Official GitHub/Gitee storage plugins                               |
| **`archive/wasm`**                    | 📦 Archived   | Not in workspace; reference only                                    |
| **`archive/benchmark`**               | 📦 Archived   | Not in workspace                                                    |
| **`archive/apps/mobile`**             | 📦 Archived   | Expo RN; reference only; use Capacitor in `apps/pixuli`             |
| **`archive/server`**                  | 📦 Archived   | Not in workspace; not an official deliverable                       |

---

## Key features (current)

| Module         | Description                                                                           |
| -------------- | ------------------------------------------------------------------------------------- |
| **Photo host** | Grid/list browse, upload (single/batch), delete, metadata, search, fullscreen preview |
| **Tools**      | WebP compression, format conversion (`/compress`, `/convert`)                         |
| **Storage**    | GitHub & Gitee sources, switch sources, import/export config; tokens stored locally   |
| **Experience** | Light/dark theme, zh/en i18n, keyboard shortcuts, responsive layout, PWA (Web)        |

---

## Project structure

```text
Pixuli/
├── apps/
│   ├── pixuli/                          # Web + Desktop (Vite + React + Electron)
│   └── mobile/                          # Mobile (Expo + React Native)
├── packages/
│   ├── core/                            # @pixuli/core — types, registry, utilities
│   ├── ui/                              # @pixuli/ui — shared Web/Desktop UI
│   ├── plugin-provider-github/          # @pixuli/provider-github
│   └── plugin-provider-gitee/           # @pixuli/provider-gitee
├── archive/                             # wasm, benchmark, server (not in workspace)
├── docs/                                # PRD, system/business design, backlog
├── REFACTOR_PLAN.md                     # Milestones & GitHub Issue map
└── pnpm-workspace.yaml
```

---

## Requirements

### All contributors

| Tool        | Version                                            |
| ----------- | -------------------------------------------------- |
| **Node.js** | >= 22.0.0                                          |
| **pnpm**    | >= 8.0.0 (**required**; repo uses pnpm workspaces) |
| **Git**     | >= 2.0.0                                           |

> **No Rust toolchain** is required for the main app. WASM modules live under
> `archive/wasm/` only.

### Platform-specific (optional)

| Platform           | Extra                                                        |
| ------------------ | ------------------------------------------------------------ |
| **Desktop**        | macOS 10.15+ or Windows 10/11 for running/packaging Electron |
| **Web**            | Modern browser with Canvas API                               |
| **Mobile Android** | Android Studio, SDK 33+, JDK 17                              |
| **Mobile iOS**     | Xcode (iOS build not yet released)                           |

---

## Quick start

```bash
git clone https://github.com/trueLoving/Pixuli.git
cd Pixuli
pnpm install

# Development
pnpm dev:web       # Web → http://localhost:5500
pnpm dev:desktop   # Desktop (Electron)
pnpm dev:android       # Mobile Android (Capacitor + Live Reload)
pnpm run:android       # Reconnect to running dev server
```

### Build & verify

```bash
pnpm build:web
pnpm build:desktop
pnpm ci            # lint + test + web/desktop typecheck & build (CI gate)
```

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for workflow, code style, and
commit conventions.

---

## Downloads

### Desktop

| Platform            | Get it                                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| Windows             | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) — `.exe` |
| macOS Intel         | Releases — `mac-x64` `.dmg`                                               |
| macOS Apple Silicon | Releases — `mac-arm64` `.dmg`                                             |

### Web

| Method    | Link                                                    |
| --------- | ------------------------------------------------------- |
| Live demo | [pixuli-web.vercel.app](https://pixuli-web.vercel.app/) |
| Docker    | `docker run -d -p 8080:80 trueloving/pixuli-web:latest` |

### Mobile

| Platform | Get it                                                                    |
| -------- | ------------------------------------------------------------------------- |
| Android  | [GitHub Releases](https://github.com/trueLoving/Pixuli/releases) — `.apk` |

> **Upgrade note:** Releases before the M1 refactor (e.g. `v1.3.0-desktop`) may
> include slideshow and WASM features removed on `main`. See
> [CHANGELOG.md](./CHANGELOG.md) `[Unreleased]` and
> [Release versioning](docs/01-product/03-Release-Versioning.md) before
> upgrading.

---

## Documentation

| Audience                     | Document                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| **Users**                    | [GitHub Wiki](https://github.com/trueLoving/Pixuli/wiki) — install, configure sources, daily use |
| **Product**                  | [docs/01-product/](docs/01-product/) — PRD, scope & cut list, usage tutorial                     |
| **Removed / deferred**       | [docs/backlog.md](docs/backlog.md)                                                               |
| **Developers**               | [docs/README.md](docs/README.md) — full doc index                                                |
| **Contributing**             | [CONTRIBUTING.md](./CONTRIBUTING.md)                                                             |
| **AI agents**                | [AGENTS.md](./AGENTS.md) — Cursor Rules/Skills, monorepo context (REF-414)                       |
| **Refactor plan**            | [REFACTOR_PLAN.md](./REFACTOR_PLAN.md)                                                           |
| **Changelog**                | [CHANGELOG.md](./CHANGELOG.md)                                                                   |
| **App (Web/Desktop/Mobile)** | [apps/pixuli/README.md](./apps/pixuli/README.md)                                                 |
| **Mobile (archived RN)**     | [archive/apps/mobile/README.md](./archive/apps/mobile/README.md)                                 |

---

## Acknowledgments

- [Electron](https://electronjs.org/) · [React](https://reactjs.org/) ·
  [React Native](https://reactnative.dev/) · [Expo](https://expo.dev/) ·
  [Vite](https://vitejs.dev/) · [Zustand](https://zustand-demo.pmnd.rs/) ·
  [pnpm](https://pnpm.io/)

---

⭐ If this project helps you, consider giving it a star!
