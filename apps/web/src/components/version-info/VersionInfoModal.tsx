import React, { useState } from 'react';
import {
  Info,
  X,
  Package,
  Calendar,
  Code,
  GitBranch,
  Hash,
} from 'lucide-react';

// 使用注入的版本信息
const versionInfo = __VERSION_INFO__;

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

const VersionInfoModal: React.FC<VersionInfoModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'frameworks' | 'dependencies'
  >('basic');

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatVersion = (version: string) => {
    return version.replace(/[\^~]/, '');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('version.title')}
              </h2>
              <p className="text-sm text-gray-500">{t('version.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              {t('version.tabs.basic')}
            </button>
            <button
              onClick={() => setActiveTab('frameworks')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'frameworks'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-4 h-4 inline mr-2" />
              {t('version.tabs.frameworks')}
            </button>
            <button
              onClick={() => setActiveTab('dependencies')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dependencies'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              {t('version.tabs.dependencies')}
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {t('version.basic.name')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{versionInfo.name}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">
                        {t('version.basic.version')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">
                      {versionInfo.version}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-900">
                        {t('version.basic.buildTime')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(versionInfo.buildTime)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <GitBranch className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-gray-900">
                        {t('version.basic.branch')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">
                      {versionInfo.git.branch}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="w-4 h-4 text-cyan-600" />
                      <span className="font-medium text-gray-900">Commit</span>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">
                      {versionInfo.git.commit}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      {t('version.basic.description')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {versionInfo.description}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'frameworks' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(versionInfo.frameworks).map(
                    ([name, version]) => (
                      <div key={name} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 capitalize">
                            {name}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {formatVersion(version as string)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(versionInfo.dependencies).map(
                    ([name, version]) => (
                      <div key={name} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">
                              {name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600 font-mono">
                            {formatVersion(version as string)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {t('version.dependencies.note')}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {t('version.dependencies.description')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            {t('version.footer.generated')}: {formatDate(versionInfo.buildTime)}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionInfoModal;
