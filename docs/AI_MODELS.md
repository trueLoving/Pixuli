# AI 模型支持文档

## 概述

Pixuli 支持多种类型的 AI 模型用于图片分析，包括图像分类、目标检测和语义分析等功能。本文档详细说明了支持的模型类型、文件格式以及相关的下载资源。

## 支持的模型类型

### 1. TensorFlow Lite (推荐)

**格式**: `.tflite`  
**描述**: Google 开发的轻量级机器学习框架，专为移动设备和边缘计算优化。

**特点**:
- 文件体积小，运行效率高
- 专门针对移动设备优化
- 支持量化模型，减少内存占用
- 推理速度快

**支持的文件扩展名**: `.tflite`

### 2. TensorFlow

**格式**: `.pb`, `.json`, `.bin`  
**描述**: Google 开发的深度学习框架的标准模型格式。

**特点**:
- 功能强大，支持复杂模型
- 社区资源丰富
- 支持 GPU 加速
- 模型生态完善

**支持的文件扩展名**: `.pb` (Protocol Buffer), `.json` (模型配置), `.bin` (权重文件)

### 3. ONNX (Open Neural Network Exchange)

**格式**: `.onnx`  
**描述**: 开放的神经网络交换格式，支持多种深度学习框架间的模型转换。

**特点**:
- 跨平台兼容性好
- 支持多种深度学习框架
- 标准化的模型格式
- 优秀的性能表现

**支持的文件扩展名**: `.onnx`

### 4. 本地 LLM

**描述**: 本地运行的大语言模型，用于图片的语义理解和描述生成。

**特点**:
- 数据隐私保护
- 离线可用
- 深度语义理解
- 自然语言描述

### 5. 远程 API

**描述**: 通过 API 调用云端 AI 服务进行图片分析。

**特点**:
- 无需本地计算资源
- 模型持续更新
- 高精度分析
- 支持多种 AI 服务提供商

## 推荐模型下载

### TensorFlow Lite 模型

#### MobileNet V2 Lite
- **名称**: MobileNet V2 Lite
- **类型**: 图像分类
- **大小**: ~4MB
- **下载地址**: [Google TensorFlow Models](https://storage.googleapis.com/download.tensorflow.org/models/tflite/mobilenet_v2_1.0_224.tflite)
- **描述**: 轻量级图像分类模型，支持 1000 个 ImageNet 类别
- **用途**: 通用图像识别和分类

#### EfficientNet Lite
- **下载地址**: [TensorFlow Hub](https://tfhub.dev/tensorflow/lite-model/efficientnet/lite0/classification/2)
- **描述**: 高效的图像分类模型，在准确性和效率间取得良好平衡

### ONNX 模型

#### YOLOv8n
- **名称**: YOLOv8 Nano
- **类型**: 目标检测
- **大小**: ~6MB
- **下载地址**: [Ultralytics Assets](https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx)
- **描述**: 快速准确的目标检测模型
- **用途**: 实时目标检测和边界框预测

#### COCO-SSD
- **下载地址**: [TensorFlow.js Models](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
- **描述**: 基于 COCO 数据集训练的目标检测模型
- **用途**: 检测常见物体和场景

### TensorFlow 模型

#### ResNet-50
- **下载地址**: [TensorFlow Hub](https://tfhub.dev/tensorflow/resnet_50/classification/1)
- **描述**: 深度残差网络，图像分类性能优秀
- **用途**: 高精度图像分类

#### Inception V3
- **下载地址**: [TensorFlow Models Zoo](https://github.com/tensorflow/models/tree/master/research/slim#models)
- **描述**: Google 开发的深度卷积神经网络
- **用途**: 图像分类和特征提取

## 模型资源网站

### 官方资源

1. **TensorFlow Hub**: https://tfhub.dev/
   - Google 官方模型库
   - 高质量预训练模型
   - 支持多种任务类型

2. **TensorFlow Model Garden**: https://github.com/tensorflow/models
   - 开源模型实现
   - 包含训练代码和预训练权重
   - 社区维护

3. **ONNX Model Zoo**: https://github.com/onnx/models
   - 官方 ONNX 模型集合
   - 涵盖多种任务
   - 标准化格式

4. **Ultralytics**: https://github.com/ultralytics/ultralytics
   - YOLOv8 系列模型
   - 目标检测专业库
   - 持续更新

### 第三方资源

1. **Hugging Face Model Hub**: https://huggingface.co/models
   - 大量开源模型
   - 支持多种框架
   - 活跃的社区

2. **Papers with Code**: https://paperswithcode.com/
   - 学术论文对应的模型实现
   - 最新研究成果
   - 性能基准测试

3. **Model Zoo**: https://modelzoo.co/
   - 跨框架模型集合
   - 分类清晰
   - 易于搜索

## 模型使用指南

### 文件要求

1. **标签文件**: 对于分类模型，需要对应的标签文件
   - TensorFlow Lite: `model_name_labels.txt`
   - ONNX: `model_name_labels.txt`
   - TensorFlow: 根据模型要求

2. **文件命名**: 建议使用描述性的文件名
   - 包含模型类型和版本信息
   - 避免使用特殊字符
   - 使用英文命名

### 性能优化建议

1. **选择合适的模型大小**
   - 移动设备: 优先选择 TensorFlow Lite
   - 桌面应用: 可选择更大的 TensorFlow 或 ONNX 模型
   - 实时应用: 选择轻量级模型

2. **内存管理**
   - 避免同时加载多个大型模型
   - 及时释放不使用的模型
   - 监控内存使用情况

3. **GPU 加速**
   - 支持 CUDA 的环境下可启用 GPU 加速
   - TensorFlow Lite 支持 GPU 委托
   - ONNX 支持多种执行提供程序

## 故障排除

### 常见问题

1. **模型加载失败**
   - 检查文件路径是否正确
   - 确认文件格式匹配
   - 验证文件完整性

2. **标签文件缺失**
   - 下载对应的标签文件
   - 确认文件编码为 UTF-8
   - 检查标签格式

3. **内存不足**
   - 使用更小的模型
   - 减少同时加载的模型数量
   - 优化图片预处理

4. **推理速度慢**
   - 启用 GPU 加速
   - 使用量化模型
   - 优化输入尺寸

### 技术支持

如遇到问题，请参考以下资源：

1. **官方文档**: 查看相应框架的官方文档
2. **社区论坛**: 在相关技术社区寻求帮助
3. **GitHub Issues**: 查看项目的 Issues 页面
4. **技术博客**: 搜索相关的技术分享文章

## 更新日志

- **v1.2.0**: 添加 TensorFlow Lite 支持
- **v1.1.0**: 优化 ONNX 模型加载
- **v1.0.0**: 初始版本，支持基础模型格式

---

**注意**: 下载和使用第三方模型时，请遵守相应的许可证协议和使用条款。
