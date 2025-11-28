import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';
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
  // 当 loading 显示时，禁用 body 滚动
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
        <Loader2 className="fullscreen-loading-spinner" />
        {text && <p className="fullscreen-loading-text">{text}</p>}
      </div>
    </div>
  );
};

export default FullScreenLoading;
