import React from 'react'
import { Brain, Zap, Globe, Settings } from 'lucide-react'

export type AIServiceType = 'tensorflow' | 'gguf-native' | 'gguf-web'

export interface ServiceSelectorProps {
  selectedService: AIServiceType
  onServiceChange: (service: AIServiceType) => void
  disabled?: boolean
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onServiceChange,
  disabled = false
}) => {
  const services = [
    {
      id: 'tensorflow' as const,
      name: 'TensorFlow.js',
      description: '基于浏览器的轻量级AI模型',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
      features: ['快速启动', '无需下载', '兼容性好']
    },
    {
      id: 'gguf-native' as const,
      name: 'GGUF 原生',
      description: '高性能本地GGUF模型',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      features: ['性能最佳', '本地处理', '需要模型文件']
    },
    {
      id: 'gguf-web' as const,
      name: 'GGUF Web',
      description: '基于Web Worker的GGUF服务',
      icon: Globe,
      color: 'from-green-500 to-emerald-500',
      features: ['后台处理', '不阻塞UI', '兼容性好']
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">选择AI服务</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = service.icon
          const isSelected = selectedService === service.id
          
          return (
            <div
              key={service.id}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onServiceChange(service.id)}
            >
              {/* 选中指示器 */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
              
              {/* 服务图标 */}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${service.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* 服务名称 */}
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {service.name}
              </h4>
              
              {/* 服务描述 */}
              <p className="text-sm text-gray-600 mb-3">
                {service.description}
              </p>
              
              {/* 特性列表 */}
              <ul className="space-y-1">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              {/* 状态指示器 */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {service.id === 'gguf-native' ? '需要模型文件' : '立即可用'}
                  </span>
                  {isSelected && (
                    <span className="text-xs text-purple-600 font-medium">
                      当前选择
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* 服务说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">服务选择说明：</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>TensorFlow.js</strong>: 适合快速测试和演示，无需额外配置</li>
              <li>• <strong>GGUF 原生</strong>: 性能最佳，但需要本地模型文件和依赖安装</li>
              <li>• <strong>GGUF Web</strong>: 平衡性能和兼容性，推荐用于生产环境</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 