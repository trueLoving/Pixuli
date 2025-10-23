# Pixuli AI Package Setup 指南

本文档介绍如何使用 Pixuli AI 包的自动化安装脚本。

## 概述

Pixuli
AI 包提供了三个跨平台的安装脚本，用于自动化环境配置、依赖安装和二进制文件构建：

- **`setup.sh`** - Unix/Linux/macOS 脚本
- **`setup.bat`** - Windows 批处理脚本
- **`setup.py`** - Python 跨平台脚本

## 快速开始

### 方法一：使用 npm 脚本（推荐）

```bash
# 完整安装和构建
npm run setup

# 使用 Python 脚本
npm run setup:python

# 使用虚拟环境
npm run setup:venv
```

### 方法二：直接运行脚本

#### Unix/Linux/macOS

```bash
# 完整安装
bash setup.sh

# 仅构建
bash setup.sh --build-only

# 使用虚拟环境
bash setup.sh --venv
```

#### Windows

```cmd
# 完整安装
setup.bat

# 仅构建
setup.bat --build-only

# 使用虚拟环境
setup.bat --venv
```

#### Python（跨平台）

```bash
# 完整安装
python3 setup.py

# 仅构建
python3 setup.py --build-only

# 使用虚拟环境
python3 setup.py --venv
```

## 脚本选项

所有脚本都支持以下选项：

| 选项           | 描述                 |
| -------------- | -------------------- |
| `--help`, `-h` | 显示帮助信息         |
| `--clean`      | 清理构建文件         |
| `--build-only` | 仅构建二进制文件     |
| `--test-only`  | 仅运行测试           |
| `--no-build`   | 跳过构建步骤         |
| `--no-test`    | 跳过测试步骤         |
| `--venv`       | 使用 Python 虚拟环境 |
| `--force`      | 强制重新安装依赖     |

## 环境要求

### 必需环境

- **Python 3.8+** - 用于运行 AI 分析脚本
- **Node.js 16+** - 用于 TypeScript 编译和包管理
- **pip** - Python 包管理器

### 可选环境

- **pnpm** - 更快的包管理器（推荐）
- **CUDA** - GPU 加速支持

## 安装流程

脚本会自动执行以下步骤：

1. **环境检查** - 验证 Python、Node.js 和包管理器
2. **依赖安装** - 安装 Python 和 Node.js 依赖
3. **二进制构建** - 使用 PyInstaller 构建独立可执行文件
4. **测试验证** - 运行测试确保功能正常
5. **部署准备** - 将二进制文件复制到部署目录

## 详细使用说明

### 完整安装

```bash
# 使用默认设置
npm run setup

# 或直接运行脚本
bash setup.sh
python3 setup.py
setup.bat
```

这将：

- 检查所有必需的环境
- 安装 Python 依赖（torch, transformers, PIL 等）
- 安装 Node.js 依赖
- 构建 `qwen_analyzer` 二进制文件
- 运行测试验证功能
- 将二进制文件复制到 `resources/bin/` 目录

### 使用虚拟环境

```bash
# 创建独立的 Python 环境
npm run setup:venv

# 或
bash setup.sh --venv
python3 setup.py --venv
```

虚拟环境的好处：

- 避免与系统 Python 环境冲突
- 确保依赖版本一致性
- 便于环境隔离和管理

### 仅构建二进制文件

```bash
# 跳过依赖安装，仅构建
npm run setup:build

# 或
bash setup.sh --build-only
python3 setup.py --build-only
```

适用于：

- 依赖已安装的情况
- 仅需要重新构建二进制文件
- CI/CD 环境中的增量构建

### 清理构建文件

```bash
# 清理所有构建产物
npm run setup:clean

# 或
bash setup.sh --clean
python3 setup.py --clean
```

清理内容：

- `dist/` 目录
- `resources/bin/` 目录
- Python 缓存文件（`__pycache__`, `*.pyc`）

### 仅运行测试

```bash
# 跳过安装和构建，仅测试
npm run setup:test

# 或
bash setup.sh --test-only
python3 setup.py --test-only
```

## 故障排除

### 常见问题

#### 1. Python 版本过低

```
❌ Python 版本过低 (3.7.9)，需要 Python 3.8+
```

**解决方案：**

- macOS: `brew install python3`
- Ubuntu/Debian: `sudo apt install python3.8`
- Windows: 从 [python.org](https://python.org) 下载安装

#### 2. pip 未安装

```
❌ pip 未安装，请先安装 pip
```

**解决方案：**

```bash
python3 -m ensurepip --upgrade
# 或
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
```

#### 3. Node.js 版本过低

```
❌ Node.js 版本过低 (v14.21.3)，需要 Node.js 16+
```

**解决方案：**

- macOS: `brew install node`
- Ubuntu/Debian:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- Windows: 从 [nodejs.org](https://nodejs.org) 下载安装

#### 4. 构建失败

```
❌ Build failed - binary not found
```

**可能原因：**

- PyInstaller 安装失败
- 依赖包版本冲突
- 磁盘空间不足
- 权限问题

**解决方案：**

```bash
# 强制重新安装
npm run setup -- --force

# 使用虚拟环境
npm run setup:venv

# 检查磁盘空间
df -h  # Unix/Linux/macOS
dir    # Windows
```

#### 5. 测试失败

```
❌ 测试失败: ModuleNotFoundError: No module named 'torch'
```

**解决方案：**

```bash
# 重新安装依赖
pip3 install -r requirements.txt

# 或使用虚拟环境
python3 setup.py --venv
```

### 调试模式

启用详细输出：

```bash
# Bash 脚本
bash -x setup.sh

# Python 脚本
python3 -v setup.py

# Windows 批处理
setup.bat /v
```

### 手动安装

如果自动脚本失败，可以手动执行步骤：

```bash
# 1. 安装 Python 依赖
pip3 install -r requirements.txt

# 2. 安装 Node.js 依赖
npm install

# 3. 构建二进制文件
python3 scripts/build_qwen_analyzer.py

# 4. 运行测试
python3 scripts/test_qwen.py
```

## 高级配置

### 自定义 Python 路径

```bash
# 使用特定 Python 版本
PYTHON=/usr/bin/python3.9 bash setup.sh
```

### 自定义包管理器

```bash
# 强制使用 npm
PACKAGE_MANAGER=npm bash setup.sh

# 强制使用 pnpm
PACKAGE_MANAGER=pnpm bash setup.sh
```

### 环境变量

| 变量              | 描述                   | 默认值          |
| ----------------- | ---------------------- | --------------- |
| `PYTHON`          | Python 可执行文件路径  | `python3`       |
| `PIP`             | pip 可执行文件路径     | `pip3`          |
| `NODE`            | Node.js 可执行文件路径 | `node`          |
| `PACKAGE_MANAGER` | 包管理器               | `pnpm` 或 `npm` |

## 输出文件

安装完成后，以下文件将被创建：

```
packages/ai/
├── dist/
│   └── qwen_analyzer          # 构建的二进制文件
├── resources/
│   └── bin/
│       └── qwen_analyzer      # 部署用的二进制文件
├── venv/                      # 虚拟环境（如果使用 --venv）
└── DEPLOY_INSTRUCTIONS.md     # 部署说明
```

## 集成到 Electron 应用

构建完成后，将二进制文件复制到 Electron 应用：

```bash
# 复制到 Electron 应用
cp resources/bin/qwen_analyzer ../../apps/desktop/resources/bin/

# Windows
copy resources\bin\qwen_analyzer.exe ..\..\apps\desktop\resources\bin\
```

## 性能优化

### 使用 GPU 加速

确保系统安装了 CUDA：

```bash
# 检查 CUDA 版本
nvidia-smi

# 安装 CUDA 版本的 PyTorch
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 内存优化

对于内存受限的系统：

```bash
# 使用较小的模型
export MODEL_SIZE=2B

# 限制并发处理
export MAX_WORKERS=1
```

## 支持

如果遇到问题：

1. 查看本文档的故障排除部分
2. 检查 [GitHub Issues](https://github.com/your-repo/issues)
3. 提交新的 Issue 并提供：
   - 操作系统和版本
   - Python 和 Node.js 版本
   - 完整的错误日志
   - 重现步骤

## 更新日志

### v1.0.0

- 初始版本
- 支持 Unix/Linux/macOS/Windows
- 自动化环境检查和依赖安装
- PyInstaller 二进制构建
- 虚拟环境支持
- 完整的测试套件
