# AI 模型开发指南

## 概述

本指南面向希望为 Pixuli 开发或适配自定义 AI 模型的开发者。我们将介绍模型格式要求、接口规范、最佳实践等内容。

## 支持的模型框架

### 1. TensorFlow Lite (推荐)

#### 模型要求
- **文件格式**: `.tflite`
- **输入格式**: RGB 图像，归一化到 [0,1] 或 [-1,1]
- **输出格式**: 分类概率或检测结果
- **模型大小**: 建议 < 50MB

#### 转换示例
```python
import tensorflow as tf

# 从 SavedModel 转换
converter = tf.lite.TFLiteConverter.from_saved_model('path/to/saved_model')
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

# 保存模型
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

#### 量化支持
```python
# 动态范围量化
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# 整数量化
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data_gen
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8
```

### 2. ONNX

#### 模型要求
- **文件格式**: `.onnx`
- **输入格式**: RGB 图像张量
- **输出格式**: 根据任务类型
- **ONNX 版本**: 1.9.0+

#### 转换示例

**从 PyTorch 转换**
```python
import torch
import torch.onnx

# 准备模型和示例输入
model = YourModel()
model.eval()
dummy_input = torch.randn(1, 3, 224, 224)

# 导出 ONNX
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    export_params=True,
    opset_version=11,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)
```

**从 TensorFlow 转换**
```python
import tf2onnx
import tensorflow as tf

# 从 SavedModel 转换
python -m tf2onnx.convert \
    --saved-model path/to/saved_model \
    --output model.onnx \
    --opset 11
```

### 3. TensorFlow

#### 模型要求
- **文件格式**: `.pb` (GraphDef) 或 SavedModel 目录
- **输入节点**: 明确的输入节点名称
- **输出节点**: 明确的输出节点名称

#### 模型保存示例
```python
import tensorflow as tf

# SavedModel 格式（推荐）
tf.saved_model.save(model, 'path/to/saved_model')

# GraphDef 格式
with tf.gfile.GFile('model.pb', 'wb') as f:
    f.write(graph_def.SerializeToString())
```

## 模型接口规范

### 输入格式

#### 图像分类模型
```
输入: [batch_size, height, width, channels]
- channels = 3 (RGB)
- height, width = 224 (推荐) 或其他固定尺寸
- 数据类型: float32
- 值范围: [0, 1] 或 [-1, 1]
```

#### 目标检测模型
```
输入: [batch_size, height, width, channels]
- 通常为 416x416, 512x512, 或 640x640
- 预处理: 缩放并保持宽高比
```

### 输出格式

#### 图像分类
```
输出: [batch_size, num_classes]
- 每个类别的概率分数
- 使用 softmax 激活
- 对应标签文件中的类别顺序
```

#### 目标检测 (YOLO 格式)
```
输出: [batch_size, num_detections, 6]
- 6个值: [x_center, y_center, width, height, confidence, class_id]
- 坐标归一化到 [0, 1]
- confidence: 目标存在的置信度
- class_id: 类别索引
```

#### 目标检测 (COCO 格式)
```
输出:
- boxes: [batch_size, num_detections, 4] # [x1, y1, x2, y2]
- scores: [batch_size, num_detections]
- classes: [batch_size, num_detections]
```

## 标签文件格式

### 文件命名
- 分类模型: `model_name_labels.txt`
- 检测模型: `model_name_labels.txt`

### 文件内容
```
# 每行一个类别名称，按索引顺序
person
bicycle
car
motorcycle
airplane
bus
train
truck
...
```

### 编码要求
- **字符编码**: UTF-8
- **换行符**: LF (\n)
- **注释**: 支持 # 开头的注释行

## 模型优化建议

### 1. 模型大小优化

#### TensorFlow Lite
```python
# 权重量化
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# 动态范围量化
converter.optimizations = [tf.lite.Optimize.OPTIMIZE_FOR_SIZE]

# 全整数量化
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
```

#### ONNX
```python
# 使用 ONNX 简化工具
import onnxsim
model_simplified, check = onnxsim.simplify(model)
```

### 2. 推理速度优化

- **输入尺寸**: 使用较小的输入尺寸（224x224 vs 512x512）
- **模型结构**: 选择 MobileNet、EfficientNet 等轻量级架构
- **量化**: 使用 INT8 量化减少计算量
- **算子优化**: 避免使用不常见的算子

### 3. 精度优化

- **数据增强**: 训练时使用丰富的数据增强
- **预训练模型**: 基于 ImageNet 等大型数据集的预训练模型
- **模型集成**: 结合多个模型的预测结果
- **后处理**: 实现合适的后处理逻辑

## 测试和验证

### 模型测试清单

1. **基本功能**
   - [ ] 模型可以正常加载
   - [ ] 输入输出形状正确
   - [ ] 推理结果合理

2. **性能测试**
   - [ ] 推理速度满足要求
   - [ ] 内存占用合理
   - [ ] 文件大小适中

3. **兼容性测试**
   - [ ] 不同操作系统兼容
   - [ ] 不同硬件配置兼容
   - [ ] 标签文件编码正确

### 测试代码示例

```python
import numpy as np
from PIL import Image

def test_model(model_path, test_image_path):
    # 加载模型
    model = load_model(model_path)
    
    # 加载测试图像
    image = Image.open(test_image_path).convert('RGB')
    image = image.resize((224, 224))
    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)
    
    # 推理
    predictions = model.predict(image_array)
    
    # 验证输出
    assert predictions.shape[1] == num_classes
    assert np.sum(predictions) > 0.99  # 概率和接近1
    
    print("模型测试通过!")
```

## 部署建议

### 1. 模型文件组织

```
models/
├── classification/
│   ├── mobilenet_v2_lite.tflite
│   ├── mobilenet_v2_lite_labels.txt
│   └── efficientnet_lite.tflite
├── detection/
│   ├── yolov8n.onnx
│   ├── yolov8n_labels.txt
│   └── coco_ssd.pb
└── custom/
    ├── my_model.tflite
    └── my_model_labels.txt
```

### 2. 版本控制

- 模型文件使用语义化版本号
- 记录模型训练参数和数据集信息
- 维护模型变更日志

### 3. 文档要求

为每个模型提供：
- 模型说明文档
- 输入输出规范
- 性能基准测试结果
- 使用示例

## 贡献指南

### 提交模型

1. **Fork 项目仓库**
2. **添加模型文件**到适当目录
3. **编写模型文档**
4. **添加测试用例**
5. **提交 Pull Request**

### Pull Request 要求

- 包含完整的模型文件和标签文件
- 提供详细的模型说明
- 通过所有测试用例
- 遵循代码风格规范

## 常见问题

### Q: 支持哪些图像预处理方式？
A: 当前支持基本的缩放和归一化。复杂的预处理需要在模型内部实现。

### Q: 如何处理动态输入尺寸？
A: TensorFlow Lite 和 ONNX 都支持动态输入，但建议使用固定尺寸以获得更好的性能。

### Q: 是否支持 GPU 加速？
A: 当前主要支持 CPU 推理，GPU 支持在开发中。

### Q: 如何调试模型推理问题？
A: 可以启用详细日志模式，查看输入输出的详细信息。

## 联系方式

- **项目仓库**: https://github.com/your-repo/pixuli
- **问题反馈**: 通过 GitHub Issues
- **技术讨论**: 项目 Discussions 区域

---

感谢您为 Pixuli 项目贡献 AI 模型！ 🤖
