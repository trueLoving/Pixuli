import React, { useEffect } from 'react';
import { BrandPixelMark } from '@/ui/brand/BrandPixelMark';
import './FullScreenLoading.css';

export interface FullScreenLoadingProps {
  /** 是否显示 */
  visible: boolean;
  /** 加载文本 */
  text?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  visible,
  text,
}) => {
  useEffect(() => {
    if (visible) {
      document.body.classList.add('fullscreen-loading-active');
    } else {
      document.body.classList.remove('fullscreen-loading-active');
    }
    return () => {
      document.body.classList.remove('fullscreen-loading-active');
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fullscreen-loading"
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      <div className="fullscreen-loading-content">
        <div
          className="fullscreen-loading-spinner"
          role="status"
          aria-label={text || 'Loading'}
        >
          <BrandPixelMark variant="loading" size={112} />
        </div>
        {text ? <p className="fullscreen-loading-text">{text}</p> : null}
      </div>
    </div>
  );
};

export default FullScreenLoading;
