English

# Pixuli App - Intelligent Image Management Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

## 📖 Project Overview

**Pixuli App** is a unified intelligent image management application that
supports both **Web** and **Desktop** platforms. It integrates powerful image
management, processing, and cloud storage features to help you efficiently
organize, process, and store images.

**Supported Platforms**:

- 🌐 **Web**: Progressive Web App (PWA) with offline support
- 🖥️ **Desktop**: Cross-platform desktop application built with Electron

**Core Technology**: Electron + React + TypeScript + Rust (WASM) + Vite

## ✨ Key Features

| Feature Module              | Sub-feature              | Description                                                                          |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| 📸 **Image Management**     | Smart Browsing           | Grid layout display with lazy loading for smooth browsing of large image collections |
|                             | Drag & Drop Upload       | Support for single and batch image uploads                                           |
|                             | Batch Operations         | Batch upload and delete with real-time progress display                              |
|                             | Tag System               | Custom tags with multi-tag management and filtering                                  |
|                             | Search                   | Quick search by name, description, and tags                                          |
|                             | Metadata Editing         | Edit image name, description, and tags                                               |
|                             | Full-screen Preview      | Support for zoom and rotation operations                                             |
| 🔧 **Image Processing**     | WebP Compression         | Adjustable compression quality (10%-100%), balancing quality and file size           |
|                             | Format Conversion        | Support for JPEG, PNG, WebP format conversion                                        |
|                             | Size Adjustment          | Custom width and height with aspect ratio preservation                               |
|                             | Batch Processing         | Batch compression and format conversion                                              |
|                             | Real-time Preview        | Preview effects before processing, show before/after comparison                      |
| ☁️ **Cloud Storage**        | GitHub Integration       | Use GitHub repositories as image storage backend                                     |
|                             | Gitee Integration        | Support Gitee repositories for faster access in China                                |
|                             | Storage Source Switching | Flexible switching between GitHub and Gitee                                          |
|                             | Configuration Management | Support for configuration import, export, and clear                                  |
|                             | Version Control          | Leverage Git version control with complete operation history                         |
| 🪟 **Multi-window Mode**    | Main Window              | Primary interface for source management and project list                             |
|                             | Project Window           | Independent image browsing and management window                                     |
|                             | Compression Window       | Dedicated image compression feature window                                           |
|                             | Conversion Window        | Independent format conversion window                                                 |
| 📋 **Operation Log**        | Operation Recording      | Automatically record all upload, delete, edit operations                             |
|                             | Log Viewing              | Convenient viewing of historical operation details                                   |
|                             | Log Export               | Support for exporting operation logs for backup and analysis                         |
| ⌨️ **Keyboard Shortcuts**   | Keyboard Shortcuts       | Rich keyboard shortcut support for improved efficiency                               |
| 🌐 **Internationalization** | Multi-language Support   | Complete Chinese and English interface switching                                     |
| 🎨 **Theme**                | Theme Switching          | Support for light/dark theme switching                                               |

**Desktop Supported Platforms**: 🍎 macOS (x64, ARM64) | 🪟 Windows (x64)

## 🚀 Quick Start

### Web Mode

```bash
pnpm dev:app:web    # Development mode
pnpm build:app:web   # Build for production
```

### Desktop Mode

```bash
pnpm dev:app:desktop    # Development mode
pnpm build:app:desktop  # Build for production
```

Want to start using Pixuli App? Check out our
[Contributing Guide](../../CONTRIBUTING.md).

## 🤝 Contributing

We welcome all forms of contributions! If you'd like to contribute to the
project, please check the [Contributing Guide](../../CONTRIBUTING.md) for
details.

## 🙏 Acknowledgments

- [Electron](https://electronjs.org/) - Cross-platform desktop application
  framework
- [React](https://reactjs.org/) - User interface library
- [Rust](https://www.rust-lang.org/) - High-performance systems programming
  language
- [NAPI-RS](https://napi.rs/) - Node.js native module bindings
- [image-rs](https://github.com/image-rs/image) - Rust image processing library

---

⭐ If this project is helpful to you, please give us a star!
