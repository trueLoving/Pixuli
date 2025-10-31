import { Loader2 } from 'lucide-react';
import React from 'react';

interface FullScreenLoadingProps {
  /** 是否显示 */
  visible: boolean;
  /** 加载文本 */
  text?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  visible,
  text,
}) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center"
      style={{ pointerEvents: 'auto' }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        {text && <p className="text-sm text-gray-600 font-medium">{text}</p>}
      </div>
    </div>
  );
};

export default FullScreenLoading;
