import { UpyunConfig } from '@packages/ui/src'

const UPYUN_CONFIG_KEY = 'pixuli-upyun-config'

export const loadUpyunConfig = (): UpyunConfig | null => {
  try {
    const config = localStorage.getItem(UPYUN_CONFIG_KEY)
    return config ? JSON.parse(config) : null
  } catch (error) {
    console.error('Failed to load upyun config:', error)
    return null
  }
}

export const saveUpyunConfig = (config: UpyunConfig): void => {
  try {
    localStorage.setItem(UPYUN_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save upyun config:', error)
    throw new Error('保存又拍云配置失败')
  }
}

export const clearUpyunConfig = (): void => {
  try {
    localStorage.removeItem(UPYUN_CONFIG_KEY)
  } catch (error) {
    console.error('Failed to clear upyun config:', error)
    throw new Error('清除又拍云配置失败')
  }
}
