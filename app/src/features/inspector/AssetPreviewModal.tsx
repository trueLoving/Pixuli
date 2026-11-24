import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { defaultTranslate } from '@/i18n/locales';
import { getAssetKind } from '@/features/library/utils/assetKind';
import { AssetItem } from '@pixuli/core/types';
import { KindPreviewHost } from './KindPreviewHost';
import { useResolvedAssetUrl } from './useResolvedAssetUrl';
import './AssetPreviewModal.css';

interface AssetPreviewModalProps {
  asset: AssetItem | null;
  assets: AssetItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  formatFileSize?: (size: number) => string;
  t?: (key: string) => string;
}

const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({
  asset,
  assets,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
  t,
}) => {
  const translate = t || defaultTranslate;
  const src = useResolvedAssetUrl(asset);
  const kind = asset ? getAssetKind(asset) : 'other';

  const handlePrevious = useCallback(() => {
    if (onNavigate && assets.length > 1) {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : assets.length - 1;
      onNavigate(prevIndex);
    }
  }, [onNavigate, currentIndex, assets.length]);

  const handleNext = useCallback(() => {
    if (onNavigate && assets.length > 1) {
      const nextIndex = currentIndex < assets.length - 1 ? currentIndex + 1 : 0;
      onNavigate(nextIndex);
    }
  }, [onNavigate, currentIndex, assets.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          event.stopImmediatePropagation();
          handlePrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          event.stopImmediatePropagation();
          handleNext();
          break;
        case 'Escape':
          event.preventDefault();
          event.stopImmediatePropagation();
          onClose();
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'Enter':
        case 'e':
        case 'E':
        case 's':
        case 'S':
          // 吞掉库级快捷键，避免预览下穿透出编辑/换选等弹层
          event.preventDefault();
          event.stopImmediatePropagation();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, handlePrevious, handleNext, onClose]);

  if (!isOpen || !asset) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getAssetDimensions = () => {
    if (asset.width > 0 && asset.height > 0) {
      return `${asset.width} × ${asset.height}`;
    }
    return translate('image.grid.dimensionsUnknown');
  };

  return (
    <div
      className="asset-preview-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={asset.name}
    >
      <div className="asset-preview-modal-container">
        <div className="asset-preview-modal-content">
          <button
            onClick={onClose}
            className="asset-preview-modal-close"
            title={translate('common.close')}
          >
            <X className="w-5 h-5" />
          </button>

          {assets.length > 1 && (
            <button
              onClick={handlePrevious}
              className="asset-preview-modal-nav asset-preview-modal-nav-left"
              title="←"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {assets.length > 1 && (
            <button
              onClick={handleNext}
              className="asset-preview-modal-nav asset-preview-modal-nav-right"
              title="→"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <KindPreviewHost
            asset={asset}
            src={src}
            variant="modal"
            t={translate}
          />
        </div>

        <div className="asset-preview-modal-info">
          <h3 className="asset-preview-modal-title">{asset.name}</h3>

          {assets.length > 1 && (
            <div className="asset-preview-modal-counter">
              {currentIndex + 1} / {assets.length}
            </div>
          )}

          {asset.description && (
            <p className="asset-preview-modal-description">
              {asset.description}
            </p>
          )}

          <div className="asset-preview-modal-details">
            {kind === 'image' ? (
              <div className="asset-preview-modal-detail-item">
                <span>{getAssetDimensions()}</span>
              </div>
            ) : null}
            {asset.size > 0 && (
              <div className="asset-preview-modal-detail-item">
                <span>{formatFileSize(asset.size)}</span>
              </div>
            )}
            <div className="asset-preview-modal-detail-item">
              <span>{formatDate(asset.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetPreviewModal;
