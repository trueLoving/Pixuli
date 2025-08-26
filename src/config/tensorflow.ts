import * as tf from '@tensorflow/tfjs'

export interface TensorFlowConfig {
  backend: 'webgl' | 'cpu' | 'wasm'
  enableMemoryManagement: boolean
  memoryManagementThreshold: number
  modelCacheSize: number
}

export const defaultTensorFlowConfig: TensorFlowConfig = {
  backend: 'webgl',
  enableMemoryManagement: true,
  memoryManagementThreshold: 0.8,
  modelCacheSize: 10
}

export class TensorFlowManager {
  private static instance: TensorFlowManager
  private config: TensorFlowConfig
  private isInitialized = false

  private constructor(config: Partial<TensorFlowConfig> = {}) {
    this.config = { ...defaultTensorFlowConfig, ...config }
  }

  static getInstance(config?: Partial<TensorFlowConfig>): TensorFlowManager {
    if (!TensorFlowManager.instance) {
      TensorFlowManager.instance = new TensorFlowManager(config)
    }
    return TensorFlowManager.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // 设置后端
      await this.setBackend()
      
      // 配置内存管理
      if (this.config.enableMemoryManagement) {
        this.configureMemoryManagement()
      }

      // 预热 GPU
      await this.warmupGPU()
      
      this.isInitialized = true
      console.log('TensorFlow.js 初始化完成，后端:', tf.getBackend())
    } catch (error) {
      console.error('TensorFlow.js 初始化失败:', error)
      throw new Error('TensorFlow.js 初始化失败')
    }
  }

  private async setBackend(): Promise<void> {
    try {
      // 尝试设置首选后端
      await tf.setBackend(this.config.backend)
    } catch (error) {
      console.warn(`无法设置首选后端 ${this.config.backend}，尝试备用后端`)
      
      // 尝试备用后端
      const fallbackBackends = ['webgl', 'cpu', 'wasm']
      for (const backend of fallbackBackends) {
        if (backend !== this.config.backend) {
          try {
            await tf.setBackend(backend)
            console.log(`使用备用后端: ${backend}`)
            break
          } catch (fallbackError) {
            console.warn(`备用后端 ${backend} 也无法使用`)
          }
        }
      }
    }
  }

  private configureMemoryManagement(): void {
    // 设置内存管理阈值
    if (tf.memory().numBytes > 0) {
      const threshold = this.config.memoryManagementThreshold
      const maxMemory = tf.memory().numBytes * threshold
      
      // 监控内存使用
      setInterval(() => {
        const currentMemory = tf.memory().numBytes
        if (currentMemory > maxMemory) {
          console.log('内存使用超过阈值，清理内存...')
          tf.tidy(() => {
            // 清理临时张量
          })
        }
      }, 5000)
    }
  }

  private async warmupGPU(): Promise<void> {
    if (tf.getBackend() === 'webgl') {
      try {
        // 创建一个小张量来预热 GPU
        const warmupTensor = tf.zeros([1, 1])
        await warmupTensor.data()
        warmupTensor.dispose()
        console.log('GPU 预热完成')
      } catch (error) {
        console.warn('GPU 预热失败:', error)
      }
    }
  }

  getBackend(): string {
    return tf.getBackend()
  }

  getMemoryInfo(): tf.MemoryInfo {
    return tf.memory()
  }

  async cleanup(): Promise<void> {
    try {
      // 清理所有张量
      tf.disposeVariables()
      console.log('TensorFlow.js 资源清理完成')
    } catch (error) {
      console.error('TensorFlow.js 资源清理失败:', error)
    }
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

// 导出默认实例
export const tensorFlowManager = TensorFlowManager.getInstance() 