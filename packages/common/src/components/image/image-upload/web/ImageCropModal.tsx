// TODO: 裁剪有问题，矩阵无法拖动宽高。但是不影响上传流程。
import { Check, Crop as CropIcon, RotateCcw, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { defaultTranslate } from '../../../../locales';
import './ImageCropModal.css';

interface ImageCropModalProps {
  src: string;
  fileName: string;
  originalFile: File;
  onCropComplete: (croppedFile: File) => void | Promise<void>;
  onSkipCrop: (originalFile: File) => void | Promise<void>;
  onCancel: () => void;
  t?: (key: string) => string;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  src,
  fileName,
  originalFile,
  onCropComplete,
  onSkipCrop,
  onCancel,
  t,
  aspectRatio,
  minWidth = 50,
  minHeight = 50,
  maxWidth,
  maxHeight,
}) => {
  const translate = t || defaultTranslate;
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 图片加载完成时，设置默认裁剪区域
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;

      // 如果有宽高比要求，创建对应比例的裁剪区域
      if (aspectRatio) {
        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 90,
            },
            aspectRatio,
            width,
            height,
          ),
          width,
          height,
        );
        setCrop(crop);
      } else {
        // 自由裁剪，设置默认裁剪区域为图片中心50%
        setCrop({
          unit: '%',
          x: 25,
          y: 25,
          width: 50,
          height: 50,
        });
      }
    },
    [aspectRatio],
  );

  // 处理裁剪变化
  const onCropChange = useCallback((_: Crop, percentCrop: Crop) => {
    setCrop(percentCrop);
  }, []);

  // 处理裁剪完成
  const onCropCompleteCallback = useCallback((crop: PixelCrop, _: Crop) => {
    setCompletedCrop(crop);
  }, []);

  // 旋转图片
  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // 重置裁剪
  const resetCrop = () => {
    if (imgRef.current) {
      const { naturalWidth: width, naturalHeight: height } = imgRef.current;

      if (aspectRatio) {
        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 90,
            },
            aspectRatio,
            width,
            height,
          ),
          width,
          height,
        );
        setCrop(crop);
      } else {
        setCrop({
          unit: '%',
          x: 25,
          y: 25,
          width: 50,
          height: 50,
        });
      }
    }
    setRotation(0);
  };

  // 生成裁剪后的图片
  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    // 计算裁剪后的尺寸
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    };

    // 设置画布尺寸
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // 应用旋转
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // 绘制裁剪后的图片
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    ctx.restore();

    // 转换为 Blob
    return new Promise<File>(resolve => {
      canvas.toBlob(
        blob => {
          if (blob) {
            const croppedFile = new File([blob], fileName, {
              type: blob.type,
              lastModified: Date.now(),
            });
            resolve(croppedFile);
          }
        },
        'image/jpeg',
        0.9,
      );
    });
  }, [completedCrop, fileName, rotation]);

  // 确认裁剪
  const handleConfirm = async () => {
    try {
      const croppedFile = await generateCroppedImage();
      if (croppedFile) {
        await onCropComplete(croppedFile);
      }
    } catch (error) {
      console.error('裁剪图片时出错:', error);
    }
  };

  // 跳过裁剪，直接使用原图
  const handleSkipCrop = async () => {
    await onSkipCrop(originalFile);
  };

  return (
    <div className="image-crop-modal-overlay">
      <div className="image-crop-modal-content">
        <div className="image-crop-modal-header">
          <h2 className="image-crop-modal-title">
            {translate('image.crop.title') || '裁剪图片'}
          </h2>
          <button onClick={onCancel} className="image-crop-modal-close">
            <X className="image-crop-modal-close-icon" />
          </button>
        </div>

        <div className="image-crop-modal-body">
          {/* 图片裁剪区域 */}
          <div className="image-crop-container">
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropCompleteCallback}
              aspect={aspectRatio}
              minWidth={minWidth}
              minHeight={minHeight}
              maxWidth={maxWidth}
              maxHeight={maxHeight}
              className="image-crop-react-crop"
            >
              <img
                ref={imgRef}
                src={src}
                alt="裁剪预览"
                onLoad={onImageLoad}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                }}
                className="image-crop-image"
              />
            </ReactCrop>
          </div>

          {/* 操作按钮区域 */}
          <div className="image-crop-controls">
            <div className="image-crop-controls-group">
              <button
                onClick={rotateImage}
                className="image-crop-control-button"
                title={translate('image.crop.rotate') || '旋转'}
              >
                <RotateCcw className="image-crop-control-icon" />
                <span>{translate('image.crop.rotate') || '旋转'}</span>
              </button>

              <button
                onClick={resetCrop}
                className="image-crop-control-button"
                title={translate('image.crop.reset') || '重置'}
              >
                <CropIcon className="image-crop-control-icon" />
                <span>{translate('image.crop.reset') || '重置'}</span>
              </button>
            </div>

            <div className="image-crop-info">
              <p className="image-crop-filename">{fileName}</p>
              {completedCrop && (
                <p className="image-crop-dimensions">
                  {Math.round(completedCrop.width)} ×{' '}
                  {Math.round(completedCrop.height)} 像素
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="image-crop-modal-footer">
          <button
            onClick={onCancel}
            className="image-crop-button image-crop-button-secondary"
          >
            {translate('image.crop.cancel') || '取消'}
          </button>
          <button
            onClick={handleSkipCrop}
            className="image-crop-button image-crop-button-skip"
          >
            <span>{translate('image.crop.skip') || '跳过裁剪'}</span>
          </button>
          <button
            onClick={handleConfirm}
            className="image-crop-button image-crop-button-primary"
            disabled={!completedCrop}
          >
            <Check className="image-crop-button-icon" />
            <span>{translate('image.crop.confirm') || '确认裁剪'}</span>
          </button>
        </div>

        {/* 隐藏的画布用于生成裁剪后的图片 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ImageCropModal;
