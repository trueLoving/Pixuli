#!/usr/bin/env python3
"""
Pixuli AI Package Setup Script (Python)
跨平台自动化安装和配置 pixuli-ai 包的环境
"""

import os
import sys
import subprocess
import platform
import argparse
import json
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any

class Colors:
    """终端颜色定义"""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

class SetupLogger:
    """日志记录器"""

    @staticmethod
    def info(message: str):
        print(f"{Colors.BLUE}ℹ️  {message}{Colors.NC}")

    @staticmethod
    def success(message: str):
        print(f"{Colors.GREEN}✅ {message}{Colors.NC}")

    @staticmethod
    def warning(message: str):
        print(f"{Colors.YELLOW}⚠️  {message}{Colors.NC}")

    @staticmethod
    def error(message: str):
        print(f"{Colors.RED}❌ {message}{Colors.NC}")

    @staticmethod
    def step(message: str):
        print(f"{Colors.PURPLE}🚀 {message}{Colors.NC}")

class PixuliAISetup:
    """Pixuli AI 包安装器"""

    def __init__(self):
        self.logger = SetupLogger()
        self.package_manager = None
        self.use_venv = False
        self.venv_path = None

    def print_banner(self):
        """打印横幅"""
        banner = f"""
{Colors.CYAN}
╔══════════════════════════════════════════════════════════════╗
║                    Pixuli AI Package Setup                   ║
║                                                              ║
║              自动化安装和配置 AI 分析包环境                    ║
╚══════════════════════════════════════════════════════════════╝
{Colors.NC}"""
        print(banner)

    def print_system_info(self):
        """显示系统信息"""
        self.logger.info("系统信息:")
        print(f"  操作系统: {platform.system()} {platform.machine()}")
        print(f"  Python: {sys.version}")
        print(f"  工作目录: {os.getcwd()}")
        print()

    def command_exists(self, command: str) -> bool:
        """检查命令是否存在"""
        return shutil.which(command) is not None

    def run_command(self, command: List[str], cwd: Optional[str] = None) -> subprocess.CompletedProcess:
        """运行命令"""
        try:
            return subprocess.run(
                command,
                cwd=cwd,
                capture_output=True,
                text=True,
                check=True
            )
        except subprocess.CalledProcessError as e:
            self.logger.error(f"命令执行失败: {' '.join(command)}")
            self.logger.error(f"错误信息: {e.stderr}")
            raise

    def check_python(self) -> bool:
        """检查 Python 环境"""
        self.logger.step("检查 Python 环境...")

        if sys.version_info < (3, 8):
            self.logger.error(f"Python 版本过低 ({sys.version_info.major}.{sys.version_info.minor})，需要 Python 3.8+")
            return False

        self.logger.success(f"Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro} 已安装")
        return True

    def check_pip(self) -> bool:
        """检查 pip"""
        self.logger.step("检查 pip...")

        try:
            import pip
            self.logger.success("pip 已安装")
            return True
        except ImportError:
            self.logger.error("pip 未安装，请先安装 pip")
            return False

    def check_nodejs(self) -> bool:
        """检查 Node.js 环境"""
        self.logger.step("检查 Node.js 环境...")

        if not self.command_exists("node"):
            self.logger.error("Node.js 未安装，请先安装 Node.js 16+")
            self.logger.info("安装指南:")
            if platform.system() == "Windows":
                self.logger.info("  访问: https://nodejs.org/")
                self.logger.info("  或使用: winget install OpenJS.NodeJS")
            elif platform.system() == "Darwin":
                self.logger.info("  brew install node")
            else:
                self.logger.info("  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -")
                self.logger.info("  sudo apt-get install -y nodejs")
            return False

        try:
            result = self.run_command(["node", "--version"])
            node_version = result.stdout.strip()
            self.logger.success(f"Node.js {node_version} 已安装")
            return True
        except subprocess.CalledProcessError:
            self.logger.error("无法获取 Node.js 版本")
            return False

    def check_package_manager(self) -> bool:
        """检查包管理器"""
        self.logger.step("检查包管理器...")

        if self.command_exists("pnpm"):
            self.package_manager = "pnpm"
            self.logger.success("pnpm 已安装")
            return True
        elif self.command_exists("npm"):
            self.package_manager = "npm"
            self.logger.success("npm 已安装")
            return True
        else:
            self.logger.error("未找到包管理器 (npm 或 pnpm)")
            return False

    def create_virtual_env(self) -> bool:
        """创建虚拟环境"""
        self.logger.info("创建 Python 虚拟环境...")

        try:
            self.venv_path = Path("venv")
            if self.venv_path.exists():
                shutil.rmtree(self.venv_path)

            self.run_command([sys.executable, "-m", "venv", str(self.venv_path)])

            # 激活虚拟环境
            if platform.system() == "Windows":
                activate_script = self.venv_path / "Scripts" / "activate.bat"
                python_exe = self.venv_path / "Scripts" / "python.exe"
            else:
                activate_script = self.venv_path / "bin" / "activate"
                python_exe = self.venv_path / "bin" / "python"

            if python_exe.exists():
                # 更新 Python 可执行文件路径
                sys.executable = str(python_exe)
                self.logger.success("虚拟环境已创建并激活")
                return True
            else:
                self.logger.error("虚拟环境创建失败")
                return False

        except subprocess.CalledProcessError as e:
            self.logger.error(f"创建虚拟环境失败: {e}")
            return False

    def install_python_deps(self) -> bool:
        """安装 Python 依赖"""
        self.logger.step("安装 Python 依赖...")

        requirements_file = Path("requirements.txt")
        if not requirements_file.exists():
            self.logger.error("requirements.txt 文件不存在")
            return False

        try:
            # 升级 pip
            self.logger.info("升级 pip...")
            self.run_command([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])

            # 安装依赖
            self.logger.info("安装 Python 依赖包...")
            self.run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

            self.logger.success("Python 依赖安装完成")
            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"Python 依赖安装失败: {e}")
            return False

    def install_nodejs_deps(self) -> bool:
        """安装 Node.js 依赖"""
        self.logger.step("安装 Node.js 依赖...")

        package_json = Path("package.json")
        if not package_json.exists():
            self.logger.error("package.json 文件不存在")
            return False

        try:
            self.logger.info(f"使用 {self.package_manager} 安装依赖...")
            self.run_command([self.package_manager, "install"])

            self.logger.success("Node.js 依赖安装完成")
            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"Node.js 依赖安装失败: {e}")
            return False

    def build_binary(self) -> bool:
        """构建二进制文件"""
        self.logger.step("构建 AI 分析器二进制文件...")

        scripts_dir = Path("scripts")
        if not scripts_dir.exists():
            self.logger.error("scripts 目录不存在")
            return False

        try:
            # 检查构建脚本
            if platform.system() == "Windows":
                build_script = scripts_dir / "build_qwen.bat"
                if build_script.exists():
                    self.logger.info("开始构建...")
                    self.run_command([str(build_script)])
                else:
                    # 使用 Python 脚本
                    build_script = scripts_dir / "build_qwen_analyzer.py"
                    if build_script.exists():
                        self.logger.info("使用 Python 构建脚本...")
                        self.run_command([sys.executable, str(build_script)])
                    else:
                        self.logger.error("构建脚本不存在")
                        return False
            else:
                build_script = scripts_dir / "build_qwen.sh"
                if build_script.exists():
                    # 确保脚本有执行权限
                    os.chmod(build_script, 0o755)
                    self.logger.info("开始构建...")
                    self.run_command(["bash", str(build_script)])
                else:
                    self.logger.error("构建脚本不存在")
                    return False

            self.logger.success("二进制文件构建完成")
            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"构建失败: {e}")
            return False

    def run_tests(self) -> bool:
        """运行测试"""
        self.logger.step("运行测试...")

        test_script = Path("scripts") / "test_qwen.py"
        if not test_script.exists():
            self.logger.warning("测试文件不存在，跳过测试")
            return True

        try:
            self.logger.info("运行 Python 测试...")
            self.run_command([sys.executable, str(test_script)])
            self.logger.success("测试完成")
            return True

        except subprocess.CalledProcessError as e:
            self.logger.error(f"测试失败: {e}")
            return False

    def clean_build(self) -> bool:
        """清理构建文件"""
        self.logger.step("清理构建文件...")

        try:
            # 清理 dist 目录
            dist_dir = Path("dist")
            if dist_dir.exists():
                shutil.rmtree(dist_dir)
                self.logger.success("dist 目录已清理")

            # 清理 resources/bin 目录
            resources_bin = Path("resources") / "bin"
            if resources_bin.exists():
                shutil.rmtree(resources_bin)
                self.logger.success("resources/bin 目录已清理")

            # 清理 Python 缓存
            for pycache in Path(".").rglob("__pycache__"):
                shutil.rmtree(pycache)

            for pyc_file in Path(".").rglob("*.pyc"):
                pyc_file.unlink()

            self.logger.success("构建文件清理完成")
            return True

        except Exception as e:
            self.logger.error(f"清理失败: {e}")
            return False

    def show_completion_message(self):
        """显示完成信息"""
        print()
        self.logger.success("🎉 Pixuli AI 包安装完成！")
        print()
        self.logger.info("下一步操作：")
        print("  1. 将构建的二进制文件复制到 Electron 应用的 resources/bin/ 目录")
        print("  2. 在 Electron 应用中配置模型路径")
        print("  3. 开始使用 AI 图像分析功能")
        print()
        self.logger.info("有用的命令：")
        print("  npm run build:all    # 重新构建所有内容")
        print("  npm run test         # 运行测试")
        print("  npm run clean        # 清理构建文件")
        print()

        if self.use_venv:
            self.logger.info("注意：虚拟环境已激活，退出时请运行 'deactivate'")

    def setup(self, args) -> bool:
        """主安装流程"""
        self.print_banner()
        self.print_system_info()

        # 仅清理模式
        if args.clean_only:
            return self.clean_build()

        # 仅测试模式
        if args.test_only:
            return self.run_tests()

        # 仅构建模式
        if args.build_only:
            return self.build_binary()

        # 环境检查
        if not self.check_python():
            return False

        if not self.check_pip():
            return False

        if not self.check_nodejs():
            return False

        if not self.check_package_manager():
            return False

        # 安装依赖
        if args.force:
            self.logger.info("强制重新安装依赖...")
            self.clean_build()

        # 创建虚拟环境（如果需要）
        if args.venv:
            self.use_venv = True
            if not self.create_virtual_env():
                return False

        # 安装 Python 依赖
        if not self.install_python_deps():
            return False

        # 安装 Node.js 依赖
        if not self.install_nodejs_deps():
            return False

        # 构建二进制文件
        if not args.no_build:
            if not self.build_binary():
                return False
        else:
            self.logger.warning("跳过构建步骤")

        # 运行测试
        if not args.no_test:
            if not self.run_tests():
                return False
        else:
            self.logger.warning("跳过测试步骤")

        # 显示完成信息
        self.show_completion_message()
        return True

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="Pixuli AI Package Setup Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python setup.py                      # 完整安装和构建
  python setup.py --clean               # 清理构建文件
  python setup.py --build-only          # 仅构建二进制文件
  python setup.py --venv                # 使用虚拟环境安装
        """
    )

    parser.add_argument("--clean", action="store_true", dest="clean_only", help="清理构建文件")
    parser.add_argument("--build-only", action="store_true", help="仅构建二进制文件")
    parser.add_argument("--test-only", action="store_true", help="仅运行测试")
    parser.add_argument("--no-build", action="store_true", help="跳过构建步骤")
    parser.add_argument("--no-test", action="store_true", help="跳过测试步骤")
    parser.add_argument("--venv", action="store_true", help="使用 Python 虚拟环境")
    parser.add_argument("--force", action="store_true", help="强制重新安装依赖")

    args = parser.parse_args()

    setup = PixuliAISetup()

    try:
        success = setup.setup(args)
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        SetupLogger().error("安装被中断")
        sys.exit(1)
    except Exception as e:
        SetupLogger().error(f"安装过程中发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
