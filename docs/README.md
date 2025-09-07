# Pixuli AI 模型文档

欢迎来到 Pixuli AI 模型文档中心！这里包含了使用和开发 AI 模型所需的所有信息。

## 📚 文档目录

### 🚀 [快速开始指南](./QUICK_START.md)
- 5分钟上手 AI 图片分析
- 推荐的第一个模型
- 常用模型推荐
- 使用技巧和故障排除

### 🔧 [AI 模型支持文档](./AI_MODELS.md)
- 支持的模型类型详解
- 推荐模型下载地址
- 模型资源网站汇总
- 性能优化建议
- 完整的故障排除指南

### 💻 [模型开发指南](./MODEL_DEVELOPMENT.md)
- 自定义模型开发
- 模型格式要求和接口规范
- 转换工具和优化建议
- 测试验证流程
- 贡献指南

## 🎯 快速导航

### 我是新用户
👉 从 [快速开始指南](./QUICK_START.md) 开始，5分钟体验 AI 图片分析

### 我想下载更多模型
👉 查看 [AI 模型支持文档](./AI_MODELS.md) 中的推荐模型和下载地址

### 我想开发自己的模型
👉 参考 [模型开发指南](./MODEL_DEVELOPMENT.md) 了解技术规范和最佳实践

### 我遇到了问题
👉 查看各文档中的故障排除章节，或在 GitHub Issues 中寻求帮助

## 🌟 支持的模型类型

| 类型 | 格式 | 推荐程度 | 特点 |
|------|------|----------|------|
| **TensorFlow Lite** | `.tflite` | ⭐⭐⭐⭐⭐ | 轻量级，速度快，推荐首选 |
| **ONNX** | `.onnx` | ⭐⭐⭐⭐ | 跨平台兼容，生态丰富 |
| **TensorFlow** | `.pb`, `.json`, `.bin` | ⭐⭐⭐ | 功能强大，资源丰富 |
| **本地 LLM** | 多种格式 | ⭐⭐⭐ | 语义理解，隐私保护 |
| **远程 API** | API 调用 | ⭐⭐ | 高精度，无需本地资源 |

## 📊 推荐模型速览

### 🏆 最佳入门模型
**MobileNet V2 Lite** (4MB)
- 格式：TensorFlow Lite
- 用途：通用图像分类
- 特点：体积小、速度快、准确度高

### 🎯 目标检测首选
**YOLOv8n** (6MB)
- 格式：ONNX
- 用途：目标检测和定位
- 特点：实时检测、边界框精确

### 📈 高精度分类
**EfficientNet Lite** (8MB)
- 格式：TensorFlow Lite
- 用途：高精度图像分类
- 特点：准确度与效率的最佳平衡

## 🔗 重要资源链接

### 官方模型库
- [TensorFlow Hub](https://tfhub.dev/) - Google 官方模型库
- [ONNX Model Zoo](https://github.com/onnx/models) - ONNX 官方模型集合
- [Hugging Face Models](https://huggingface.co/models) - 开源社区模型

### 模型转换工具
- [TensorFlow Lite Converter](https://www.tensorflow.org/lite/convert) - TF 到 TFLite 转换
- [tf2onnx](https://github.com/onnx/tensorflow-onnx) - TensorFlow 到 ONNX 转换
- [PyTorch ONNX](https://pytorch.org/docs/stable/onnx.html) - PyTorch 到 ONNX 转换

### 开发工具
- [Netron](https://github.com/lutzroeder/netron) - 神经网络可视化工具
- [ONNX Runtime](https://github.com/microsoft/onnxruntime) - ONNX 推理引擎
- [TensorFlow Lite Tools](https://www.tensorflow.org/lite/guide) - TFLite 开发工具

## 💡 最佳实践

### 模型选择建议
1. **首次使用**：选择 MobileNet V2 Lite
2. **需要检测物体**：选择 YOLOv8n
3. **追求高精度**：选择 EfficientNet Lite
4. **自定义需求**：参考开发指南

### 性能优化
1. **文件大小**：优先选择 < 10MB 的模型
2. **推理速度**：使用量化模型和合适的输入尺寸
3. **内存管理**：避免同时加载多个大型模型

### 兼容性保证
1. **格式标准**：使用标准化的模型格式
2. **文件编码**：标签文件使用 UTF-8 编码
3. **版本兼容**：注意框架版本兼容性

## 🆘 获取帮助

### 文档问题
如果您在文档中发现错误或需要补充，请：
1. 在 GitHub 上提交 Issue
2. 提供具体的问题描述
3. 建议改进方案

### 技术支持
遇到技术问题时：
1. 查看相关文档的故障排除章节
2. 搜索 GitHub Issues 中的相似问题
3. 提交新的 Issue 并提供详细信息

### 社区贡献
欢迎参与项目贡献：
1. 分享优质模型资源
2. 改进文档内容
3. 提供使用反馈
4. 参与代码开发

## 📝 更新日志

### v1.2.0 (当前版本)
- ✅ 添加 TensorFlow Lite 模型支持
- ✅ 实现模型实时刷新机制
- ✅ 改进模型下载服务稳定性
- ✅ 完善文档体系

### v1.1.0
- ✅ 优化 ONNX 模型加载性能
- ✅ 添加更多预设模型
- ✅ 改进错误处理机制

### v1.0.0
- ✅ 初始版本发布
- ✅ 支持基础模型格式
- ✅ 实现核心分析功能

---

## 🎉 开始您的 AI 之旅

准备好体验强大的 AI 图片分析功能了吗？

👆 **从 [快速开始指南](./QUICK_START.md) 开始，只需5分钟即可上手！**

---

*如果这些文档对您有帮助，请给我们的项目一个 ⭐ Star！*
