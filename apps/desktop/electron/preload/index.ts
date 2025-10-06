import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Expose GitHub API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  githubUpload: (params: any) => ipcRenderer.invoke('github:upload', params),
  githubDelete: (params: any) => ipcRenderer.invoke('github:delete', params),
  githubGetList: (params: any) => ipcRenderer.invoke('github:getList', params),
  githubUpdateMetadata: (params: any) => ipcRenderer.invoke('github:updateMetadata', params),
  githubSetAuth: (token: string) => ipcRenderer.invoke('github:setAuth', token),
})

// --------- Expose WASM API to the Renderer process ---------
contextBridge.exposeInMainWorld('wasmAPI', {
  plus100: (input: number) => ipcRenderer.invoke('wasm:plus100', input),
  compressToWebp: (imageData: number[], options?: any) => ipcRenderer.invoke('wasm:compress-to-webp', imageData, options),
  batchCompressToWebp: (imagesData: number[][], options?: any) => ipcRenderer.invoke('wasm:batch-compress-to-webp', imagesData, options),
  getImageInfo: (imageData: number[]) => ipcRenderer.invoke('wasm:get-image-info', imageData),
  convertImageFormat: (imageData: number[], options: any) => ipcRenderer.invoke('wasm:convert-image-format', imageData, options),
  batchConvertImageFormat: (imagesData: number[][], options: any) => ipcRenderer.invoke('wasm:batch-convert-image-format', imagesData, options),
})

// --------- Expose AI API to the Renderer process ---------
contextBridge.exposeInMainWorld('aiAPI', {
  analyzeImage: (request: any) => ipcRenderer.invoke('ai:analyze-image', request),
  analyzeImageWithTensorFlow: (request: any) => ipcRenderer.invoke('ai:analyze-image-tensorflow', request),
  analyzeImageWithTensorFlowLite: (request: any) => ipcRenderer.invoke('ai:analyze-image-tensorflow-lite', request),
  getModels: () => ipcRenderer.invoke('ai:get-models'),
  addModel: (config: any) => ipcRenderer.invoke('ai:add-model', config),
  removeModel: (modelId: string) => ipcRenderer.invoke('ai:remove-model', modelId),
  updateModel: (modelId: string, updates: any) => ipcRenderer.invoke('ai:update-model', modelId, updates),
  checkModel: (modelId: string) => ipcRenderer.invoke('ai:check-model', modelId),
  downloadTensorFlowModel: (modelId: string, modelUrl: string) => ipcRenderer.invoke('ai:download-tensorflow-model', modelId, modelUrl),
  selectModelFile: () => ipcRenderer.invoke('ai:select-model-file'),
})

// --------- Expose Model Download API to the Renderer process ---------
contextBridge.exposeInMainWorld('modelAPI', {
  downloadModel: (modelId: string) => ipcRenderer.invoke('model:download', modelId),
  getDownloadProgress: (modelId: string) => ipcRenderer.invoke('model:download-progress', modelId),
  getAvailableModels: () => ipcRenderer.invoke('model:available-models'),
  checkDownloaded: (modelId: string) => ipcRenderer.invoke('model:check-downloaded', modelId),
})

// --------- Expose Buffer API to the Renderer process ---------
contextBridge.exposeInMainWorld('Buffer', {
  from: (data: ArrayBuffer) => Buffer.from(data),
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * 轻小说、动漫风格的预加载动画
 * 使用高级动漫风格加载器
 */
function useLoading() {
  const className = `anime-loading`
  const styleContent = `

/* 樱花飘落动画 - 优化性能 */
@keyframes sakura-fall {
  0% {
    transform: translate3d(0, -100vh, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(0, 100vh, 0) rotate(360deg);
    opacity: 0;
  }
}

/* 粒子浮动动画 - 优化性能 */
@keyframes particle-float {
  0% {
    transform: translate3d(0, 100vh, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate3d(50px, -100vh, 0) rotate(360deg);
    opacity: 0;
  }
}

/* 角色呼吸动画 - 优化性能 */
@keyframes character-breathe {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
  50% { transform: translate3d(0, 0, 0) scale(1.05) rotate(1deg); }
}

/* 眼睛闪烁动画 - 优化性能 */
@keyframes eye-blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

/* 文字发光动画 - 优化性能 */
@keyframes text-glow {
  0%, 100% { 
    text-shadow: 0 3px 15px rgba(0, 0, 0, 0.4);
    filter: brightness(1);
  }
  50% { 
    text-shadow: 0 3px 25px rgba(255, 255, 255, 0.3);
    filter: brightness(1.1);
  }
}

/* 文字浮动动画 - 优化性能 */
@keyframes text-float {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -5px, 0); }
}

/* 点脉冲动画 - 优化性能 */
@keyframes dot-pulse {
  0%, 100% { 
    transform: translate3d(0, 0, 0) scale(1); 
    opacity: 1; 
  }
  50% { 
    transform: translate3d(0, 0, 0) scale(1.3); 
    opacity: 0.7; 
  }
}

.${className} {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255, 182, 193, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 192, 203, 0.4) 0%, transparent 50%);
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 确保完全遮挡后面的内容 */
.${className} * {
  box-sizing: border-box;
}

/* 当加载动画显示时隐藏页面内容 */
body.anime-loading-active {
  overflow: hidden !important;
}

body.anime-loading-active > *:not(.anime-loading) {
  visibility: hidden !important;
}

/* 遮罩层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  z-index: 1;
  opacity: 0.95;
}

/* 粒子效果 - 优化性能 */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: particle-float 6s linear infinite;
  pointer-events: none;
  z-index: 2;
  will-change: transform, opacity;
  transform: translate3d(0, 0, 0);
}

/* 樱花容器 */
.sakura-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

/* 樱花花瓣 - 优化性能 */
.sakura-petal {
  position: absolute;
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, #ffb6c1, #ffc0cb);
  border-radius: 50% 0;
  animation: sakura-fall 8s linear infinite;
  opacity: 0.8;
  will-change: transform, opacity;
  transform: translate3d(0, 0, 0);
}

.sakura-petal:nth-child(odd) {
  background: linear-gradient(45deg, #ffc0cb, #ffb6c1);
  animation-duration: 10s;
}

.sakura-petal:nth-child(3n) {
  background: linear-gradient(45deg, #ffd1dc, #ffb6c1);
  animation-duration: 12s;
}

/* 主加载区域 */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  text-align: center;
  position: relative;
}

/* 可爱角色 - 优化性能 */
.anime-character {
  width: 140px;
  height: 140px;
  margin-bottom: 30px;
  position: relative;
  animation: character-breathe 4s ease-in-out infinite;
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

.character-face {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.character-eyes {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 25px;
}

.eye {
  width: 14px;
  height: 14px;
  background: #2d3436;
  border-radius: 50%;
  animation: eye-blink 3s ease-in-out infinite;
}

.eye:nth-child(2) {
  animation-delay: 0.5s;
}

.character-mouth {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 10px;
  border: 2px solid #2d3436;
  border-top: none;
  border-radius: 0 0 20px 20px;
}

.character-blush {
  position: absolute;
  top: 45%;
  width: 18px;
  height: 10px;
  background: linear-gradient(45deg, #ff7675, #fd79a8);
  border-radius: 50%;
  opacity: 0.7;
  animation: blush-pulse 2s ease-in-out infinite;
}

.character-blush.left-blush {
  left: 12%;
}

.character-blush.right-blush {
  right: 12%;
}

@keyframes blush-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 头发 */
.character-hair {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 60%;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  border-radius: 50% 50% 0 0;
  z-index: -1;
  animation: hair-wave 3s ease-in-out infinite;
}

@keyframes hair-wave {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  50% { transform: translateX(-50%) rotate(2deg); }
}

/* 配饰 */
.character-accessory {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: #ffd700;
  border-radius: 50%;
  animation: accessory-spin 4s linear infinite;
}

@keyframes accessory-spin {
  0% { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(360deg); }
}

/* 加载文字 */
.loading-text {
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 15px;
  text-shadow: 0 3px 15px rgba(0, 0, 0, 0.4);
  animation: text-glow 2s ease-in-out infinite;
}

.loading-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  font-weight: 400;
  margin-bottom: 40px;
  animation: text-float 3s ease-in-out infinite;
}

/* 加载动画 */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
}

.spinner-dot {
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  animation: dot-pulse 1.8s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.spinner-dot:nth-child(2) {
  animation-delay: 0.3s;
}

.spinner-dot:nth-child(3) {
  animation-delay: 0.6s;
}

/* 进度条 */
.progress-container {
  width: 250px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff7675, #fd79a8, #a29bfe, #74b9ff);
  border-radius: 3px;
  width: 0%;
  transition: width 0.4s ease;
  box-shadow: 0 0 10px rgba(255, 118, 117, 0.5);
}

/* 装饰星星 */
.decorative-star {
  position: absolute;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  animation: twinkle 3s ease-in-out infinite;
  z-index: 3;
}

.decorative-star:nth-child(1) {
  top: 20%;
  left: 15%;
  animation-delay: 0s;
}

.decorative-star:nth-child(2) {
  top: 30%;
  right: 20%;
  animation-delay: 1s;
}

.decorative-star:nth-child(3) {
  bottom: 25%;
  left: 25%;
  animation-delay: 2s;
}

.decorative-star:nth-child(4) {
  bottom: 35%;
  right: 15%;
  animation-delay: 0.5s;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .anime-character {
    width: 100px;
    height: 100px;
  }
  
  .loading-text {
    font-size: 24px;
  }
  
  .loading-subtitle {
    font-size: 16px;
  }
  
  .progress-container {
    width: 200px;
  }
}
    `
  
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = className
  
  // 创建樱花花瓣
  const createSakuraPetal = () => {
    const petal = document.createElement('div')
    petal.className = 'sakura-petal'
    petal.style.left = Math.random() * 100 + '%'
    petal.style.animationDelay = Math.random() * 8 + 's'
    petal.style.animationDuration = (8 + Math.random() * 4) + 's'
    return petal
  }

  // 创建粒子
  const createParticle = () => {
    const particle = document.createElement('div')
    particle.className = 'particle'
    particle.style.left = Math.random() * 100 + '%'
    particle.style.animationDelay = Math.random() * 5 + 's'
    particle.style.animationDuration = (3 + Math.random() * 4) + 's'
    return particle
  }

  // 创建樱花容器 - 优化性能，减少花瓣数量
  const sakuraContainer = document.createElement('div')
  sakuraContainer.className = 'sakura-container'
  for (let i = 0; i < 10; i++) {
    sakuraContainer.appendChild(createSakuraPetal())
  }

  // 创建粒子容器 - 优化性能，减少粒子数量
  const particleContainer = document.createElement('div')
  particleContainer.className = 'particle-container'
  for (let i = 0; i < 12; i++) {
    particleContainer.appendChild(createParticle())
  }

  // 创建主内容
  oDiv.innerHTML = `
    <div class="loading-overlay"></div>
    ${sakuraContainer.outerHTML}
    ${particleContainer.outerHTML}
    <div class="loading-content">
      <div class="anime-character">
        <div class="character-face">
          <div class="character-eyes">
            <div class="eye"></div>
            <div class="eye"></div>
          </div>
          <div class="character-mouth"></div>
          <div class="character-blush left-blush"></div>
          <div class="character-blush right-blush"></div>
          <div class="character-hair"></div>
          <div class="character-accessory"></div>
        </div>
      </div>
      <div class="loading-text">Pixuli</div>
      <div class="loading-subtitle">画像管理アプリケーション</div>
      <div class="loading-spinner">
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
    </div>
    <div class="decorative-star">✨</div>
    <div class="decorative-star">⭐</div>
    <div class="decorative-star">✨</div>
    <div class="decorative-star">⭐</div>
  `

  // 智能加载进度 - 优化性能
  const updateProgress = () => {
    const progressBar = oDiv.querySelector('#progress-bar') as HTMLElement
    if (progressBar) {
      let progress = 0
      const targetProgress = 100
      const updateInterval = 100 // 减少更新频率
      
      const animateProgress = () => {
        if (progress < targetProgress) {
          // 使用更平滑的进度增长
          const increment = Math.min(
            Math.random() * 8 + 2, // 减少随机性
            targetProgress - progress
          )
          progress += increment
          progressBar.style.width = Math.min(progress, targetProgress) + '%'
          
          // 使用requestAnimationFrame优化性能
          requestAnimationFrame(animateProgress)
        }
      }
      
      // 延迟开始动画，让用户看到初始状态
      setTimeout(animateProgress, 200)
    }
  }

  return {
    appendLoading() {
      // 添加CSS类来隐藏页面内容
      document.body.classList.add('anime-loading-active')
      
      // 添加加载动画
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
      
      updateProgress()
    },
    removeLoading() {
      // 移除CSS类恢复页面内容
      document.body.classList.remove('anime-loading-active')
      
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)