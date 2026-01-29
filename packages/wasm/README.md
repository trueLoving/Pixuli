# Pixuli WASM

Pixuli's WebAssembly core library, providing high-performance image processing
capabilities. Supports multiple platforms including Web and Node.js.

## Features

### 🌐 Multi-Platform Support

- **Web**: Browser environment, using ES6 modules ✅
- **Node.js**: Node.js and Electron main process, using CommonJS ✅

### 🖼️ Image Processing Features (In Development)

- **Image Format Conversion**: Supports format conversion for JPEG, PNG, GIF,
  BMP, TIFF, etc.
- **Image Compression**: WebP compression functionality (temporarily disabled,
  awaiting pure Rust implementation)
- **Image Analysis**: AI image analysis functionality
- **Batch Processing**: Supports batch processing of multiple images

### 🧪 Test Functions

- **plus_100**: Simple test function for verifying WASM module loading

## Technical Architecture

### Core Technology Stack

- **Rust**: Primary development language
- **wasm-bindgen**: WebAssembly binding generation tool
- **wasm-pack**: WASM build and packaging tool
- **image-rs**: Image processing core library
- **serde**: Serialization support

### Build System

- **Cargo**: Rust package manager
- **wasm-pack**: Cross-platform WASM build tool
- **Multi-target Build**: Supports web, nodejs, and bundler targets

## Installation and Usage

### Development Environment Requirements

- Rust 1.70+
- Node.js 14+
- wasm-pack (install via `cargo install wasm-pack`)

### Build Commands

```bash
# Build all platform versions (production)
pnpm run build:wasm

# Build all platform versions (development)
pnpm run build:wasm:dev

# Build platform versions separately
pnpm run build:wasm:web      # Web version
pnpm run build:wasm:node     # Node.js version
```

### Usage Examples

#### Web

```javascript
import { init, plus100 } from 'pixuli-wasm';

// Initialize WASM module
await init();

// Use functionality
const result = await plus100(50);
console.log(result); // 150
```

#### Node.js / Electron

```javascript
const { init, plus100 } = require('pixuli-wasm');

// Initialize WASM module
await init();

// Use functionality
const result = await plus100(50);
console.log(result); // 150
```

## Project Structure

```
packages/wasm/
├── src/                    # Rust source code
│   ├── lib.rs             # Main entry file
│   ├── image.rs           # Image information retrieval
│   ├── compress/          # Compression module
│   ├── convert/           # Format conversion module
│   └── analyze/           # AI analysis module
├── pkg-web/               # Web version build artifacts
├── pkg-node/              # Node.js version build artifacts
├── index.js               # ES6 module entry (Web)
├── index.cjs              # CommonJS entry (Node.js)
└── index.d.ts             # TypeScript type definitions
```

## Current Status

### ✅ Completed

- [x] WASM multi-platform build configuration (web, nodejs, bundler)
- [x] Unified entry module (automatic environment detection)
- [x] ES6 and CommonJS dual module support
- [x] plus_100 test function
- [x] TypeScript type definitions
- [x] Web WASM support
- [x] Node.js WASM support

### 🚧 In Development

- [ ] Image format conversion functionality (code implemented, pending
      activation)
- [ ] Image information retrieval functionality (code implemented, pending
      activation)
- [ ] AI image analysis functionality (code implemented, pending activation)

### ⚠️ Known Issues

- **WebP compression temporarily disabled**: The `webp` crate depends on C code
  and cannot compile for WASM targets. Need to find a pure Rust WebP library or
  use an alternative solution.

## Development Guide

### Adding New Features

1. Write Rust code in the `src/` directory
2. Use `#[wasm_bindgen]` macro to export functions
3. Add corresponding exports in `index.js` and `index.cjs`
4. Update `index.d.ts` type definitions
5. Run `pnpm run build:wasm` to rebuild

### Testing

```bash
# Run Rust unit tests
cargo test

# Run JavaScript tests (if configured)
pnpm run test
```

### Debugging

- Web: Use browser developer tools
- Node.js: Use Node.js debugger

## Performance Characteristics

- **Cross-platform**: Same codebase supports Web and Node.js
- **High Performance**: Rust compiled to WASM, performance close to native
- **Small Size**: WASM binary files are optimized for small size
- **Type Safety**: Complete TypeScript type definitions

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

---

**Pixuli WASM** - Making image processing simpler, faster, and smarter 🚀
