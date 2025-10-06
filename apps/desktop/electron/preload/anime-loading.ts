/**
 * 高级动漫风格预加载动画
 * 包含多种角色、粒子效果、音效提示等
 */

export interface AnimeLoadingConfig {
  characterType?: 'kawaii' | 'moe' | 'cool' | 'mysterious'
  theme?: 'sakura' | 'ocean' | 'space' | 'forest'
  showProgress?: boolean
  showParticles?: boolean
  enableSound?: boolean
  duration?: number
}

export class AnimeLoading {
  private config: Required<AnimeLoadingConfig>
  private container: HTMLElement | null = null
  private style: HTMLElement | null = null
  private progressBar: HTMLElement | null = null
  private character: HTMLElement | null = null
  private particles: HTMLElement[] = []
  private animationId: number | null = null

  constructor(config: AnimeLoadingConfig = {}) {
    this.config = {
      characterType: config.characterType || 'kawaii',
      theme: config.theme || 'sakura',
      showProgress: config.showProgress !== false,
      showParticles: config.showParticles !== false,
      enableSound: config.enableSound || false,
      duration: config.duration || 5000
    }
  }

  private getCharacterHTML(): string {
    const characters = {
      kawaii: `
        <div class="character-face kawaii">
          <div class="character-eyes">
            <div class="eye left-eye"></div>
            <div class="eye right-eye"></div>
          </div>
          <div class="character-mouth kawaii-mouth"></div>
          <div class="character-blush left-blush"></div>
          <div class="character-blush right-blush"></div>
          <div class="character-hair"></div>
        </div>
      `,
      moe: `
        <div class="character-face moe">
          <div class="character-eyes">
            <div class="eye left-eye sparkle"></div>
            <div class="eye right-eye sparkle"></div>
          </div>
          <div class="character-mouth moe-mouth"></div>
          <div class="character-blush left-blush"></div>
          <div class="character-blush right-blush"></div>
          <div class="character-hair moe-hair"></div>
          <div class="character-accessory"></div>
        </div>
      `,
      cool: `
        <div class="character-face cool">
          <div class="character-eyes">
            <div class="eye left-eye cool-eye"></div>
            <div class="eye right-eye cool-eye"></div>
          </div>
          <div class="character-mouth cool-mouth"></div>
          <div class="character-hair cool-hair"></div>
          <div class="character-accessory cool-accessory"></div>
        </div>
      `,
      mysterious: `
        <div class="character-face mysterious">
          <div class="character-eyes">
            <div class="eye left-eye mysterious-eye"></div>
            <div class="eye right-eye mysterious-eye"></div>
          </div>
          <div class="character-mouth mysterious-mouth"></div>
          <div class="character-hair mysterious-hair"></div>
          <div class="character-accessory mysterious-accessory"></div>
        </div>
      `
    }
    return characters[this.config.characterType]
  }

  private getThemeStyles(): string {
    const themes = {
      sakura: `
        background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
        background-image: 
          radial-gradient(circle at 20% 80%, rgba(255, 182, 193, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 192, 203, 0.4) 0%, transparent 50%);
      `,
      ocean: `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        background-image: 
          radial-gradient(circle at 20% 80%, rgba(135, 206, 250, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(173, 216, 230, 0.3) 0%, transparent 50%);
      `,
      space: `
        background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
        background-image: 
          radial-gradient(circle at 20% 80%, rgba(138, 43, 226, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(75, 0, 130, 0.3) 0%, transparent 50%);
      `,
      forest: `
        background: linear-gradient(135deg, #134e5e 0%, #71b280 100%);
        background-image: 
          radial-gradient(circle at 20% 80%, rgba(144, 238, 144, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(152, 251, 152, 0.3) 0%, transparent 50%);
      `
    }
    return themes[this.config.theme]
  }

  private createParticle(): HTMLElement {
    const particle = document.createElement('div')
    particle.className = 'particle'
    particle.style.left = Math.random() * 100 + '%'
    particle.style.animationDelay = Math.random() * 5 + 's'
    particle.style.animationDuration = (3 + Math.random() * 4) + 's'
    return particle
  }

  private createStyle(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
      
      .anime-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        ${this.getThemeStyles()}
        z-index: 9999;
        font-family: 'Noto Sans JP', sans-serif;
        overflow: hidden;
      }

      /* 粒子效果 */
      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: particle-float 6s linear infinite;
        pointer-events: none;
      }

      @keyframes particle-float {
        0% {
          transform: translateY(100vh) translateX(0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(-100vh) translateX(50px) rotate(360deg);
          opacity: 0;
        }
      }

      /* 角色样式 */
      .anime-character {
        width: 140px;
        height: 140px;
        margin-bottom: 30px;
        position: relative;
        animation: character-breathe 4s ease-in-out infinite;
      }

      .character-face {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        position: relative;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }

      /* 不同角色类型的样式 */
      .character-face.kawaii {
        background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
      }

      .character-face.moe {
        background: linear-gradient(135deg, #ff9a9e, #fecfef);
      }

      .character-face.cool {
        background: linear-gradient(135deg, #a8edea, #fed6e3);
      }

      .character-face.mysterious {
        background: linear-gradient(135deg, #d299c2, #fef9d7);
      }

      /* 眼睛样式 */
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

      .eye.sparkle::after {
        content: '✨';
        position: absolute;
        top: -5px;
        right: -5px;
        font-size: 8px;
        animation: sparkle 2s ease-in-out infinite;
      }

      .eye.cool-eye {
        background: linear-gradient(45deg, #74b9ff, #0984e3);
        box-shadow: 0 0 10px rgba(116, 185, 255, 0.5);
      }

      .eye.mysterious-eye {
        background: linear-gradient(45deg, #a29bfe, #6c5ce7);
        box-shadow: 0 0 15px rgba(162, 155, 254, 0.7);
      }

      @keyframes eye-blink {
        0%, 90%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
      }

      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1); }
      }

      /* 嘴巴样式 */
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

      .character-mouth.moe-mouth {
        width: 15px;
        height: 8px;
        border-radius: 50%;
        background: #ff7675;
        border: none;
      }

      .character-mouth.cool-mouth {
        width: 25px;
        height: 3px;
        border-radius: 2px;
        background: #2d3436;
        border: none;
      }

      .character-mouth.mysterious-mouth {
        width: 18px;
        height: 12px;
        border: 2px solid #6c5ce7;
        border-top: none;
        border-radius: 0 0 15px 15px;
        background: linear-gradient(45deg, #a29bfe, #6c5ce7);
      }

      /* 腮红样式 */
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

      /* 头发样式 */
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
      }

      .character-hair.moe-hair {
        background: linear-gradient(45deg, #ff69b4, #ff1493);
        animation: hair-wave 3s ease-in-out infinite;
      }

      .character-hair.cool-hair {
        background: linear-gradient(45deg, #2d3436, #636e72);
        width: 110%;
        height: 50%;
      }

      .character-hair.mysterious-hair {
        background: linear-gradient(45deg, #6c5ce7, #a29bfe);
        animation: hair-glow 2s ease-in-out infinite;
      }

      @keyframes hair-wave {
        0%, 100% { transform: translateX(-50%) rotate(0deg); }
        50% { transform: translateX(-50%) rotate(2deg); }
      }

      @keyframes hair-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(108, 92, 231, 0.3); }
        50% { box-shadow: 0 0 30px rgba(108, 92, 231, 0.6); }
      }

      /* 配饰样式 */
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

      .character-accessory.cool-accessory {
        background: linear-gradient(45deg, #74b9ff, #0984e3);
        width: 15px;
        height: 15px;
        top: 15%;
      }

      .character-accessory.mysterious-accessory {
        background: linear-gradient(45deg, #a29bfe, #6c5ce7);
        width: 25px;
        height: 25px;
        border-radius: 20%;
        animation: accessory-mysterious 3s ease-in-out infinite;
      }

      @keyframes accessory-spin {
        0% { transform: translateX(-50%) rotate(0deg); }
        100% { transform: translateX(-50%) rotate(360deg); }
      }

      @keyframes accessory-mysterious {
        0%, 100% { transform: translateX(-50%) scale(1) rotate(0deg); }
        50% { transform: translateX(-50%) scale(1.2) rotate(180deg); }
      }

      /* 文字样式 */
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

      @keyframes text-glow {
        0%, 100% { text-shadow: 0 3px 15px rgba(0, 0, 0, 0.4); }
        50% { text-shadow: 0 3px 25px rgba(255, 255, 255, 0.3); }
      }

      @keyframes text-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
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

      @keyframes dot-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
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

      /* 角色呼吸动画 */
      @keyframes character-breathe {
        0%, 100% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.05) rotate(1deg); }
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
  }

  public show(): void {
    if (this.container) return

    // 创建样式
    this.style = document.createElement('style')
    this.style.id = 'anime-loading-style'
    this.style.innerHTML = this.createStyle()
    document.head.appendChild(this.style)

    // 创建容器
    this.container = document.createElement('div')
    this.container.className = 'anime-loading'

    // 创建粒子效果
    if (this.config.showParticles) {
      for (let i = 0; i < 20; i++) {
        const particle = this.createParticle()
        this.container.appendChild(particle)
        this.particles.push(particle)
      }
    }

    // 创建主内容
    this.container.innerHTML = `
      <div class="loading-content">
        <div class="anime-character">
          ${this.getCharacterHTML()}
        </div>
        <div class="loading-text">Pixuli</div>
        <div class="loading-subtitle">画像管理アプリケーション</div>
        <div class="loading-spinner">
          <div class="spinner-dot"></div>
          <div class="spinner-dot"></div>
          <div class="spinner-dot"></div>
        </div>
        ${this.config.showProgress ? `
          <div class="progress-container">
            <div class="progress-bar" id="progress-bar"></div>
          </div>
        ` : ''}
      </div>
    `

    document.body.appendChild(this.container)

    // 开始进度动画
    if (this.config.showProgress) {
      this.startProgressAnimation()
    }

    // 自动隐藏
    setTimeout(() => {
      this.hide()
    }, this.config.duration)
  }

  public hide(): void {
    if (!this.container) return

    // 添加淡出动画
    this.container.style.transition = 'opacity 0.5s ease-out'
    this.container.style.opacity = '0'

    setTimeout(() => {
      if (this.container) {
        document.body.removeChild(this.container)
        this.container = null
      }
      if (this.style) {
        document.head.removeChild(this.style)
        this.style = null
      }
      this.particles = []
    }, 500)
  }

  private startProgressAnimation(): void {
    this.progressBar = this.container?.querySelector('#progress-bar') as HTMLElement
    if (!this.progressBar) return

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 3
      if (progress > 100) progress = 100
      this.progressBar!.style.width = progress + '%'
      
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 150)
  }

  public updateProgress(progress: number): void {
    if (this.progressBar) {
      this.progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%'
    }
  }
}

// 导出默认实例
export const animeLoading = new AnimeLoading({
  characterType: 'kawaii',
  theme: 'sakura',
  showProgress: true,
  showParticles: true,
  enableSound: false,
  duration: 5000
})
