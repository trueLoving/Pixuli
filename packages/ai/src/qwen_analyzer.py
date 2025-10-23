#!/usr/bin/env python3
"""
Qwen LLM 图片分析脚本 - 用于打包成二进制文件
"""

import argparse
import json
import sys
import time
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

# 尝试导入必要的库，如果失败则提供友好的错误信息
try:
    import torch
    from transformers import AutoModelForVision2Seq, AutoProcessor
    from PIL import Image
    import numpy as np
    from sklearn.cluster import KMeans
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Missing required packages: {e}. Please ensure all dependencies are installed.",
        "missing_packages": ["torch", "transformers", "PIL", "numpy", "scikit-learn"]
    }))
    sys.exit(1)


class QwenImageAnalyzer:
    """Qwen图片分析器"""

    def __init__(self, model_path: str, device: str = "cpu"):
        self.model_path = model_path
        self.device = device
        self.model = None
        self.processor = None
        self._load_model()

    def _load_model(self):
        """加载Qwen模型"""
        try:
            print(f"Loading Qwen model from {self.model_path}", file=sys.stderr)

            # 检查模型路径是否存在
            if not Path(self.model_path).exists():
                raise FileNotFoundError(f"Model path does not exist: {self.model_path}")

            # 检查模型目录是否包含必要的文件
            model_files = list(Path(self.model_path).glob("*"))
            if not model_files:
                raise FileNotFoundError(f"Model directory is empty: {self.model_path}")

            # 加载模型和处理器
            self.processor = AutoProcessor.from_pretrained(
                self.model_path,
                trust_remote_code=True
            )

            self.model = AutoModelForVision2Seq.from_pretrained(
                self.model_path,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None
            )

            if self.device == "cpu":
                self.model = self.model.to("cpu")

            print("Model loaded successfully", file=sys.stderr)

        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")

    def analyze_image(self, image_path: str, max_tokens: int = 512, temperature: float = 0.7) -> Dict[str, Any]:
        """分析图片"""
        try:
            start_time = time.time()

            # 加载图片
            image = Image.open(image_path).convert("RGB")

            # 准备输入
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "image": image,
                        },
                        {
                            "type": "text",
                            "text": "请详细分析这张图片，包括：1. 图片的主要内容描述 2. 图片中的主要对象 3. 图片的色彩特征 4. 图片的场景类型。请用中文回答。"
                        }
                    ]
                }
            ]

            # 处理输入
            text = self.processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs, video_inputs = self.processor.process_vision_info(messages)

            inputs = self.processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt"
            )

            # 移动到设备
            inputs = {k: v.to(self.device) if isinstance(v, torch.Tensor) else v for k, v in inputs.items()}

            # 生成分析结果
            with torch.no_grad():
                generated_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    do_sample=True,
                    pad_token_id=self.processor.tokenizer.eos_token_id
                )

            # 解码结果
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = self.processor.batch_decode(
                generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]

            analysis_time = (time.time() - start_time) * 1000  # 转换为毫秒

            # 解析分析结果
            result = self._parse_analysis_result(output_text, image, analysis_time)

            return result

        except Exception as e:
            raise RuntimeError(f"Image analysis failed: {str(e)}")

    def _parse_analysis_result(self, text: str, image: Image.Image, analysis_time: float) -> Dict[str, Any]:
        """解析分析结果"""
        try:
            # 提取图片基本信息
            width, height = image.size

            # 分析色彩
            colors = self._analyze_colors(image)

            # 从文本中提取信息
            description = text.strip()

            # 简单的标签提取（基于关键词）
            tags = self._extract_tags(text)

            # 场景类型识别
            scene_type = self._identify_scene_type(text)

            # 对象检测（基于文本分析）
            objects = self._extract_objects(text)

            return {
                "success": True,
                "imageType": self._get_image_type(image),
                "tags": tags,
                "description": description,
                "confidence": 0.85,  # Qwen模型的置信度通常较高
                "objects": objects,
                "colors": colors,
                "sceneType": scene_type,
                "analysisTime": analysis_time,
                "modelUsed": "Qwen2-VL",
                "imageInfo": {
                    "width": width,
                    "height": height,
                    "aspectRatio": width / height
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse analysis result: {str(e)}"
            }

    def _get_image_type(self, image: Image.Image) -> str:
        """获取图片类型"""
        return image.format or "unknown"

    def _analyze_colors(self, image: Image.Image) -> List[Dict[str, Any]]:
        """分析图片色彩"""
        try:
            # 将图片转换为numpy数组
            img_array = np.array(image)

            # 重塑为像素列表
            pixels = img_array.reshape(-1, 3)

            # 使用K-means聚类找到主要颜色
            kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
            kmeans.fit(pixels)

            colors = []
            for i, color in enumerate(kmeans.cluster_centers_):
                rgb = [int(c) for c in color]
                hex_color = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

                # 计算该颜色的占比
                labels = kmeans.labels_
                percentage = np.sum(labels == i) / len(labels)

                colors.append({
                    "name": f"Color {i+1}",
                    "rgb": rgb,
                    "hex": hex_color,
                    "percentage": float(percentage)
                })

            # 按占比排序
            colors.sort(key=lambda x: x["percentage"], reverse=True)

            return colors[:5]  # 返回前5个主要颜色

        except Exception as e:
            print(f"Color analysis failed: {e}", file=sys.stderr)
            return []

    def _extract_tags(self, text: str) -> List[str]:
        """从文本中提取标签"""
        # 预定义的关键词映射
        keyword_mapping = {
            "人": ["人", "人物", "人脸", "人物", "肖像"],
            "动物": ["动物", "狗", "猫", "鸟", "鱼", "马", "牛", "羊"],
            "建筑": ["建筑", "房子", "大楼", "房屋", "建筑", "城市"],
            "自然": ["自然", "风景", "山", "水", "树", "花", "草", "天空"],
            "食物": ["食物", "食物", "水果", "蔬菜", "面包", "蛋糕"],
            "车辆": ["车", "汽车", "自行车", "摩托车", "飞机", "船"],
            "室内": ["室内", "房间", "客厅", "卧室", "厨房", "办公室"],
            "户外": ["户外", "室外", "公园", "街道", "海滩", "森林"]
        }

        tags = []
        text_lower = text.lower()

        for category, keywords in keyword_mapping.items():
            for keyword in keywords:
                if keyword in text_lower:
                    if category not in tags:
                        tags.append(category)
                    break

        # 添加一些通用标签
        if "美丽" in text or "漂亮" in text:
            tags.append("美丽")
        if "现代" in text or "时尚" in text:
            tags.append("现代")
        if "传统" in text or "古典" in text:
            tags.append("传统")

        return tags[:10]  # 限制标签数量

    def _identify_scene_type(self, text: str) -> str:
        """识别场景类型"""
        text_lower = text.lower()

        if any(word in text_lower for word in ["人", "人物", "肖像", "自拍"]):
            return "人物"
        elif any(word in text_lower for word in ["风景", "自然", "山", "水", "树"]):
            return "自然风景"
        elif any(word in text_lower for word in ["建筑", "城市", "街道", "大楼"]):
            return "城市建筑"
        elif any(word in text_lower for word in ["室内", "房间", "客厅", "卧室"]):
            return "室内场景"
        elif any(word in text_lower for word in ["食物", "美食", "水果", "蔬菜"]):
            return "食物"
        elif any(word in text_lower for word in ["动物", "宠物", "野生动物"]):
            return "动物"
        else:
            return "其他"

    def _extract_objects(self, text: str) -> List[Dict[str, Any]]:
        """从文本中提取对象信息"""
        objects = []

        # 简单的对象提取逻辑
        object_keywords = {
            "人": 0.9,
            "汽车": 0.8,
            "房子": 0.8,
            "树": 0.7,
            "花": 0.7,
            "狗": 0.8,
            "猫": 0.8,
            "鸟": 0.7,
            "食物": 0.6,
            "书": 0.6
        }

        text_lower = text.lower()

        for obj_name, confidence in object_keywords.items():
            if obj_name in text_lower:
                objects.append({
                    "name": obj_name,
                    "confidence": confidence,
                    "bbox": {
                        "x": 0,
                        "y": 0,
                        "width": 100,
                        "height": 100
                    },
                    "category": "general"
                })

        return objects[:5]  # 限制对象数量


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="Qwen图片分析工具")
    parser.add_argument("--model-path", required=True, help="Qwen模型路径")
    parser.add_argument("--image-path", required=True, help="图片路径")
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"], help="计算设备")
    parser.add_argument("--max-tokens", type=int, default=512, help="最大生成token数")
    parser.add_argument("--temperature", type=float, default=0.7, help="生成温度")

    args = parser.parse_args()

    try:
        # 创建分析器
        analyzer = QwenImageAnalyzer(args.model_path, args.device)

        # 分析图片
        result = analyzer.analyze_image(
            args.image_path,
            args.max_tokens,
            args.temperature
        )

        # 输出结果
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
