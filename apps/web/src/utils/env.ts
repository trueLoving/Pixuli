// 演示环境工具函数

export interface DemoConfig {
  version: string
  platform: string
  timestamp: string
  config: {
    owner: string
    repo: string
    branch: string
    token: string
    path: string
  }
}

// 检测是否为演示环境
export function isDemoEnvironment(): boolean {
  // 检测优先级：
  // 1. 环境变量 VITE_DEMO_MODE
  // 2. URL 参数 ?demo=true
  // 3. localStorage 标记
  
  // 环境变量检测
  const envDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  
  // URL 参数检测
  const urlParams = new URLSearchParams(window.location.search)
  const urlDemoMode = urlParams.get('demo') === 'true'
  
  // localStorage 检测
  const localStorageDemo = localStorage.getItem('pixuli-demo-mode') === 'true'
  
  return envDemoMode || urlDemoMode || localStorageDemo
}

// 设置演示模式
export function setDemoMode(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('pixuli-demo-mode', 'true')
  } else {
    localStorage.removeItem('pixuli-demo-mode')
  }
}

// 获取演示配置
export function getDemoConfig(): DemoConfig {
  return {
    version: "1.0",
    platform: "web",
    timestamp: new Date().toISOString(),
    config: {
      owner: import.meta.env.VITE_DEMO_GITHUB_OWNER,
      repo: import.meta.env.VITE_DEMO_GITHUB_REPO,
      branch: import.meta.env.VITE_DEMO_GITHUB_BRANCH,
      token: import.meta.env.VITE_DEMO_GITHUB_TOKEN,
      path: import.meta.env.VITE_DEMO_GITHUB_PATH,
    }
  }
}

// 下载演示配置文件
export function downloadDemoConfig(): void {
  const demoConfig = getDemoConfig()
  const configJson = JSON.stringify(demoConfig, null, 2)
  
  const blob = new Blob([configJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = 'pixuli-github-config-demo.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// 从文件导入配置
export function importConfigFromFile(file: File): Promise<DemoConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const config = JSON.parse(content) as DemoConfig
        
        // 验证配置格式
        if (!config.config || !config.config.owner || !config.config.repo) {
          throw new Error('配置文件格式不正确')
        }
        
        resolve(config)
      } catch (error) {
        reject(new Error('配置文件解析失败: ' + (error instanceof Error ? error.message : '未知错误')))
      }
    }
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    reader.readAsText(file)
  })
}

// 获取应用配置信息
export function getAppConfig() {
  return {
    name: import.meta.env.VITE_APP_NAME || "Pixuli",
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
    description: import.meta.env.VITE_APP_DESCRIPTION || "专业的图片管理与存储解决方案"
  }
}

// 检查环境变量是否已配置
export function isEnvConfigured(): boolean {
  return !!(
    import.meta.env.VITE_DEMO_MODE &&
    import.meta.env.VITE_DEMO_GITHUB_OWNER &&
    import.meta.env.VITE_DEMO_GITHUB_REPO &&
    import.meta.env.VITE_DEMO_GITHUB_TOKEN
  )
}
