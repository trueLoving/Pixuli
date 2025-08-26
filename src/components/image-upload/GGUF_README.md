# GGUF 模型集成指南

## 🚀 什么是 GGUF 格式

GGUF (GGML Universal Format) 是一种优化的模型格式，专门为本地推理设计：

### 主要优势
- **轻量级**: 比原始模型小 30-50%
- **高效**: 优化的推理性能
- **跨平台**: 支持多种硬件架构
- **本地运行**: 无需网络连接，保护隐私

## 📥 获取 GGUF 模型

### 1. 官方模型源

#### Hugging Face
- **LLaVA 系列**: https://huggingface.co/llava-hf
- **BakLLaVA**: https://huggingface.co/SkunkworksAI/BakLLaVA-1
- **Qwen-VL**: https://huggingface.co/Qwen/Qwen-VL-Chat

#### 推荐模型
```bash
# LLaVA v1.5 7B (推荐)
wget https://huggingface.co/llava-hf/llava-1.5-7b-hf/resolve/main/model.gguf

# LLaVA v1.5 13B (高精度)
wget https://huggingface.co/llava-hf/llava-1.5-13b-hf/resolve/main/model.gguf

# BakLLaVA 1 (轻量级)
wget https://huggingface.co/SkunkworksAI/BakLLaVA-1/resolve/main/model.gguf
```

### 2. 模型转换

#### 从 Hugging Face 转换
```bash
# 安装转换工具
pip install huggingface_hub

# 下载并转换模型
python -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='llava-hf/llava-1.5-7b-hf', local_dir='./models')
"
```

#### 从 PyTorch 转换
```bash
# 使用 llama.cpp 转换工具
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
python convert.py --outtype f16 --outfile model.gguf model.pt
```

## 🔧 在 Pixuli 中使用 GGUF 模型

### 1. 模型文件结构

```
public/
└── models/
    └── gguf/
        ├── llava-v1.5-7b.gguf
        ├── llava-v1.5-13b.gguf
        └── bakllava-1.gguf
```

### 2. 配置模型路径

#### 环境变量配置
```env
# .env 文件
VITE_GGUF_MODEL_PATH=/models/gguf/llava-v1.5-7b.gguf
VITE_GGUF_CONTEXT_SIZE=2048
VITE_GGUF_THREADS=4
```

#### 代码配置
```typescript
import { GGUFAnalysisService } from '@/services/ggufAnalysisService'

const ggufService = new GGUFAnalysisService({
  modelPath: '/models/gguf/llava-v1.5-7b.gguf',
  contextSize: 2048,
  threads: 4,
  gpuLayers: 0,
  threshold: 0.7,
  maxResults: 10,
  language: 'zh-CN'
})
```

### 3. 性能优化配置

#### CPU 优化
```typescript
const config = {
  threads: navigator.hardwareConcurrency || 4,  // 使用所有 CPU 核心
  contextSize: 2048,                           // 适中的上下文大小
  useMMap: true,                               // 启用内存映射
  useMlock: false                              // 禁用内存锁定
}
```

#### GPU 加速
```typescript
const config = {
  gpuLayers: 32,                               // 使用 GPU 加速
  threads: 4,                                  // 减少 CPU 线程
  contextSize: 4096,                           // 增加上下文大小
  useMMap: true                                // 启用内存映射
}
```

## 📊 模型性能对比

### 推理速度对比

| 模型 | 大小 | CPU 推理 | GPU 推理 | 内存占用 | 推荐场景 |
|------|------|----------|----------|----------|----------|
| LLaVA 7B | 4.2GB | 2-5s | 0.5-1s | 8GB | 个人使用 |
| LLaVA 13B | 7.8GB | 5-10s | 1-2s | 16GB | 高精度需求 |
| LLaVA 34B | 19.5GB | 15-30s | 3-5s | 32GB | 企业级应用 |

### 硬件要求

#### 最低配置
- **CPU**: 4 核心，2.0GHz
- **内存**: 8GB RAM
- **存储**: 10GB 可用空间
- **模型**: LLaVA 7B 或更小

#### 推荐配置
- **CPU**: 8 核心，3.0GHz
- **内存**: 16GB RAM
- **存储**: 50GB 可用空间
- **GPU**: NVIDIA GTX 1060 或更高
- **模型**: LLaVA 13B

#### 高性能配置
- **CPU**: 16 核心，3.5GHz
- **内存**: 32GB RAM
- **存储**: 100GB 可用空间
- **GPU**: NVIDIA RTX 3080 或更高
- **模型**: LLaVA 34B

## 🎯 使用场景

### 1. 图像分类
```typescript
const prompt = `请识别这张图片中的主要物体和场景，输出标签和描述。`
```

### 2. 目标检测
```typescript
const prompt = `请检测图片中的所有物体，并标注它们的位置和类别。`
```

### 3. 图像描述
```typescript
const prompt = `请详细描述这张图片的内容，包括物体、场景、颜色、布局等。`
```

### 4. 多模态理解
```typescript
const prompt = `基于图片内容回答问题：[用户问题]`
```

## 🔍 故障排除

### 常见问题

#### 1. 模型加载失败
**症状**: 控制台显示 "GGUF 模型初始化失败"
**解决方案**:
- 检查模型文件路径是否正确
- 确认模型文件是否完整下载
- 检查文件权限设置

#### 2. 内存不足
**症状**: 浏览器崩溃或显示内存错误
**解决方案**:
- 使用更小的模型 (7B 而不是 13B)
- 减少上下文大小
- 关闭其他应用程序

#### 3. 推理速度慢
**症状**: 分析耗时超过 10 秒
**解决方案**:
- 启用 GPU 加速
- 增加线程数
- 使用更小的模型

#### 4. 结果不准确
**症状**: 标签和描述与图片不符
**解决方案**:
- 使用更大的模型
- 调整置信度阈值
- 优化提示词

### 调试技巧

#### 启用详细日志
```typescript
// 在浏览器控制台中
localStorage.setItem('debug', 'gguf:*')
```

#### 监控性能
```typescript
const startTime = performance.now()
const result = await ggufService.analyzeImage(request)
const endTime = performance.now()
console.log(`推理耗时: ${endTime - startTime}ms`)
```

#### 内存使用监控
```typescript
const memoryInfo = performance.memory
console.log('内存使用:', {
  used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
  total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
  limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
})
```

## 🚀 高级功能

### 1. 模型缓存
```typescript
// 启用模型缓存
localStorage.setItem('gguf_model_cache', 'true')
```

### 2. 批量处理
```typescript
const results = await Promise.all(
  images.map(img => ggufService.analyzeImage({ imageFile: img }))
)
```

### 3. 流式输出
```typescript
// 支持流式推理结果
const stream = await ggufService.analyzeImageStream(request)
for await (const chunk of stream) {
  console.log('推理进度:', chunk)
}
```

### 4. 自定义提示词
```typescript
const customPrompt = `
请分析这张图片，重点关注以下方面：
1. 主要物体和场景
2. 颜色和光线
3. 构图和布局
4. 情感和氛围

请用中文输出，格式如下：
标签：[关键词1, 关键词2, 关键词3]
描述：[详细描述]
情感：[情感分析]
`
```

## 📚 参考资料

### 官方文档
- [llama.cpp 文档](https://github.com/ggerganov/llama.cpp)
- [LLaVA 项目](https://github.com/haotian-liu/LLaVA)
- [GGUF 格式说明](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)

### 社区资源
- [Hugging Face 模型库](https://huggingface.co/models?search=gguf)
- [llama.cpp 讨论区](https://github.com/ggerganov/llama.cpp/discussions)
- [AI 模型评测](https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard)

### 性能基准
- [LLaVA 性能报告](https://arxiv.org/abs/2304.08485)
- [GGUF vs 其他格式对比](https://github.com/ggerganov/llama.cpp#performance)

## 🤝 贡献指南

欢迎为 GGUF 集成功能贡献代码！

### 开发规范
- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 添加适当的单元测试
- 更新相关文档

### 测试要求
- 单元测试覆盖率 > 80%
- 集成测试覆盖主要流程
- 性能测试确保响应时间 < 5s
- 兼容性测试覆盖主流浏览器

### 提交 PR
1. Fork 项目仓库
2. 创建功能分支
3. 提交代码更改
4. 创建 Pull Request
5. 等待代码审查

---

通过以上指南，您就可以在 Pixuli 中成功集成和使用 GGUF 格式的 AI 模型了！🎉 