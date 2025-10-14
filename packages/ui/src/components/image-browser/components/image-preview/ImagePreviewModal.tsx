import React from 'react'
import { ImageItem } from '../../../../types/image'
import { X, Link, ExternalLink } from 'lucide-react'
import { defaultTranslate } from '../../../../locales/defaultTranslate'
import './ImagePreviewModal.css'

interface ImagePreviewModalProps {
  image: ImageItem | null
  isOpen: boolean
  onClose: () => void
  imageDimensions?: Record<string, { width: number; height: number }>
  formatFileSize?: (size: number) => string
  onCopyUrl?: (url: string, type: 'url' | 'githubUrl') => Promise<void>
  onOpenUrl?: (url: string) => void
  t?: (key: string) => string
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  image,
  isOpen,
  onClose,
  imageDimensions = {},
  formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
  onCopyUrl,
  onOpenUrl,
  t
}) => {
  const translate = t || defaultTranslate

  if (!isOpen || !image) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getImageDimensions = () => {
    const dimensions = imageDimensions[image.id]
    if (dimensions) {
      return `${dimensions.width} × ${dimensions.height}`
    } else if (image.width > 0 && image.height > 0) {
      return `${image.width} × ${image.height}`
    } else {
      return translate('image.grid.dimensionsUnknown')
    }
  }

  const handleCopyUrl = async (url: string, type: 'url' | 'githubUrl') => {
    if (onCopyUrl) {
      await onCopyUrl(url, type)
    } else {
      try {
        await navigator.clipboard.writeText(url)
      } catch (error) {
        console.error('Failed to copy URL:', error)
      }
    }
  }

  const handleOpenUrl = (url: string) => {
    if (onOpenUrl) {
      onOpenUrl(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="image-preview-modal-overlay">
      <div className="image-preview-modal-container">
        <div className="image-preview-modal-content">
          <button
            onClick={onClose}
            className="image-preview-modal-close"
            title={translate('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
          
          <img
            src={image.url}
            alt={image.name}
            className="image-preview-modal-image"
          />
        </div>
        
        <div className="image-preview-modal-info">
          <h3 className="image-preview-modal-title">{image.name}</h3>
          
          {image.description && (
            <p className="image-preview-modal-description">{image.description}</p>
          )}
          
          <div className="image-preview-modal-details">
            <div className="image-preview-modal-detail-item">
              <span>{getImageDimensions()}</span>
            </div>
            {image.size > 0 && (
              <div className="image-preview-modal-detail-item">
                <span>{formatFileSize(image.size)}</span>
              </div>
            )}
            <div className="image-preview-modal-detail-item">
              <span>{formatDate(image.createdAt)}</span>
            </div>
          </div>
          
          {/* 在线地址操作 */}
          <div className="image-preview-modal-actions">
            <button
              onClick={() => handleCopyUrl(image.url, 'url')}
              className="image-preview-modal-action-button image-preview-modal-action-button-primary"
            >
              <Link className="w-3 h-3" />
              <span>{translate('image.grid.copyUrl')}</span>
            </button>
            <button
              onClick={() => handleOpenUrl(image.url)}
              className="image-preview-modal-action-button image-preview-modal-action-button-secondary"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{translate('image.grid.openUrl')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImagePreviewModal
