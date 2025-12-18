import { ExternalLink, X } from 'lucide-react';
import React from 'react';
import { ImageItem } from '../../../../types/image';
import { getRealGiteeUrl } from '../../../../utils/imageUtils';
import './ImageUrlModal.css';

interface ImageUrlModalProps {
  image: ImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCopyUrl?: (url: string, type: 'url' | 'githubUrl') => Promise<void>;
  onOpenUrl?: (url: string) => void;
  t: (key: string) => string;
}

const ImageUrlModal: React.FC<ImageUrlModalProps> = ({
  image,
  isOpen,
  onClose,
  onCopyUrl,
  onOpenUrl,
  t,
}) => {
  const translate = t;

  if (!isOpen || !image) {
    return null;
  }

  const getImageDimensions = () => {
    // 直接使用元数据中的尺寸
    if (image.width > 0 && image.height > 0) {
      return `${image.width} × ${image.height}`;
    }
    // 如果没有尺寸数据或尺寸数据不合法，显示暂无尺寸数据
    return translate('image.grid.dimensionsUnknown');
  };

  const handleCopyUrl = async (url: string, type: 'url' | 'githubUrl') => {
    // 对于 URL 类型，如果是 Gitee 代理 URL，转换为真实 URL
    const realUrl = type === 'url' ? getRealGiteeUrl(url) : url;
    if (onCopyUrl) {
      await onCopyUrl(realUrl, type);
    } else {
      try {
        await navigator.clipboard.writeText(realUrl);
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const handleOpenUrl = (url: string, type: 'url' | 'githubUrl' = 'url') => {
    // 对于 URL 类型，如果是 Gitee 代理 URL，转换为真实 URL
    const realUrl = type === 'url' ? getRealGiteeUrl(url) : url;
    if (onOpenUrl) {
      onOpenUrl(realUrl);
    } else {
      window.open(realUrl, '_blank');
    }
  };

  return (
    <div className="image-url-modal-overlay">
      <div className="image-url-modal-container">
        <div className="image-url-modal-header">
          <h3 className="image-url-modal-title">
            {translate('image.grid.imageUrlTitle')}
          </h3>
          <button
            onClick={onClose}
            className="image-url-modal-close"
            title={translate('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="image-url-modal-content">
          {/* 图片信息 */}
          <div className="image-url-modal-image-info">
            <img
              src={image.url}
              alt={image.name}
              className="image-url-modal-thumbnail"
            />
            <div className="image-url-modal-image-details">
              <h4 className="image-url-modal-image-name">{image.name}</h4>
              <p className="image-url-modal-image-dimensions">
                {getImageDimensions()}
              </p>
            </div>
          </div>

          {/* 图片访问地址 */}
          <div className="image-url-modal-url-section">
            <label className="image-url-modal-label">
              {translate('image.list.imageAccessUrl')}
            </label>
            <div className="image-url-modal-input-group">
              <input
                type="text"
                value={getRealGiteeUrl(image.url)}
                readOnly
                className="image-url-modal-input"
              />
              <button
                onClick={() => handleCopyUrl(image.url, 'url')}
                className="image-url-modal-button image-url-modal-button-primary"
              >
                {translate('image.grid.copy')}
              </button>
              <button
                onClick={() => handleOpenUrl(image.url)}
                className="image-url-modal-button image-url-modal-button-secondary"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{translate('image.grid.open')}</span>
              </button>
            </div>
          </div>

          {/* GitHub 地址 */}
          {image.githubUrl && (
            <div className="image-url-modal-url-section">
              <label className="image-url-modal-label">
                {translate('image.list.githubUrl')}
              </label>
              <div className="image-url-modal-input-group">
                <input
                  type="text"
                  value={image.githubUrl}
                  readOnly
                  className="image-url-modal-input"
                />
                <button
                  onClick={() => handleCopyUrl(image.githubUrl, 'githubUrl')}
                  className="image-url-modal-button image-url-modal-button-primary"
                >
                  {translate('image.grid.copy')}
                </button>
                <button
                  onClick={() => handleOpenUrl(image.githubUrl, 'githubUrl')}
                  className="image-url-modal-button image-url-modal-button-secondary"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{translate('image.grid.open')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUrlModal;
