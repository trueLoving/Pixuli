import { Github, X } from 'lucide-react';
import React from 'react';

interface SourceTypeMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'github' | 'gitee') => void;
  t: (key: string) => string;
}

export const SourceTypeMenu: React.FC<SourceTypeMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('sidebar.selectSourceType')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <button
            onClick={() => onSelect('github')}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition-colors">
              <Github size={24} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">GitHub</div>
              <div className="text-sm text-gray-500">
                {t('sidebar.githubDescription')}
              </div>
            </div>
          </button>
          <button
            onClick={() => onSelect('gitee')}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all group"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors">
              <span className="text-white font-bold text-sm">码</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Gitee</div>
              <div className="text-sm text-gray-500">
                {t('sidebar.giteeDescription')}
              </div>
            </div>
          </button>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
