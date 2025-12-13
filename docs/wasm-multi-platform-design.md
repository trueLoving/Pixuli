# WASM 多平台支持设计方案

## 📋 目录

- [1. 方案概述](#1-方案概述)
- [2. 目标架构](#2-目标架构)
- [3. 技术方案](#3-技术方案)
- [4. 迁移步骤](#4-迁移步骤)
- [5. 构建配置](#5-构建配置)
- [6. 三端使用方式](#6-三端使用方式)
- [7. 注意事项](#7-注意事项)
- [8. 总结](#8-总结)

---

## 1. 方案概述

### 1.1 方案选择

**统一使用 WASM（WebAssembly）方案**，移除 NAPI，实现三端统一支持：

- ✅ **Web 端**：纯浏览器环境
- ✅ **PC 端**：Electron 应用（主进程和渲染进程）
- ✅ **Mobile 端**：React Native 应用

### 1.2 核心优势

1. **统一构建**：只需 `wasm-pack` 一个构建工具
2. **代码简洁**：无需条件编译，代码更清晰
3. **跨平台**：一套代码，三端通用
   - ✅ **Web 浏览器**：原生支持 WASM
   - ✅ **Node.js**：从 v8.0.0 开始原生支持 WASM（推荐 v14+）
   - ✅ **Electron**：基于 Node.js，完全支持 WASM
   - ✅ **React Native**：通过 bundler 支持 WASM
4. **维护成本低**：只需维护一套构建配置
5. **性能足够**：WASM 性能约为原生 80-90%，对图片处理完全足够

### 1.3 当前状态

- **当前实现**：使用 NAPI-RS 实现 Node.js 原生模块
- **迁移目标**：完全移除 NAPI，统一使用 WASM
- **支持平台**：Web、PC（Electron）、Mobile（React Native）

---

## 2. 目标架构

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Rust 源代码层                         │
│  packages/wasm/src/                                     │
│  ├── lib.rs (WASM 入口)                                  │
│  ├── compress/ (压缩模块)                                │
│  ├── convert/ (转换模块)                                 │
│  ├── analyze/ (分析模块)                                 │
│  └── edit/ (编辑模块)                                    │
└─────────────────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   wasm-pack 构建      │
        │   - target web       │
        │   - target nodejs    │
        │   - target bundler   │
        └──────────────────────┘
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
┌─────────────┐              ┌─────────────┐
│ pkg-web/    │              │ pkg-node/   │
│ (Web)       │              │ (Node.js)   │
└─────────────┘              └─────────────┘
    ↓                               ↓
┌─────────────┐              ┌─────────────┐
│ pkg-mobile/ │              │ 统一入口     │
│ (React Native)             │ index.js     │
└─────────────┘              └─────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│              应用层                                  │
│  - apps/web/ (Web 应用)                              │
│  - apps/desktop/ (Electron 应用)                    │
│  - apps/mobile/ (React Native 应用)                 │
└─────────────────────────────────────────────────────┘
```

### 2.2 平台支持

| 运行环境          | WASM 目标          | WASM 支持   | 说明                                |
| ----------------- | ------------------ | ----------- | ----------------------------------- |
| Web 浏览器        | `--target web`     | ✅ 原生支持 | Chrome 57+, Firefox 52+, Safari 11+ |
| Node.js           | `--target nodejs`  | ✅ 原生支持 | Node.js v8.0.0+（推荐 v14+）        |
| Electron 渲染进程 | `--target web`     | ✅ 原生支持 | 基于浏览器环境                      |
| Electron 主进程   | `--target nodejs`  | ✅ 原生支持 | 基于 Node.js 环境                   |
| React Native      | `--target bundler` | ✅ 支持     | 通过打包工具加载                    |

**Node.js WASM 支持说明**：

- Node.js 从 **v8.0.0** 开始原生支持 WebAssembly
- 推荐使用 **Node.js v14+** 以获得更好的性能和稳定性
- Node.js 提供了全局 `WebAssembly` 对象，可以直接加载和运行 WASM 模块
- 支持 `WebAssembly.compile()`、`WebAssembly.instantiate()` 等 API
- 还支持 **WASI**（WebAssembly System Interface），允许访问文件系统等系统资源

---

## 3. 技术方案

### 3.1 技术栈

#### Rust 层

- **wasm-bindgen**: WASM 绑定生成（`wasm-bindgen`）
- **image-rs**: 图片处理核心库
- **webp**: WebP 格式支持
- **serde**: 序列化支持

#### 构建工具

- **wasm-pack**: 唯一构建工具，支持多平台
- **Cargo**: Rust 包管理

#### JavaScript 层

- **统一入口**: 简单的环境检测和加载逻辑
- **TypeScript**: 类型定义支持

### 3.2 构建产物

使用 `wasm-pack` 构建三个平台的版本：

1. **pkg-web/**: Web 浏览器版本（`--target web`）
2. **pkg-node/**: Node.js 版本（`--target nodejs`）
3. **pkg-mobile/**: React Native 版本（`--target bundler`）

---

## 4. 迁移步骤

### 4.1 阶段一：修改 Rust 代码（移除 NAPI）

#### 4.1.1 修改 Cargo.toml

```toml
[package]
authors = ["trueLoving"]
edition = "2021"
name = "pixuli_wasm"
version = "0.1.0"

[lib]
crate-type = ["cdylib"]

[dependencies]
# 图片处理库
image = { version = "0.24", features = ["jpeg", "png", "gif", "bmp", "tiff"] }
webp = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# WASM 绑定（必需）
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"  # 异步支持（如果需要）

# 移除以下 NAPI 相关依赖：
# napi = "3.0.0"  ❌ 删除
# napi-derive = "3.0.0"  ❌ 删除

# 移除 build-dependencies：
# [build-dependencies]
# napi-build = "2"  ❌ 删除

[dev-dependencies]
tempfile = "3.0"
image = { version = "0.24", features = ["jpeg", "png", "gif", "bmp", "tiff"] }

[profile.release]
lto = "thin"
strip = "symbols"
opt-level = 3
codegen-units = 1
```

#### 4.1.2 修改 lib.rs（移除 NAPI，使用 wasm-bindgen）

```rust
// packages/wasm/src/lib.rs

use wasm_bindgen::prelude::*;

// 导入模块
pub mod convert;
pub mod image;
pub mod compress;
pub mod analyze;
pub mod edit;

// 重新导出主要功能
pub use image::*;
pub use compress::*;

pub use convert::{
    FormatConversionOptions,
    FormatConversionResult,
    ResizeOptions,
};

pub use analyze::{
    AIAnalysisOptions,
    AIAnalysisResult,
};

// WASM 导出函数
#[wasm_bindgen]
pub fn plus_100(input: u32) -> u32 {
    input + 100
}

// 其他函数在各模块中导出...
```

#### 4.1.3 修改各模块文件（示例：compress/mod.rs）

**之前（NAPI 版本）**：

```rust
use napi_derive::napi;
use napi::Error as NapiError;

#[napi]
pub fn compress_to_webp(
    image_data: Vec<u8>,
    options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, NapiError> {
    // 实现逻辑
}
```

**之后（WASM 版本）**：

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn compress_to_webp(
    image_data: &[u8],
    options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, JsValue> {
    compress_to_webp_impl(image_data.to_vec(), options)
        .map_err(|e| JsValue::from_str(&e))
}

// 内部实现函数（不导出）
fn compress_to_webp_impl(
    image_data: Vec<u8>,
    options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, String> {
    // 实际的压缩逻辑
    // ...
}
```

#### 4.1.4 类型转换注意事项

**NAPI 到 WASM 的类型映射**：

| NAPI 类型              | WASM 类型            | 说明                 |
| ---------------------- | -------------------- | -------------------- |
| `Vec<u8>`              | `&[u8]`              | 数组参数使用切片     |
| `Result<T, NapiError>` | `Result<T, JsValue>` | 错误类型改为 JsValue |
| `Option<T>`            | `Option<T>`          | 保持不变             |
| `String`               | `String`             | 保持不变             |
| `u32`, `i32` 等        | `u32`, `i32`         | 保持不变             |

#### 4.1.5 删除 build.rs

如果存在 `build.rs` 文件（用于 NAPI 构建），可以删除：

```bash
rm packages/wasm/build.rs
```

### 4.2 阶段二：创建统一入口文件

#### 4.2.1 创建 index.js

```javascript
// packages/wasm/index.js

/**
 * 统一 WASM 入口：根据运行环境自动加载对应的 WASM 模块
 */

let wasmModule = null;
let initPromise = null;

/**
 * 检测运行环境
 */
function detectEnvironment() {
  // React Native 环境
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'react-native';
  }

  // 浏览器环境（包括 Electron 渲染进程）
  if (typeof window !== 'undefined' || typeof self !== 'undefined') {
    return 'browser';
  }

  // Node.js 环境（包括 Electron 主进程）
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    return 'node';
  }

  return 'browser'; // 默认浏览器环境
}

/**
 * 初始化 WASM 模块
 */
async function init() {
  if (wasmModule) {
    return wasmModule;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const env = detectEnvironment();

    try {
      let module;

      if (env === 'browser') {
        // Web 端：使用 web 版本
        module = await import('./pkg-web/pixuli_wasm.js');
        await module.default(); // 初始化 WASM
      } else if (env === 'react-native') {
        // React Native：使用 bundler 版本
        module = await import('./pkg-mobile/pixuli_wasm.js');
        await module.default();
      } else {
        // Node.js/Electron 主进程：使用 nodejs 版本
        module = await import('./pkg-node/pixuli_wasm.js');
        await module.default();
      }

      wasmModule = module;
      return wasmModule;
    } catch (err) {
      initPromise = null;
      throw new Error(`Failed to load WASM module: ${err.message}`);
    }
  })();

  return initPromise;
}

/**
 * 确保 WASM 已初始化
 */
async function ensureInitialized() {
  if (!wasmModule) {
    await init();
  }
  return wasmModule;
}

// 导出所有功能函数
module.exports = {
  init,

  async compressToWebp(imageData, options) {
    const module = await ensureInitialized();
    return module.compress_to_webp(imageData, options);
  },

  async batchCompressToWebp(imagesData, options) {
    const module = await ensureInitialized();
    return module.batch_compress_to_webp(imagesData, options);
  },

  async convertImageFormat(imageData, options) {
    const module = await ensureInitialized();
    return module.convert_image_format(imageData, options);
  },

  async batchConvertImageFormat(imagesData, options) {
    const module = await ensureInitialized();
    return module.batch_convert_image_format(imagesData, options);
  },

  async getImageInfo(imageData) {
    const module = await ensureInitialized();
    return module.get_image_info(imageData);
  },

  async analyzeImage(imageData, options) {
    const module = await ensureInitialized();
    return module.analyze_image(imageData, options);
  },

  async batchAnalyzeImages(imagesData, options) {
    const module = await ensureInitialized();
    return module.batch_analyze_images(imagesData, options);
  },

  async getSupportedFormats() {
    const module = await ensureInitialized();
    return module.get_supported_formats();
  },

  async getFormatInfo(formatStr) {
    const module = await ensureInitialized();
    return module.get_format_info(formatStr);
  },

  async checkModelAvailability(modelPath) {
    const module = await ensureInitialized();
    return module.check_model_availability(modelPath);
  },

  plus100(input) {
    // 同步函数，不需要初始化检查（但建议先调用 init）
    if (!wasmModule) {
      throw new Error('WASM module not initialized. Call init() first.');
    }
    return wasmModule.plus_100(input);
  },
};
```

#### 4.2.2 更新 package.json

```json
{
  "name": "pixuli-wasm",
  "version": "1.0.0",
  "description": "Pixuli WASM - Multi-platform image processing library",
  "main": "index.js",
  "types": "index.d.ts",
  "license": "MIT",

  "exports": {
    ".": {
      "node": "./index.js",
      "browser": "./index.js",
      "react-native": "./index.js",
      "default": "./index.js"
    },
    "./pkg-web": "./pkg-web/pixuli_wasm.js",
    "./pkg-node": "./pkg-node/pixuli_wasm.js",
    "./pkg-mobile": "./pkg-mobile/pixuli_wasm.js"
  },

  "files": [
    "index.js",
    "index.d.ts",
    "pkg-web/**/*",
    "pkg-node/**/*",
    "pkg-mobile/**/*"
  ],

  "scripts": {
    "build": "pnpm run build:wasm",
    "build:wasm": "pnpm run build:wasm:web && pnpm run build:wasm:node && pnpm run build:wasm:mobile",
    "build:wasm:web": "wasm-pack build --target web --out-dir pkg-web --release",
    "build:wasm:node": "wasm-pack build --target nodejs --out-dir pkg-node --release",
    "build:wasm:mobile": "wasm-pack build --target bundler --out-dir pkg-mobile --release",
    "build:wasm:dev": "pnpm run build:wasm:web:dev && pnpm run build:wasm:node:dev && pnpm run build:wasm:mobile:dev",
    "build:wasm:web:dev": "wasm-pack build --target web --out-dir pkg-web --dev",
    "build:wasm:node:dev": "wasm-pack build --target nodejs --out-dir pkg-node --dev",
    "build:wasm:mobile:dev": "wasm-pack build --target bundler --out-dir pkg-mobile --dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },

  "devDependencies": {
    "typescript": "^5.8.3"
  },

  "engines": {
    "node": ">= 14.0.0"
  },

  "packageManager": "pnpm@10.13.1"
}
```

**移除的配置**：

- ❌ `"napi"` 配置块
- ❌ `"@napi-rs/cli"` 依赖
- ❌ `build:napi` 脚本
- ❌ `*.node` 文件配置

### 4.3 阶段三：更新 TypeScript 类型定义

#### 4.3.1 更新 index.d.ts

```typescript
// packages/wasm/index.d.ts

export interface WebPCompressOptions {
  quality?: number;
  lossless?: boolean;
}

export interface WebPCompressResult {
  data: number[];
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export interface FormatConversionOptions {
  targetFormat: string;
  quality?: number;
  preserveTransparency?: boolean;
  lossless?: boolean;
  colorSpace?: string;
  resize?: ResizeOptions;
}

export interface FormatConversionResult {
  data: number[];
  originalSize: number;
  convertedSize: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  conversionTime: number;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface AIAnalysisOptions {
  modelPath?: string;
  confidenceThreshold?: number;
  maxTags?: number;
  analyzeColors?: boolean;
  detectObjects?: boolean;
}

export interface AIAnalysisResult {
  success: boolean;
  imageType: string;
  tagsJson: string;
  description: string;
  confidence: number;
  objectsJson: string;
  colorsJson: string;
  sceneType: string;
  analysisTime: number;
  modelUsed: string;
  imageInfoJson: string;
  error?: string;
}

// 导出函数
export function init(): Promise<void>;
export function compressToWebp(
  imageData: number[] | Uint8Array,
  options?: WebPCompressOptions,
): Promise<WebPCompressResult>;
export function batchCompressToWebp(
  imagesData: (number[] | Uint8Array)[],
  options?: WebPCompressOptions,
): Promise<WebPCompressResult[]>;
export function convertImageFormat(
  imageData: number[] | Uint8Array,
  options: FormatConversionOptions,
): Promise<FormatConversionResult>;
export function batchConvertImageFormat(
  imagesData: (number[] | Uint8Array)[],
  options: FormatConversionOptions,
): Promise<FormatConversionResult[]>;
export function getImageInfo(imageData: number[] | Uint8Array): Promise<string>;
export function analyzeImage(
  imageData: number[] | Uint8Array,
  options?: AIAnalysisOptions,
): Promise<AIAnalysisResult>;
export function batchAnalyzeImages(
  imagesData: (number[] | Uint8Array)[],
  options?: AIAnalysisOptions,
): Promise<AIAnalysisResult[]>;
export function getSupportedFormats(): Promise<string[]>;
export function getFormatInfo(formatStr: string): Promise<string>;
export function checkModelAvailability(modelPath: string): Promise<boolean>;
export function plus100(input: number): number;
```

### 4.4 阶段四：删除 NAPI 相关文件

```bash
# 删除 NAPI 构建产物
rm -f packages/wasm/*.node
rm -f packages/wasm/pixuli-wasm.*.node

# 删除 NAPI 构建脚本（如果存在）
rm -f packages/wasm/build.rs

# 删除旧的 index.js（NAPI 生成的）
# 注意：先备份，然后替换为新版本
mv packages/wasm/index.js packages/wasm/index.js.backup
# 然后创建新的 index.js（见 4.2.1）
```

---

## 5. 构建配置

### 5.1 安装 wasm-pack

```bash
# macOS/Linux
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 或使用 cargo
cargo install wasm-pack

# 验证安装
wasm-pack --version
```

### 5.2 构建脚本

创建 `packages/wasm/scripts/build.sh`：

```bash
#!/bin/bash
set -e

echo "Building WASM modules for all platforms..."

echo "  - Web target..."
wasm-pack build --target web --out-dir pkg-web --release

echo "  - Node.js target..."
wasm-pack build --target nodejs --out-dir pkg-node --release

echo "  - Mobile target..."
wasm-pack build --target bundler --out-dir pkg-mobile --release

echo "Build complete!"
```

### 5.3 CI/CD 配置

```yaml
# .github/workflows/build-wasm.yml
name: Build WASM

on:
  push:
    paths:
      - 'packages/wasm/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install wasm-pack
        run:
          curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.13.1

      - name: Install dependencies
        run: pnpm install

      - name: Build WASM (Web)
        run:
          cd packages/wasm && wasm-pack build --target web --out-dir pkg-web
          --release

      - name: Build WASM (Node.js)
        run:
          cd packages/wasm && wasm-pack build --target nodejs --out-dir pkg-node
          --release

      - name: Build WASM (Mobile)
        run:
          cd packages/wasm && wasm-pack build --target bundler --out-dir
          pkg-mobile --release
```

---

## 6. 三端使用方式

### 6.1 Web 端使用

#### 6.1.1 基础使用

```typescript
// apps/web/src/utils/imageProcessor.ts
import { init, compressToWebp, convertImageFormat } from 'pixuli-wasm';

// 初始化（只需要一次，建议在应用启动时调用）
let wasmInitialized = false;

async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

/**
 * 压缩图片为 WebP
 */
export async function compressImage(imageFile: File, quality: number = 80) {
  await ensureWasmInitialized();

  // 读取文件为 ArrayBuffer
  const arrayBuffer = await imageFile.arrayBuffer();
  const imageData = new Uint8Array(arrayBuffer);

  // 压缩图片
  const result = await compressToWebp(Array.from(imageData), { quality });

  // 返回 Blob
  return new Blob([new Uint8Array(result.data)], { type: 'image/webp' });
}

/**
 * 转换图片格式
 */
export async function convertImage(
  imageFile: File,
  targetFormat: string,
  quality: number = 90,
) {
  await ensureWasmInitialized();

  const arrayBuffer = await imageFile.arrayBuffer();
  const imageData = new Uint8Array(arrayBuffer);

  const result = await convertImageFormat(Array.from(imageData), {
    targetFormat,
    quality,
  });

  const mimeType = `image/${targetFormat.toLowerCase()}`;
  return new Blob([new Uint8Array(result.data)], { type: mimeType });
}
```

#### 6.1.2 在 Web Worker 中使用（推荐）

```typescript
// apps/web/src/workers/imageWorker.ts
import { init, compressToWebp } from 'pixuli-wasm';

let initialized = false;

self.onmessage = async e => {
  const { type, payload } = e.data;

  // 初始化 WASM（只需要一次）
  if (!initialized) {
    await init();
    initialized = true;
  }

  try {
    switch (type) {
      case 'compress':
        const result = await compressToWebp(payload.imageData, payload.options);
        self.postMessage({ success: true, result });
        break;

      default:
        self.postMessage({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
```

```typescript
// apps/web/src/utils/imageProcessor.ts
export async function compressImageInWorker(
  imageData: Uint8Array,
  quality: number = 80,
) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/imageWorker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = e => {
      const { success, result, error } = e.data;
      if (success) {
        resolve(result);
      } else {
        reject(new Error(error));
      }
      worker.terminate();
    };

    worker.onerror = error => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage({
      type: 'compress',
      payload: {
        imageData: Array.from(imageData),
        options: { quality },
      },
    });
  });
}
```

### 6.2 PC 端使用（Electron）

#### 6.2.1 Electron 主进程使用

```typescript
// apps/desktop/electron/main/services/wasmService.ts
import { ipcMain } from 'electron';
import {
  init,
  compressToWebp,
  batchCompressToWebp,
  convertImageFormat,
} from 'pixuli-wasm';

// 初始化 WASM（只需要一次）
let wasmInitialized = false;

async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

export async function registerWasmHandlers() {
  // 确保 WASM 已初始化
  await ensureWasmInitialized();

  // WebP 压缩 IPC 处理器
  ipcMain.handle(
    'wasm:compress-to-webp',
    async (_, imageData: number[], options?: any) => {
      try {
        return await compressToWebp(imageData, options);
      } catch (error) {
        console.error('WebP compression error:', error);
        throw error;
      }
    },
  );

  // 批量 WebP 压缩 IPC 处理器
  ipcMain.handle(
    'wasm:batch-compress-to-webp',
    async (_, imagesData: number[][], options?: any) => {
      try {
        return await batchCompressToWebp(imagesData, options);
      } catch (error) {
        console.error('Batch WebP compression error:', error);
        throw error;
      }
    },
  );

  // 图片格式转换 IPC 处理器
  ipcMain.handle(
    'wasm:convert-image-format',
    async (_, imageData: number[], options: any) => {
      try {
        return await convertImageFormat(imageData, options);
      } catch (error) {
        console.error('Image format conversion error:', error);
        throw error;
      }
    },
  );

  // ... 其他处理器
}
```

#### 6.2.2 Electron 渲染进程使用

```typescript
// apps/desktop/src/renderer/utils/imageProcessor.ts
import { init, compressToWebp, convertImageFormat } from 'pixuli-wasm';

// 初始化 WASM（只需要一次）
let wasmInitialized = false;

async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

/**
 * 压缩图片（渲染进程）
 */
export async function compressImageInRenderer(
  imageData: Uint8Array,
  quality: number = 80,
) {
  await ensureWasmInitialized();
  return await compressToWebp(Array.from(imageData), { quality });
}

/**
 * 转换图片格式（渲染进程）
 */
export async function convertImageInRenderer(
  imageData: Uint8Array,
  targetFormat: string,
  quality: number = 90,
) {
  await ensureWasmInitialized();
  return await convertImageFormat(Array.from(imageData), {
    targetFormat,
    quality,
  });
}
```

#### 6.2.3 通过 IPC 调用（推荐方式）

```typescript
// apps/desktop/src/renderer/utils/imageProcessor.ts
import { ipcRenderer } from 'electron';

/**
 * 通过 IPC 调用主进程的 WASM 功能（推荐）
 */
export async function compressImageViaIPC(
  imageData: Uint8Array,
  quality: number = 80,
) {
  return await ipcRenderer.invoke(
    'wasm:compress-to-webp',
    Array.from(imageData),
    { quality },
  );
}
```

### 6.3 Mobile 端使用（React Native）

#### 6.3.0 React Native WASM 配置说明

**重要**：React Native 对 WASM 的支持需要特殊配置，因为：

1. React Native 的 Metro bundler 需要配置以支持 `.wasm` 文件
2. 可能需要 polyfill（如 `TextEncoder`/`TextDecoder`）
3. 需要使用 `--target bundler` 构建的版本

**构建 React Native 版本**：

```bash
cd packages/wasm
wasm-pack build --target bundler --out-dir pkg-mobile --release
```

**构建产物**：

- `pkg-mobile/pixuli_wasm.js` - JavaScript 绑定文件
- `pkg-mobile/pixuli_wasm_bg.wasm` - WASM 二进制文件
- `pkg-mobile/pixuli_wasm_bg.wasm.d.ts` - TypeScript 类型定义

#### 6.3.1 Metro Bundler 配置

**配置 `metro.config.js`**（React Native 0.60+）：

```javascript
// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加 WASM 文件支持
config.resolver.assetExts.push('wasm');

// 确保 sourceExts 包含 js 和 ts
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'ts', 'tsx'];

module.exports = config;
```

**或者使用标准 React Native**：

```javascript
// apps/mobile/metro.config.js
module.exports = {
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'json', 'wasm'], // 添加 wasm
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
```

#### 6.3.2 安装必要的 Polyfill

React Native 可能缺少一些 Web API，需要安装 polyfill：

```bash
cd apps/mobile
pnpm add text-encoding-polyfill
```

**在应用入口添加 polyfill**：

```typescript
// apps/mobile/index.js 或 App.tsx
import 'text-encoding-polyfill';

// 如果 TextEncoder/TextDecoder 不存在，添加 polyfill
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding-polyfill');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// 确保 WebAssembly 可用
if (typeof global.WebAssembly === 'undefined') {
  console.warn('WebAssembly is not supported in this environment');
}
```

#### 6.3.3 基础使用

```typescript
// apps/mobile/utils/imageProcessor.ts
import { init, compressToWebp, convertImageFormat } from 'pixuli-wasm';
import * as FileSystem from 'expo-file-system';

// 初始化 WASM（只需要一次）
let wasmInitialized = false;
let wasmInitPromise: Promise<void> | null = null;

async function ensureWasmInitialized() {
  if (wasmInitialized) {
    return;
  }

  if (wasmInitPromise) {
    await wasmInitPromise;
    return;
  }

  wasmInitPromise = (async () => {
    try {
      // 初始化 WASM 模块
      await init();
      wasmInitialized = true;
    } catch (error) {
      console.error('Failed to initialize WASM:', error);
      wasmInitPromise = null;
      throw error;
    }
  })();

  await wasmInitPromise;
}

/**
 * 压缩图片
 */
export async function compressImage(
  imageUri: string,
  quality: number = 80,
): Promise<string> {
  await ensureWasmInitialized();

  // 读取图片文件
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Base64 转 Uint8Array
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 压缩图片
  const result = await compressToWebp(Array.from(bytes), { quality });

  // 转换回 Base64
  const compressedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(result.data)),
  );

  // 保存压缩后的图片
  const compressedUri = `${FileSystem.cacheDirectory}compressed_${Date.now()}.webp`;
  await FileSystem.writeAsStringAsync(compressedUri, compressedBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return compressedUri;
}

/**
 * 转换图片格式
 */
export async function convertImage(
  imageUri: string,
  targetFormat: string,
  quality: number = 90,
): Promise<string> {
  await ensureWasmInitialized();

  // 读取图片
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Base64 转 Uint8Array
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 转换格式
  const result = await convertImageFormat(Array.from(bytes), {
    targetFormat,
    quality,
  });

  // 转换回 Base64
  const convertedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(result.data)),
  );

  // 保存转换后的图片
  const extension = targetFormat.toLowerCase();
  const convertedUri = `${FileSystem.cacheDirectory}converted_${Date.now()}.${extension}`;
  await FileSystem.writeAsStringAsync(convertedUri, convertedBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return convertedUri;
}
```

#### 6.3.2 在 React 组件中使用

```typescript
// apps/mobile/components/ImageCompressor.tsx
import React, { useState } from 'react';
import { View, Button, Image, ActivityIndicator } from 'react-native';
import { compressImage } from '../utils/imageProcessor';
import * as ImagePicker from 'expo-image-picker';

export function ImageCompressor() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [compressedUri, setCompressedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCompress = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      const compressed = await compressImage(imageUri, 80);
      setCompressedUri(compressed);
    } catch (error) {
      console.error('Compression error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="选择图片" onPress={pickImage} />
      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />
          <Button title="压缩图片" onPress={handleCompress} disabled={loading} />
          {loading && <ActivityIndicator />}
          {compressedUri && (
            <Image source={{ uri: compressedUri }} style={{ width: 200, height: 200 }} />
          )}
        </>
      )}
    </View>
  );
}
```

### 6.4 三端使用对比

| 特性         | Web 端                                | PC 端（Electron）       | Mobile 端（RN）                        |
| ------------ | ------------------------------------- | ----------------------- | -------------------------------------- |
| **初始化**   | `await init()`                        | `await init()`          | `await init()`                         |
| **数据格式** | `File` → `ArrayBuffer` → `Uint8Array` | `Buffer` → `Uint8Array` | `FileSystem` → `Base64` → `Uint8Array` |
| **推荐方式** | Web Worker                            | IPC（主进程）           | 直接调用                               |
| **异步处理** | Promise                               | Promise                 | Promise                                |
| **错误处理** | try/catch                             | try/catch               | try/catch                              |

---

## 7. 注意事项

### 7.1 性能考虑

1. **初始化开销**
   - WASM 首次加载需要初始化时间（约 50-200ms）
   - 建议在应用启动时预加载
   - 使用单例模式确保只初始化一次

2. **内存管理**
   - WASM 内存由 JavaScript 管理
   - 大图片处理时注意内存释放
   - 考虑使用 Web Worker 避免阻塞主线程

3. **性能优化**
   - 使用 `--release` 模式构建生产版本
   - 启用 LTO（Link Time Optimization）
   - 考虑使用 `wasm-opt` 进一步优化

### 7.2 兼容性

1. **浏览器支持**
   - Chrome 57+, Firefox 52+, Safari 11+, Edge 16+
   - 需要支持 WebAssembly 的现代浏览器
   - 所有现代浏览器都原生支持 WASM

2. **Node.js 支持** ✅
   - **Node.js v8.0.0+** 开始原生支持 WebAssembly
   - **推荐 Node.js v14+** 以获得更好的性能和稳定性
   - Node.js 提供全局 `WebAssembly` 对象
   - 支持 `wasm-pack --target nodejs` 构建的 WASM 模块
   - 可以直接使用 `import` 或 `require` 加载 WASM 模块

3. **Electron 支持** ✅
   - Electron 基于 Node.js，完全支持 WASM
   - 主进程和渲染进程都可以使用 WASM
   - 主进程使用 `--target nodejs`，渲染进程使用 `--target web`

4. **React Native 支持** ⚠️
   - **React Native 0.60+**（推荐 0.70+）
   - 使用 `--target bundler` 构建
   - **需要配置 Metro bundler** 以支持 `.wasm` 文件
   - **可能需要 polyfill**：
     - `text-encoding-polyfill`（TextEncoder/TextDecoder）
     - 确保 `WebAssembly` 全局对象可用
   - **Expo**：Expo SDK 45+ 对 WASM 有更好的支持
   - **注意事项**：
     - WASM 文件需要正确打包到应用中
     - 首次加载可能需要较长时间
     - 建议在应用启动时预加载 WASM 模块

### 7.3 依赖限制

1. **ONNX Runtime（AI 分析）**
   - 当前可能不支持 WASM
   - 需要条件编译或使用 WASM 版本的 ONNX Runtime
   - 或暂时禁用 AI 分析功能

2. **文件系统访问**
   - 浏览器环境无法直接访问文件系统
   - 需要通过 File API 或拖拽上传
   - React Native 使用 `expo-file-system` 或 `react-native-fs`

### 7.4 构建产物大小

- **WASM 文件**：约 500 KB - 2 MB（取决于功能）
- **JavaScript 绑定**：约 50-100 KB

**优化建议**：

- 使用代码分割，按需加载
- 压缩 WASM 文件（使用 `wasm-opt`）
- 考虑 CDN 分发 WASM 文件

### 7.5 调试建议

1. **开发环境**
   - 使用 `wasm-pack build --dev` 生成调试版本
   - 启用 source map

2. **错误处理**
   - WASM 错误会转换为 JavaScript Error
   - 添加详细的错误日志

3. **性能分析**
   - 使用浏览器 DevTools Performance 面板
   - 监控 WASM 内存使用

---

## 8. 总结

### 8.1 方案优势

✅ **统一构建**：只需 `wasm-pack` 一个工具✅
**代码简洁**：无需条件编译，代码更清晰✅ **跨平台**：一套代码，三端通用✅
**维护成本低**：只需维护一套构建配置✅ **性能足够**：WASM 性能对图片处理完全足够

### 8.2 迁移检查清单

- [ ] 修改 `Cargo.toml`，移除 NAPI 依赖，添加 `wasm-bindgen`
- [ ] 修改所有 Rust 文件，将 `#[napi]` 改为 `#[wasm_bindgen]`
- [ ] 更新类型签名（`Vec<u8>` → `&[u8]`，`NapiError` → `JsValue`）
- [ ] 删除 `build.rs` 文件
- [ ] 创建新的 `index.js` 统一入口
- [ ] 更新 `package.json`，移除 NAPI 配置
- [ ] 更新 TypeScript 类型定义
- [ ] 删除所有 `.node` 文件
- [ ] 更新构建脚本
- [ ] 更新 CI/CD 配置
- [ ] 测试三端功能

### 8.3 预计工作量

- **代码迁移**：1-2 周
- **构建配置**：3-5 天
- **测试验证**：1-2 周
- **文档更新**：2-3 天

**总计**：3-5 周

### 8.4 风险

- **低风险**：WASM 技术成熟，浏览器支持良好
- **性能影响**：WASM 性能约为原生 80-90%，对图片处理足够
- **兼容性**：需要现代浏览器和 Node.js 14+

---

## 附录

### A. 常用命令

```bash
# 安装 wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 构建所有平台
cd packages/wasm
pnpm run build:wasm

# 单独构建
pnpm run build:wasm:web      # Web 版本
pnpm run build:wasm:node     # Node.js 版本
pnpm run build:wasm:mobile   # React Native 版本

# 开发模式构建
pnpm run build:wasm:dev

# 优化 WASM 文件（可选）
wasm-opt pkg-web/pixuli_wasm_bg.wasm -o pkg-web/pixuli_wasm_bg.wasm -O3
```

### B. 参考资源

- [wasm-pack 文档](https://rustwasm.github.io/wasm-pack/)
- [wasm-bindgen 文档](https://rustwasm.github.io/wasm-bindgen/)
- [WebAssembly 规范](https://webassembly.org/)
- [Node.js WebAssembly 支持](https://nodejs.org/api/webassembly.html)
- [React Native WASM 支持](https://github.com/react-native-community/discussions-and-proposals/issues/353)

### C. Node.js WASM 使用示例

Node.js 原生支持 WASM，可以直接加载和运行：

```javascript
// Node.js 中使用 WASM（使用 wasm-pack --target nodejs 构建）
const wasmModule = await import('./pkg-node/pixuli_wasm.js');

// 初始化
await wasmModule.default();

// 使用功能
const result = wasmModule.compress_to_webp(imageData, options);
```

或者使用原生 WebAssembly API：

```javascript
// 使用原生 WebAssembly API
const fs = require('fs');
const wasmBuffer = fs.readFileSync('./pixuli_wasm.wasm');
const wasmModule = await WebAssembly.compile(wasmBuffer);
const instance = await WebAssembly.instantiate(wasmModule);
```

**推荐使用 wasm-pack 构建的版本**，因为它提供了更友好的 JavaScript 绑定。
