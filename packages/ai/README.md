# pixuli-ai

AI analysis package for Pixuli desktop application, providing Qwen LLM image
analysis capabilities.

https://huggingface.co/unsloth/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf

## Features

- ✅ **Zero-dependency execution**: No need to install Python environment or
  dependencies
- ✅ **Pre-packaged binary**: All dependencies bundled into a single executable
- ✅ **Qwen multimodal support**: Image understanding and analysis
- ✅ **Model path configuration**: Manual Qwen model path configuration
- ✅ **Device selection**: CPU and GPU (CUDA) acceleration support
- ✅ **Parameter tuning**: Adjustable generation temperature and max tokens
- ✅ **Cross-platform support**: Windows, macOS, Linux

## Installation

### 快速安装（推荐）

使用自动化安装脚本：

```bash
# 完整安装和构建
npm run setup

# 使用 Python 脚本（跨平台）
npm run setup:python

# 使用虚拟环境
npm run setup:venv
```

### 手动安装

```bash
# Install dependencies
npm install

# Build the binary
npm run build:all
```

### 安装选项

| 命令                   | 描述             |
| ---------------------- | ---------------- |
| `npm run setup`        | 完整安装和构建   |
| `npm run setup:python` | 使用 Python 脚本 |
| `npm run setup:venv`   | 使用虚拟环境     |
| `npm run setup:clean`  | 清理构建文件     |
| `npm run setup:build`  | 仅构建二进制文件 |
| `npm run setup:test`   | 仅运行测试       |

详细说明请参考 [SETUP.md](./SETUP.md)。

## Usage

### Building the Binary

```bash
# Build for current platform
npm run build

# Build with full setup
npm run build:all

# Clean build artifacts
npm run clean
```

### Development

```bash
# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
packages/ai/
├── src/
│   ├── qwen_analyzer.py      # Python analysis script
│   └── index.ts              # TypeScript interfaces
├── scripts/
│   ├── build_qwen_analyzer.py # PyInstaller packaging script
│   └── build_qwen.sh         # Build script
├── dist/                     # Built binaries
├── resources/
│   └── bin/                  # Deployed binaries
├── requirements.txt          # Python dependencies
├── package.json
└── README.md
```

## Electron Integration

### Communication Architecture

The pixuli-ai package communicates with the Electron application through a
binary executable interface:

```
┌─────────────────┐    IPC     ┌─────────────────┐    spawn    ┌─────────────────┐
│   Renderer      │ ──────────► │   Main Process  │ ──────────► │  qwen_analyzer  │
│   (React UI)    │             │   (Node.js)     │             │   (Binary)       │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

### Communication Flow

1. **UI Request**: User uploads image and triggers analysis in React UI
2. **IPC Call**: Renderer process calls `window.aiAPI.analyzeImageWithQwen()`
3. **Main Process**: Electron main process receives IPC request
4. **Binary Execution**: Main process spawns `qwen_analyzer` binary with
   parameters
5. **Analysis**: Binary processes image using Qwen model
6. **Response**: Binary returns JSON result via stdout
7. **IPC Response**: Main process sends result back to renderer
8. **UI Update**: React UI displays analysis results

### Binary Interface

The `qwen_analyzer` binary accepts the following command-line arguments:

```bash
qwen_analyzer --model-path <path> --image-path <path> [options]
```

**Required Arguments:**

- `--model-path`: Path to Qwen model directory
- `--image-path`: Path to image file to analyze

**Optional Arguments:**

- `--device`: Compute device (`cpu` or `cuda`, default: `cpu`)
- `--max-tokens`: Maximum tokens to generate (default: 512)
- `--temperature`: Generation temperature (default: 0.7)

**Output Format:** The binary outputs JSON to stdout with the following
structure:

```json
{
  "success": true,
  "imageType": "JPEG",
  "tags": ["风景", "自然"],
  "description": "这是一张美丽的自然风景图片...",
  "confidence": 0.95,
  "objects": [
    {
      "name": "山",
      "confidence": 0.9,
      "bbox": { "x": 0, "y": 0, "width": 100, "height": 100 },
      "category": "自然"
    }
  ],
  "colors": [
    {
      "name": "绿色",
      "rgb": [0, 128, 0],
      "hex": "#008000",
      "percentage": 0.4
    }
  ],
  "sceneType": "自然风景",
  "analysisTime": 1500,
  "modelUsed": "Qwen2-VL"
}
```

### Error Handling

The binary handles errors gracefully and returns structured error responses:

```json
{
  "success": false,
  "error": "Model path does not exist: /invalid/path"
}
```

### File Path Resolution

**Development Environment:**

- Binary path: `packages/ai/resources/bin/qwen_analyzer`
- Model files: User-specified paths

**Production Environment:**

- Binary path: `resources/bin/qwen_analyzer` (packaged with app)
- Model files: User-specified paths

### Security Considerations

1. **Input Validation**: All file paths are validated before processing
2. **Sandboxing**: Binary runs in isolated process with limited permissions
3. **Resource Limits**: Memory and CPU usage are monitored
4. **Temporary Files**: Image files are cleaned up after processing

### Performance Optimization

1. **Model Caching**: Models are loaded once and reused for multiple analyses
2. **GPU Acceleration**: Automatic CUDA detection and fallback to CPU
3. **Memory Management**: Efficient memory usage with proper cleanup
4. **Concurrent Processing**: Support for multiple analysis requests

## API

### Types

- `AIModelConfig`: Model configuration interface
- `ImageAnalysisRequest`: Image analysis request interface
- `ImageAnalysisResponse`: Image analysis response interface
- `AIAPI`: Main API interface

### Methods

- `analyzeImageWithQwen()`: Analyze image with Qwen LLM
- `getModels()`: Get available models
- `addModel()`: Add new model configuration
- `removeModel()`: Remove model configuration
- `updateModel()`: Update model configuration
- `checkModel()`: Check model availability
- `selectModelFile()`: Select model file/directory
- `checkQwenAnalyzer()`: Check analyzer binary availability

## Configuration

### Model Configuration

```typescript
const modelConfig: AIModelConfig = {
  id: 'qwen-2b',
  name: 'Qwen2-VL-2B',
  type: 'qwen-llm',
  enabled: true,
  description: 'Lightweight Qwen model',
  modelPath: '/path/to/qwen/model',
  device: 'auto',
  maxTokens: 512,
  temperature: 0.7,
};
```

### Analysis Request

```typescript
const request: ImageAnalysisRequest = {
  imageData: imageBuffer,
  modelId: 'qwen-2b',
  config: {
    useGpu: true,
    confidenceThreshold: 0.8,
  },
};
```

## Binary Deployment

The built binary should be placed in the Electron app's resources directory:

```
apps/desktop/resources/bin/
└── qwen_analyzer          # macOS/Linux
└── qwen_analyzer.exe      # Windows
```

## Requirements

- Python 3.8+ (for building only)
- Node.js 16+
- PyInstaller (installed automatically)
- PyTorch, transformers, PIL, numpy, scikit-learn (bundled in binary)

## Supported Platforms

- **Windows**: x64
- **macOS**: Intel/ARM (Universal)
- **Linux**: x64/ARM64

## Troubleshooting

### Build Issues

1. Ensure Python 3.8+ is installed
2. Check that pip3 is available
3. Verify all dependencies can be installed
4. Check available disk space (build requires ~2GB)

### Runtime Issues

1. Verify binary has execute permissions
2. Check model path is correct and accessible
3. Ensure sufficient RAM (16GB+ recommended)
4. For GPU acceleration, verify CUDA installation

### Common Error Messages

- `Model path does not exist`: Check model directory path
- `Model directory is empty`: Ensure model files are downloaded
- `CUDA not available`: Install CUDA drivers or use CPU mode
- `Insufficient memory`: Reduce model size or increase system RAM

## License

MIT License - see LICENSE file for details.
