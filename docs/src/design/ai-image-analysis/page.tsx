import PageLayout from '../../components/PageLayout';

export default function AIImageAnalysisPage() {
  return (
    <PageLayout
      title="AI 图片分析逻辑设计"
      subtitle="完整的 AI 图片分析功能设计文档，涵盖模型选择、下载、配置和使用方式"
      icon="fas fa-brain"
    >
      <div className="content-card">
        <h1>🤖 AI 图片分析逻辑设计</h1>

        <p>
          本文档详细描述了 Pixuli 应用中 AI
          图片分析功能的完整设计，包括模型推荐、下载方式、Ollama 与 Shimmy
          对比、本地模型使用以及集成方式。
        </p>

        <hr />

        <h2>📋 目录</h2>
        <ul>
          <li>
            <a href="#overview">概述</a>
          </li>
          <li>
            <a href="#model-recommendations">模型推荐</a>
          </li>
          <li>
            <a href="#model-download">模型下载</a>
          </li>
          <li>
            <a href="#ollama-vs-shimmy">Ollama vs Shimmy 对比</a>
          </li>
          <li>
            <a href="#local-models">使用本地模型</a>
          </li>
          <li>
            <a href="#integration">集成方式</a>
          </li>
          <li>
            <a href="#best-practices">最佳实践</a>
          </li>
        </ul>

        <hr />

        <h2 id="overview">🎯 概述</h2>

        <p>Pixuli 的 AI 图片分析功能支持多种方式，包括：</p>

        <ul>
          <li>
            <strong>Ollama</strong>：完整的本地大模型管理平台和 API 服务
          </li>
          <li>
            <strong>Shimmy</strong>：轻量级 CLI 工具，用于图片分析
          </li>
          <li>
            <strong>WASM</strong>：基于 Rust 的基础分析功能
          </li>
        </ul>

        <h3>系统要求</h3>
        <ul>
          <li>
            <strong>内存</strong>：16GB（推荐）
          </li>
          <li>
            <strong>CPU</strong>：Intel Core i7 或同等性能
          </li>
          <li>
            <strong>存储</strong>：根据模型大小，通常需要 5-30GB
          </li>
        </ul>

        <hr />

        <h2 id="model-recommendations">📊 模型推荐</h2>

        <h3>轻量级模型（适合 16GB 内存）</h3>

        <h4>1. Qwen2-VL-2B ⭐⭐⭐⭐⭐</h4>
        <ul>
          <li>
            <strong>参数量</strong>：2B
          </li>
          <li>
            <strong>内存需求</strong>：~4GB
          </li>
          <li>
            <strong>下载大小</strong>：约 4-5GB
          </li>
          <li>
            <strong>特点</strong>：中文支持优秀，性能优秀，推理速度快
          </li>
          <li>
            <strong>Hugging Face</strong>：
            <a
              href="https://huggingface.co/Qwen/Qwen2-VL-2B-Instruct"
              target="_blank"
              rel="noopener noreferrer"
            >
              Qwen/Qwen2-VL-2B-Instruct
            </a>
          </li>
        </ul>

        <h4>2. MiniCPM-V-2 ⭐⭐⭐⭐</h4>
        <ul>
          <li>
            <strong>参数量</strong>：2.4B
          </li>
          <li>
            <strong>内存需求</strong>：~3-5GB
          </li>
          <li>
            <strong>下载大小</strong>：约 5GB
          </li>
          <li>
            <strong>特点</strong>：轻量级，中文支持良好，推理速度快
          </li>
          <li>
            <strong>Hugging Face</strong>：
            <a
              href="https://huggingface.co/openbmb/MiniCPM-V-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              openbmb/MiniCPM-V-2
            </a>
          </li>
        </ul>

        <h4>3. Moondream2 ⭐⭐⭐</h4>
        <ul>
          <li>
            <strong>参数量</strong>：1.6B
          </li>
          <li>
            <strong>内存需求</strong>：~2-3GB
          </li>
          <li>
            <strong>下载大小</strong>：约 3GB
          </li>
          <li>
            <strong>特点</strong>：非常轻量级，推理速度快，适合快速测试
          </li>
          <li>
            <strong>Hugging Face</strong>：
            <a
              href="https://huggingface.co/vikhyatk/moondream2"
              target="_blank"
              rel="noopener noreferrer"
            >
              vikhyatk/moondream2
            </a>
          </li>
        </ul>

        <h3>中等规模模型（需要更多内存）</h3>

        <h4>4. Qwen2-VL-7B ⭐⭐⭐⭐</h4>
        <ul>
          <li>
            <strong>参数量</strong>：7B
          </li>
          <li>
            <strong>内存需求</strong>：~8GB
          </li>
          <li>
            <strong>下载大小</strong>：约 14GB
          </li>
          <li>
            <strong>特点</strong>：效果更好，中文支持优秀
          </li>
          <li>
            <strong>Hugging Face</strong>：
            <a
              href="https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct"
              target="_blank"
              rel="noopener noreferrer"
            >
              Qwen/Qwen2-VL-7B-Instruct
            </a>
          </li>
        </ul>

        <h4>5. LLaVA-1.5-7B ⭐⭐⭐⭐</h4>
        <ul>
          <li>
            <strong>参数量</strong>：7B
          </li>
          <li>
            <strong>内存需求</strong>：~6GB
          </li>
          <li>
            <strong>下载大小</strong>：约 13GB
          </li>
          <li>
            <strong>特点</strong>：开源社区广泛使用，英文表现优秀
          </li>
          <li>
            <strong>Hugging Face</strong>：
            <a
              href="https://huggingface.co/liuhaotian/llava-v1.5-7b"
              target="_blank"
              rel="noopener noreferrer"
            >
              liuhaotian/llava-v1.5-7b
            </a>
          </li>
        </ul>

        <h3>性能对比表</h3>
        <table>
          <thead>
            <tr>
              <th>模型</th>
              <th>参数量</th>
              <th>内存占用</th>
              <th>推理速度</th>
              <th>中文支持</th>
              <th>推荐度</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Qwen2-VL-2B</td>
              <td>2B</td>
              <td>~4GB</td>
              <td>⭐⭐⭐⭐⭐</td>
              <td>⭐⭐⭐⭐⭐</td>
              <td>⭐⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td>MiniCPM-V-2</td>
              <td>2.4B</td>
              <td>~3GB</td>
              <td>⭐⭐⭐⭐⭐</td>
              <td>⭐⭐⭐⭐</td>
              <td>⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td>Moondream2</td>
              <td>1.6B</td>
              <td>~2GB</td>
              <td>⭐⭐⭐⭐⭐</td>
              <td>⭐⭐</td>
              <td>⭐⭐⭐</td>
            </tr>
            <tr>
              <td>LLaVA-7B</td>
              <td>7B</td>
              <td>~6GB</td>
              <td>⭐⭐⭐</td>
              <td>⭐⭐⭐</td>
              <td>⭐⭐⭐⭐</td>
            </tr>
            <tr>
              <td>Qwen2-VL-7B</td>
              <td>7B</td>
              <td>~8GB</td>
              <td>⭐⭐⭐</td>
              <td>⭐⭐⭐⭐⭐</td>
              <td>⭐⭐⭐⭐</td>
            </tr>
          </tbody>
        </table>

        <hr />

        <h2 id="model-download">📥 模型下载</h2>

        <h3>方式 1: 使用 huggingface-cli（推荐）</h3>

        <h4>安装 huggingface-cli</h4>
        <pre>
          <code>{'pip install huggingface-hub'}</code>
        </pre>

        <h4>下载推荐的轻量级模型</h4>
        <pre>
          <code>{`# Qwen2-VL-2B（最推荐）
huggingface-cli download Qwen/Qwen2-VL-2B-Instruct --local-dir ~/models/Qwen2-VL-2B

# MiniCPM-V-2
huggingface-cli download openbmb/MiniCPM-V-2 --local-dir ~/models/MiniCPM-V-2

# Moondream2
huggingface-cli download vikhyatk/moondream2 --local-dir ~/models/Moondream2`}</code>
        </pre>

        <h4>下载中等规模模型</h4>
        <pre>
          <code>{`# Qwen2-VL-7B
huggingface-cli download Qwen/Qwen2-VL-7B-Instruct --local-dir ~/models/Qwen2-VL-7B

# LLaVA-1.5-7B
huggingface-cli download liuhaotian/llava-v1.5-7b --local-dir ~/models/LLaVA-1.5-7B`}</code>
        </pre>

        <h3>方式 2: 使用 Ollama（最简单）</h3>

        <h4>安装 Ollama</h4>
        <pre>
          <code>{`# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh`}</code>
        </pre>

        <h4>拉取模型</h4>
        <pre>
          <code>{`# Qwen2-VL
ollama pull qwen2-vl:2b
ollama pull qwen2-vl:7b

# LLaVA
ollama pull llava:7b
ollama pull llava:13b

# Moondream2
ollama pull moondream2`}</code>
        </pre>

        <h3>方式 3: 下载 GGUF 格式模型（适合 CPU）</h3>

        <p>GGUF 是 llama.cpp 使用的量化格式，适合 CPU 推理，内存占用更小。</p>

        <h4>查找 GGUF 模型</h4>
        <p>
          访问{' '}
          <a
            href="https://huggingface.co/models"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hugging Face Models
          </a>{' '}
          搜索：
        </p>
        <ul>
          <li>
            关键词：<code>模型名 + GGUF</code>
          </li>
          <li>
            例如：<code>Qwen2-VL GGUF</code>、<code>LLaVA GGUF</code>
          </li>
        </ul>

        <h4>常见的 GGUF 模型仓库</h4>
        <ul>
          <li>
            <strong>bartowski</strong> -{' '}
            <a
              href="https://huggingface.co/bartowski"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://huggingface.co/bartowski
            </a>
          </li>
          <li>
            <strong>TheBloke</strong> -{' '}
            <a
              href="https://huggingface.co/TheBloke"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://huggingface.co/TheBloke
            </a>
          </li>
        </ul>

        <h4>下载 GGUF 模型</h4>
        <pre>
          <code>{`# 下载整个仓库（包含所有量化版本）
huggingface-cli download bartowski/llava-v1.5-7b-GGUF --local-dir ~/models/LLaVA-7B-GGUF

# 只下载特定量化版本（推荐 Q4_K_M）
huggingface-cli download <repo-id> \\
  --include "*q4_k_m*.gguf" \\
  --local-dir ~/models/LLaVA-7B-GGUF`}</code>
        </pre>

        <h4>推荐的 GGUF 量化级别</h4>
        <table>
          <thead>
            <tr>
              <th>量化级别</th>
              <th>文件大小</th>
              <th>质量</th>
              <th>适用场景</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Q4_0</td>
              <td>最小</td>
              <td>较低</td>
              <td>资源极度受限</td>
            </tr>
            <tr>
              <td>Q4_K_M</td>
              <td>较小</td>
              <td>中等</td>
              <td>
                <strong>推荐</strong>，平衡大小和质量
              </td>
            </tr>
            <tr>
              <td>Q5_K_M</td>
              <td>中等</td>
              <td>较高</td>
              <td>需要更好质量</td>
            </tr>
            <tr>
              <td>Q8_0</td>
              <td>较大</td>
              <td>最高</td>
              <td>需要最高质量</td>
            </tr>
          </tbody>
        </table>

        <h3>高级选项</h3>

        <h4>使用镜像站点（如果访问 Hugging Face 较慢）</h4>
        <pre>
          <code>{`# 设置环境变量使用镜像
export HF_ENDPOINT=https://hf-mirror.com

# 然后正常下载
huggingface-cli download Qwen/Qwen2-VL-2B-Instruct --local-dir ~/models/Qwen2-VL-2B`}</code>
        </pre>

        <h4>只下载特定文件</h4>
        <pre>
          <code>{`huggingface-cli download Qwen/Qwen2-VL-2B-Instruct \\
    --local-dir ~/models/Qwen2-VL-2B \\
    --include "*.safetensors" "*.bin" "*.json"`}</code>
        </pre>

        <h4>断点续传</h4>
        <p>
          huggingface-cli
          默认支持断点续传，如果下载中断，重新运行相同命令即可继续下载。
        </p>

        <hr />

        <h2 id="ollama-vs-shimmy">⚖️ Ollama vs Shimmy 对比</h2>

        <h3>核心定位</h3>

        <h4>Ollama</h4>
        <ul>
          <li>
            <strong>定位</strong>：完整的本地大模型管理平台和 API 服务
          </li>
          <li>
            <strong>架构</strong>：客户端-服务器架构，提供 HTTP API
          </li>
          <li>
            <strong>用途</strong>：模型下载、管理、推理服务的统一平台
          </li>
        </ul>

        <h4>Shimmy</h4>
        <ul>
          <li>
            <strong>定位</strong>：轻量级 CLI 工具，用于图片分析
          </li>
          <li>
            <strong>架构</strong>：命令行工具，直接调用模型
          </li>
          <li>
            <strong>用途</strong>：专注于图片理解和分析任务
          </li>
        </ul>

        <h3>详细功能对比</h3>

        <h4>安装与部署</h4>
        <table>
          <thead>
            <tr>
              <th>特性</th>
              <th>Ollama</th>
              <th>Shimmy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>安装方式</td>
              <td>
                <code>brew install ollama</code> (macOS)
              </td>
              <td>需要单独下载二进制文件</td>
            </tr>
            <tr>
              <td>安装大小</td>
              <td>~680MB</td>
              <td>~5-10MB (轻量级)</td>
            </tr>
            <tr>
              <td>启动方式</td>
              <td>
                需要启动后台服务 (<code>ollama serve</code>)
              </td>
              <td>直接执行 CLI 命令</td>
            </tr>
            <tr>
              <td>启动时间</td>
              <td>5-10 秒</td>
              <td>&lt;100 毫秒</td>
            </tr>
            <tr>
              <td>内存占用</td>
              <td>&gt;200MB (服务本身)</td>
              <td>~50MB</td>
            </tr>
            <tr>
              <td>配置复杂度</td>
              <td>简单，基本零配置</td>
              <td>需要指定可执行文件路径</td>
            </tr>
          </tbody>
        </table>

        <h4>模型管理</h4>

        <p>
          <strong>Ollama</strong>：
        </p>
        <pre>
          <code>{`# 模型管理
ollama pull llava:7b          # 下载模型
ollama list                    # 列出已安装模型
ollama rm llava:7b            # 删除模型
ollama show llava:7b          # 查看模型信息`}</code>
        </pre>

        <p>
          <strong>特点</strong>：
        </p>
        <ul>
          <li>✅ 自动管理模型下载和存储</li>
          <li>✅ 支持模型版本管理</li>
          <li>✅ 自动处理模型依赖</li>
          <li>✅ 支持模型量化（自动选择合适版本）</li>
          <li>✅ 内置丰富的模型库</li>
        </ul>

        <p>
          <strong>Shimmy</strong>：
        </p>
        <pre>
          <code>{`# 使用方式
shimmy analyze --model qwen-vl --image path/to/image.jpg`}</code>
        </pre>

        <p>
          <strong>特点</strong>：
        </p>
        <ul>
          <li>⚠️ 需要手动管理模型文件</li>
          <li>⚠️ 模型路径需要自行配置</li>
          <li>✅ 支持多种模型格式（取决于实现）</li>
          <li>⚠️ 模型切换需要修改命令参数</li>
        </ul>

        <h4>API 接口</h4>

        <p>
          <strong>Ollama - HTTP API</strong>：
        </p>
        <pre>
          <code>{`POST http://localhost:11434/api/chat
{
  "model": "llava:latest",
  "messages": [
    {
      "role": "user",
      "content": "...",
      "images": ["base64_image_data"]
    }
  ],
  "stream": false
}`}</code>
        </pre>

        <p>
          <strong>API 端点</strong>：
        </p>
        <ul>
          <li>
            <code>/api/chat</code> - 对话接口
          </li>
          <li>
            <code>/api/tags</code> - 获取模型列表
          </li>
          <li>
            <code>/api/generate</code> - 文本生成
          </li>
          <li>
            <code>/api/embeddings</code> - 向量嵌入
          </li>
        </ul>

        <p>
          <strong>特点</strong>：
        </p>
        <ul>
          <li>✅ 完整的 REST API</li>
          <li>✅ 支持流式响应</li>
          <li>✅ 支持多模型并发</li>
          <li>✅ 可以远程访问（配置后）</li>
        </ul>

        <p>
          <strong>Shimmy - CLI 接口</strong>：
        </p>
        <pre>
          <code>{`spawn('shimmy', ['analyze', '--model', modelName, '--image', imagePath]);`}</code>
        </pre>

        <p>
          <strong>特点</strong>：
        </p>
        <ul>
          <li>✅ 简单直接，适合脚本调用</li>
          <li>✅ 输出 JSON 格式结果</li>
          <li>⚠️ 每次调用启动新进程</li>
          <li>⚠️ 不支持流式响应</li>
          <li>⚠️ 需要文件系统访问（临时文件）</li>
        </ul>

        <h4>性能对比</h4>
        <table>
          <thead>
            <tr>
              <th>指标</th>
              <th>Ollama</th>
              <th>Shimmy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>启动速度</td>
              <td>5-10 秒（服务启动）</td>
              <td>&lt;100 毫秒（命令执行）</td>
            </tr>
            <tr>
              <td>首次推理</td>
              <td>需要加载模型到内存</td>
              <td>需要加载模型到内存</td>
            </tr>
            <tr>
              <td>后续推理</td>
              <td>模型常驻内存，速度快</td>
              <td>每次可能重新加载（取决于实现）</td>
            </tr>
            <tr>
              <td>并发处理</td>
              <td>✅ 支持多请求并发</td>
              <td>⚠️ 每次独立进程</td>
            </tr>
            <tr>
              <td>资源占用</td>
              <td>较高（服务 + 模型）</td>
              <td>较低（仅运行时）</td>
            </tr>
            <tr>
              <td>内存效率</td>
              <td>模型常驻，适合频繁调用</td>
              <td>按需加载，适合偶尔调用</td>
            </tr>
          </tbody>
        </table>

        <h3>使用场景推荐</h3>

        <h4>适合使用 Ollama 的场景</h4>
        <ul>
          <li>✅ 频繁调用图片分析</li>
          <li>✅ 需要管理多个模型</li>
          <li>✅ 需要远程访问</li>
          <li>✅ 需要流式响应</li>
          <li>✅ 开发和生产环境</li>
        </ul>

        <h4>适合使用 Shimmy 的场景</h4>
        <ul>
          <li>✅ 偶尔使用图片分析</li>
          <li>✅ 资源受限环境</li>
          <li>✅ 批量处理</li>
          <li>✅ 简单集成</li>
          <li>✅ 离线环境</li>
        </ul>

        <h3>优缺点总结</h3>

        <h4>Ollama</h4>
        <p>
          <strong>优点</strong>：
        </p>
        <ul>
          <li>✅ 完整的模型管理平台</li>
          <li>✅ 统一的 API 接口</li>
          <li>✅ 丰富的模型库</li>
          <li>✅ 支持多种模型格式</li>
          <li>✅ 社区活跃，文档完善</li>
          <li>✅ 支持远程访问</li>
          <li>✅ 支持流式响应</li>
        </ul>

        <p>
          <strong>缺点</strong>：
        </p>
        <ul>
          <li>❌ 需要启动后台服务</li>
          <li>❌ 资源占用较大</li>
          <li>❌ 启动时间较长</li>
          <li>❌ 需要网络请求（即使本地）</li>
        </ul>

        <h4>Shimmy</h4>
        <p>
          <strong>优点</strong>：
        </p>
        <ul>
          <li>✅ 轻量级，体积小</li>
          <li>✅ 启动速度快</li>
          <li>✅ 无需后台服务</li>
          <li>✅ 资源占用小</li>
          <li>✅ 简单直接</li>
        </ul>

        <p>
          <strong>缺点</strong>：
        </p>
        <ul>
          <li>❌ 需要手动管理模型</li>
          <li>❌ 每次调用可能重新加载模型</li>
          <li>❌ 不支持流式响应</li>
          <li>❌ 需要文件系统操作</li>
          <li>❌ 文档和社区支持可能较少</li>
        </ul>

        <h3>推荐选择</h3>

        <p>
          <strong>选择 Ollama 如果</strong>：
        </p>
        <ul>
          <li>✅ 需要频繁使用图片分析功能</li>
          <li>✅ 需要管理多个模型</li>
          <li>✅ 需要统一的 API 接口</li>
          <li>✅ 有足够的系统资源</li>
          <li>✅ 需要生产环境部署</li>
        </ul>

        <p>
          <strong>选择 Shimmy 如果</strong>：
        </p>
        <ul>
          <li>✅ 偶尔使用图片分析</li>
          <li>✅ 系统资源有限</li>
          <li>✅ 需要轻量级解决方案</li>
          <li>✅ 不需要模型管理功能</li>
          <li>✅ 适合简单脚本调用</li>
        </ul>

        <hr />

        <h2 id="local-models">💾 使用本地模型</h2>

        <h3>Shimmy 使用本地 Hugging Face 模型</h3>

        <h4>自动发现模型</h4>
        <p>
          Shimmy 会自动发现 <code>~/models</code> 目录下的模型文件。
        </p>

        <pre>
          <code>{`# 查看 shimmy 发现的模型
shimmy list

# 输出示例：
# 🔍 Auto-Discovered Models:
#   model-00001-of-00002 => "/Users/starsky/models/Qwen2-VL-2B/model-00001-of-00002.safetensors" [3803MB]
#   model-00002-of-00002 => "/Users/starsky/models/Qwen2-VL-2B/model-00002-of-00002.safetensors" [409MB]`}</code>
        </pre>

        <h4>方式 1: 使用 --model-dirs 参数（推荐）</h4>
        <pre>
          <code>
            {
              'shimmy --model-dirs ~/models analyze --model qwen-vl --image path/to/image.jpg'
            }
          </code>
        </pre>

        <h4>方式 2: 设置环境变量</h4>
        <pre>
          <code>{`export HF_HOME=~/models
export TRANSFORMERS_CACHE=~/models
shimmy analyze --model qwen-vl --image path/to/image.jpg`}</code>
        </pre>

        <h4>方式 3: 在代码中配置</h4>
        <p>
          代码会自动查找本地模型，根据模型名称在 <code>~/models</code>{' '}
          目录下查找。
        </p>

        <h3>模型名称映射</h3>
        <table>
          <thead>
            <tr>
              <th>模型名称</th>
              <th>本地目录</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>qwen-vl</code>
              </td>
              <td>
                <code>Qwen2-VL-2B</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>qwen2-vl</code>
              </td>
              <td>
                <code>Qwen2-VL-2B</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>qwen2-vl-2b</code>
              </td>
              <td>
                <code>Qwen2-VL-2B</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>qwen2-vl-7b</code>
              </td>
              <td>
                <code>Qwen2-VL-7B</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>minicpm-v</code>
              </td>
              <td>
                <code>MiniCPM-V-2</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>moondream2</code>
              </td>
              <td>
                <code>Moondream2</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>llava</code>
              </td>
              <td>
                <code>LLaVA-1.5-7B</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>llava-7b</code>
              </td>
              <td>
                <code>LLaVA-1.5-7B</code>
              </td>
            </tr>
            <tr>
              <td>
                <code>cogvlm2</code>
              </td>
              <td>
                <code>CogVLM2-2B</code>
              </td>
            </tr>
          </tbody>
        </table>

        <h3>验证模型是否可用</h3>

        <h4>检查模型文件</h4>
        <pre>
          <code>{`# 检查 Qwen2-VL-2B 模型文件
ls -lh ~/models/Qwen2-VL-2B

# 应该看到以下关键文件：
# - config.json (模型配置)
# - model-*.safetensors (模型权重)
# - tokenizer.json (分词器)
# - preprocessor_config.json (预处理器配置)`}</code>
        </pre>

        <h4>测试 Shimmy 是否能找到模型</h4>
        <pre>
          <code>{`# 设置环境变量
export HF_HOME=~/models
export TRANSFORMERS_CACHE=~/models

# 测试 shimmy（如果已安装）
shimmy analyze --model qwen-vl --image test.jpg`}</code>
        </pre>

        <h3>在 Electron 应用中设置环境变量</h3>
        <p>
          在 <code>aiService.ts</code> 中，调用 Shimmy 时会自动设置环境变量：
        </p>
        <pre>
          <code>{`const env = {
  ...process.env,
  HF_HOME: path.join(homeDir, 'models'),
  TRANSFORMERS_CACHE: path.join(homeDir, 'models'),
};`}</code>
        </pre>

        <h3>常见问题</h3>

        <h4>Q: Shimmy 找不到本地模型</h4>
        <p>
          <strong>A</strong>：检查以下几点：
        </p>
        <ul>
          <li>模型路径是否正确</li>
          <li>环境变量是否设置</li>
          <li>
            Shimmy 是否支持本地路径（查看 <code>shimmy --help</code>）
          </li>
          <li>模型文件是否完整</li>
        </ul>

        <h4>Q: 模型格式不兼容</h4>
        <p>
          <strong>A</strong>：
        </p>
        <ul>
          <li>
            检查 shimmy 支持的格式：<code>shimmy --help</code>
          </li>
          <li>如果只支持 GGUF，可能需要转换或使用其他工具</li>
          <li>考虑使用 Ollama（自动处理格式转换）</li>
        </ul>

        <hr />

        <h2 id="integration">🔌 集成方式</h2>

        <h3>Ollama 集成</h3>

        <h4>1. 检查连接</h4>
        <pre>
          <code>{`async checkOllamaConnection(baseUrl?: string) {
  const url = baseUrl || 'http://localhost:11434';
  const modelsResult = await this.getOllamaModels(url);
  return { success: true, models: [...] };
}`}</code>
        </pre>

        <h4>2. 获取模型列表</h4>
        <pre>
          <code>{`async getOllamaModels(baseUrl?: string) {
  // GET /api/tags
  const result = await http.get(\`\${baseUrl}/api/tags\`);
  return { models: result.models };
}`}</code>
        </pre>

        <h4>3. 分析图片</h4>
        <pre>
          <code>{`async analyzeImageWithOllama(request: ImageAnalysisRequest) {
  // 1. 将图片转换为 base64
  const base64Image = imageBuffer.toString('base64');

  // 2. 调用 Ollama API
  const result = await this.callOllamaAPI(baseUrl, modelName, base64Image, {
    temperature: 0.7,
    maxTokens: 512,
  });

  // 3. 解析返回的描述
  const description = result.message?.content || '无法生成描述';
  const tags = this.extractTagsFromDescription(description);
}`}</code>
        </pre>

        <h3>Shimmy 集成</h3>

        <h4>1. 检查可用性</h4>
        <pre>
          <code>{`async checkShimmy(shimmyPath?: string) {
  const pathToCheck = shimmyPath || this.getDefaultShimmyPath();
  if (!fs.existsSync(pathToCheck)) {
    return { success: false, error: 'Shimmy not found' };
  }
  // 尝试运行 shimmy --version
}`}</code>
        </pre>

        <h4>2. 分析图片</h4>
        <pre>
          <code>{`async analyzeImageWithShimmy(request: ImageAnalysisRequest) {
  // 1. 保存临时文件
  const tempImagePath = path.join(
    app.getPath('temp'),
    \`temp_image_\${Date.now()}.jpg\`
  );
  await writeFile(tempImagePath, imageBuffer);

  // 2. 调用 CLI
  const result = await this.callShimmyTool(
    shimmyPath,
    modelName,
    tempImagePath
  );

  // 3. 清理临时文件
  fs.unlinkSync(tempImagePath);
}`}</code>
        </pre>

        <h3>配置方式</h3>

        <h4>Ollama 配置</h4>
        <pre>
          <code>{`const [ollamaConfig, setOllamaConfig] = useState({
  baseUrl: 'http://localhost:11434', // Ollama 服务地址
  model: 'llava:latest', // 模型名称
  temperature: 0.7, // 温度参数
  maxTokens: 512, // 最大 token 数
});`}</code>
        </pre>

        <h4>Shimmy 配置</h4>
        <pre>
          <code>{`const [shimmyConfig, setShimmyConfig] = useState({
  shimmyPath: '', // Shimmy 可执行文件路径
  model: 'qwen-vl', // 模型名称
});`}</code>
        </pre>

        <hr />

        <h2 id="best-practices">✨ 最佳实践</h2>

        <h3>模型选择建议</h3>
        <ul>
          <li>
            <strong>首选</strong>：从 <strong>Qwen2-VL-2B</strong> 或{' '}
            <strong>MiniCPM-V</strong> 开始
            <ul>
              <li>轻量级，适合您的硬件</li>
              <li>中文支持好</li>
              <li>推理速度快</li>
            </ul>
          </li>
          <li>
            <strong>备选</strong>：如果需要更好的效果，尝试{' '}
            <strong>LLaVA-7B</strong> 或 <strong>Qwen2-VL-7B</strong>
            <ul>
              <li>需要确保有足够内存</li>
              <li>考虑使用量化版本</li>
            </ul>
          </li>
          <li>
            <strong>测试</strong>：先用小图片测试，确认模型正常工作后再处理大图
          </li>
        </ul>

        <h3>内存管理</h3>
        <ul>
          <li>16GB 内存对于 7B+ 模型可能紧张，建议使用量化版本</li>
          <li>没有 GPU 的情况下，推理会比较慢，建议使用较小的模型</li>
          <li>确认工具支持的模型格式（可能是 GGUF、ONNX 或其他）</li>
        </ul>

        <h3>中文支持</h3>
        <ul>
          <li>
            如果需要中文描述，优先选择 <strong>Qwen2-VL</strong> 或{' '}
            <strong>MiniCPM-V</strong>
          </li>
          <li>LLaVA 系列主要支持英文，中文效果一般</li>
        </ul>

        <h3>混合使用建议</h3>
        <ul>
          <li>
            <strong>开发环境</strong>：使用 Ollama，方便测试和调试
          </li>
          <li>
            <strong>生产环境</strong>：根据资源情况选择
            <ul>
              <li>资源充足 → Ollama</li>
              <li>资源受限 → Shimmy</li>
            </ul>
          </li>
          <li>
            <strong>特殊场景</strong>：
            <ul>
              <li>批量处理 → Shimmy（可并行）</li>
              <li>实时交互 → Ollama（响应快）</li>
            </ul>
          </li>
        </ul>

        <h3>推荐方案</h3>
        <p>对于 Pixuli 图片管理应用：</p>
        <ul>
          <li>
            如果用户会频繁使用 AI 分析功能，<strong>推荐使用 Ollama</strong>
          </li>
          <li>
            如果只是偶尔使用，或者需要更轻量级的方案，可以考虑{' '}
            <strong>Shimmy</strong>
          </li>
          <li>也可以同时支持两者，让用户根据需求选择</li>
        </ul>

        <hr />

        <h2>📚 相关资源</h2>
        <ul>
          <li>
            <a
              href="https://github.com/QwenLM/Qwen2-VL"
              target="_blank"
              rel="noopener noreferrer"
            >
              Qwen2-VL 官方文档
            </a>
          </li>
          <li>
            <a
              href="https://github.com/haotian-liu/LLaVA"
              target="_blank"
              rel="noopener noreferrer"
            >
              LLaVA 官方仓库
            </a>
          </li>
          <li>
            <a
              href="https://ollama.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ollama 官网
            </a>
          </li>
          <li>
            <a
              href="https://github.com/ggerganov/llama.cpp"
              target="_blank"
              rel="noopener noreferrer"
            >
              llama.cpp 仓库
            </a>
          </li>
          <li>
            <a
              href="https://huggingface.co/models"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hugging Face Models
            </a>
          </li>
        </ul>

        <hr />

        <p className="text-sm text-gray-500 mt-8">
          最后更新：{new Date().toLocaleDateString('zh-CN')}
        </p>
      </div>
    </PageLayout>
  );
}
