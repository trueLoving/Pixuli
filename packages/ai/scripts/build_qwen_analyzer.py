#!/usr/bin/env python3
"""
PyInstaller 打包脚本
将 qwen_analyzer.py 打包成独立的二进制文件
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def get_platform_suffix():
    """获取平台特定的文件后缀"""
    system = platform.system().lower()
    if system == "windows":
        return ".exe"
    elif system == "darwin":  # macOS
        return ""
    else:  # Linux
        return ""

def create_spec_file():
    """创建PyInstaller spec文件"""
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['../src/qwen_analyzer.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'torch',
        'transformers',
        'PIL',
        'PIL.Image',
        'numpy',
        'sklearn',
        'sklearn.cluster',
        'sklearn.cluster._kmeans',
        'transformers.models.qwen2_vl',
        'transformers.models.qwen2_vl.modeling_qwen2_vl',
        'transformers.models.qwen2_vl.tokenization_qwen2_vl',
        'transformers.models.qwen2_vl.processing_qwen2_vl',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'jupyter',
        'notebook',
        'IPython',
        'pandas',
        'scipy',
        'sympy',
        'numba',
        'cupy',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='qwen_analyzer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''

    with open('qwen_analyzer.spec', 'w', encoding='utf-8') as f:
        f.write(spec_content)

    print("✅ Created qwen_analyzer.spec file")

def install_pyinstaller():
    """安装PyInstaller"""
    try:
        import PyInstaller
        print("✅ PyInstaller already installed")
        return True
    except ImportError:
        print("📦 Installing PyInstaller...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
            print("✅ PyInstaller installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install PyInstaller: {e}")
            return False

def build_executable():
    """构建可执行文件"""
    print("🔨 Building executable...")

    try:
        # 使用spec文件构建
        cmd = [sys.executable, '-m', 'PyInstaller', '--clean', 'qwen_analyzer.spec']
        subprocess.check_call(cmd)

        # 检查输出文件
        platform_suffix = get_platform_suffix()
        exe_path = Path('../dist') / f'qwen_analyzer{platform_suffix}'

        if exe_path.exists():
            print(f"✅ Executable built successfully: {exe_path}")
            print(f"📁 File size: {exe_path.stat().st_size / (1024*1024):.1f} MB")
            return str(exe_path)
        else:
            print("❌ Executable not found after build")
            return None

    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        return None

def create_requirements():
    """创建requirements.txt文件"""
    requirements = [
        "torch>=2.0.0",
        "transformers>=4.35.0",
        "Pillow>=9.0.0",
        "numpy>=1.21.0",
        "scikit-learn>=1.0.0",
        "pyinstaller>=5.0.0",
    ]

    with open('requirements.txt', 'w') as f:
        f.write('\n'.join(requirements))

    print("✅ Created requirements.txt")

def main():
    """主函数"""
    print("🚀 Starting Qwen Analyzer packaging process...")
    print(f"📋 Platform: {platform.system()} {platform.machine()}")

    # 检查源码文件
    src_path = Path('../src/qwen_analyzer.py')
    if not src_path.exists():
        print(f"❌ qwen_analyzer.py not found at {src_path.absolute()}")
        sys.exit(1)

    # 创建requirements.txt
    create_requirements()

    # 安装PyInstaller
    if not install_pyinstaller():
        sys.exit(1)

    # 创建spec文件
    create_spec_file()

    # 构建可执行文件
    exe_path = build_executable()

    if exe_path:
        print(f"\n🎉 Packaging completed successfully!")
        print(f"📦 Executable: {exe_path}")
        print(f"📋 Platform: {platform.system()}")
        print(f"💡 You can now copy this executable to your Electron app")

        # 创建部署说明
        deploy_instructions = f"""
# 部署说明

## 构建的可执行文件
- 文件路径: {exe_path}
- 平台: {platform.system()} {platform.machine()}
- 大小: {Path(exe_path).stat().st_size / (1024*1024):.1f} MB

## 部署到Electron应用
1. 将可执行文件复制到 Electron 应用的 resources 目录
2. 在 Electron 主进程中调用该可执行文件
3. 确保可执行文件有执行权限

## 使用方法
```bash
./qwen_analyzer --model-path /path/to/model --image-path /path/to/image
```

## 注意事项
- 确保目标机器有足够的RAM来运行模型
- GPU版本需要CUDA支持
- 首次运行可能需要下载模型文件
"""

        with open('../DEPLOY_INSTRUCTIONS.md', 'w', encoding='utf-8') as f:
            f.write(deploy_instructions)

        print("📄 Created DEPLOY_INSTRUCTIONS.md")

    else:
        print("❌ Packaging failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
