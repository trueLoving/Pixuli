import React from 'react'
import { X, Keyboard, Command, RefreshCw, Zap } from 'lucide-react'
import { defaultTranslate } from '../../locales/defaultTranslate'

interface KeyboardShortcut {
  description: string
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
}

interface ShortcutCategory {
  name: string
  shortcuts: KeyboardShortcut[]
}

interface KeyboardHelpModalProps {
  isOpen: boolean
  onClose: () => void
  categories: ShortcutCategory[]
  t?: (key: string) => string
}

const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ isOpen, onClose, categories, t }) => {
  if (!isOpen) return null

  // 使用传入的翻译函数或默认中文翻译函数
  const translate = t || defaultTranslate

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case translate('keyboard.categories.general'):
        return <Command className="w-5 h-5" />
      case translate('keyboard.categories.features'):
        return <Zap className="w-5 h-5" />
      case translate('keyboard.categories.browsing'):
        return <RefreshCw className="w-5 h-5" />
      default:
        return <Command className="w-5 h-5" />
    }
  }

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = []
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.shiftKey) parts.push('Shift')
    if (shortcut.metaKey) parts.push('Cmd')
    parts.push(shortcut.key)
    return parts.join(' + ')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Keyboard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{translate('keyboard.title')}</h2>
              <p className="text-sm text-gray-500">{translate('keyboard.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.name} className="space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
                  {getCategoryIcon(category.name)}
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {formatShortcut(shortcut).split(' + ').map((part, partIndex) => (
                          <React.Fragment key={partIndex}>
                            <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
                              {part}
                            </kbd>
                            {partIndex < formatShortcut(shortcut).split(' + ').length - 1 && (
                              <span className="text-gray-400">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 使用提示 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">{translate('keyboard.usageTips.title')}</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{translate('keyboard.usageTips.tip1')}</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{translate('keyboard.usageTips.tip2')}</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{translate('keyboard.usageTips.tip3')}</span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <span>{translate('keyboard.usageTips.tip4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeyboardHelpModal
