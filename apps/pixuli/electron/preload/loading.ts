const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child);
    }
  },
};

function useLoading() {
  const className = `simple-loading`;
  const styleContent = `

  /* 淡入动画 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 旋转动画 */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* 脉冲动画 */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* 波浪动画 */
  @keyframes wave {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    animation: fadeIn 0.5s ease-out;
  }

  /* 确保完全遮挡后面的内容 */
  .${className} * {
    box-sizing: border-box;
  }

  /* 当加载动画显示时隐藏页面内容 */
  body.simple-loading-active {
    overflow: hidden !important;
  }

  body.simple-loading-active > *:not(.simple-loading) {
    visibility: hidden !important;
  }

  /* 主加载区域 */
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    animation: fadeIn 0.8s ease-out;
  }

  /* Logo 区域 */
  .logo-container {
    margin-bottom: 40px;
    position: relative;
  }

  .logo-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: wave 2s ease-in-out infinite;
  }

  .logo-icon::before {
    content: '📷';
    font-size: 32px;
    animation: pulse 2s ease-in-out infinite;
  }

  /* 加载文字 */
  .loading-text {
    color: #fff;
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .loading-subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    font-weight: 400;
    margin-bottom: 50px;
  }

  /* 加载动画 */
  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top: 3px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* 进度条 */
  .progress-container {
    width: 200px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8));
    border-radius: 2px;
    width: 0%;
    transition: width 0.3s ease;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .logo-icon {
      width: 60px;
      height: 60px;
    }

    .logo-icon::before {
      font-size: 24px;
    }

    .loading-text {
      font-size: 28px;
    }

    .loading-subtitle {
      font-size: 14px;
    }

    .progress-container {
      width: 160px;
    }
  }
      `;

  const oStyle = document.createElement('style');
  const oDiv = document.createElement('div');

  oStyle.id = 'app-loading-style';
  oStyle.innerHTML = styleContent;
  oDiv.className = className;

  // 创建简洁的加载内容
  oDiv.innerHTML = `
      <div class="loading-content">
        <div class="logo-container">
          <div class="logo-icon"></div>
        </div>
        <div class="loading-text">Pixuli</div>
        <div class="loading-subtitle">智能图片管理应用</div>
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
        <div class="progress-container">
          <div class="progress-bar" id="progress-bar"></div>
        </div>
      </div>
    `;

  // 智能加载进度 - 优化性能
  const updateProgress = () => {
    const progressBar = oDiv.querySelector('#progress-bar') as HTMLElement;
    if (progressBar) {
      let progress = 0;
      const targetProgress = 100;
      const updateInterval = 100; // 减少更新频率

      const animateProgress = () => {
        if (progress < targetProgress) {
          // 使用更平滑的进度增长
          const increment = Math.min(
            Math.random() * 8 + 2, // 减少随机性
            targetProgress - progress,
          );
          progress += increment;
          progressBar.style.width = Math.min(progress, targetProgress) + '%';

          // 使用requestAnimationFrame优化性能
          requestAnimationFrame(animateProgress);
        }
      };

      // 延迟开始动画，让用户看到初始状态
      setTimeout(animateProgress, 200);
    }
  };

  return {
    appendLoading() {
      // 添加CSS类来隐藏页面内容
      document.body.classList.add('simple-loading-active');

      // 添加加载动画
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);

      updateProgress();
    },
    removeLoading() {
      // 移除CSS类恢复页面内容
      document.body.classList.remove('simple-loading-active');

      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

function domReady(
  condition: DocumentReadyState[] = ['complete', 'interactive'],
) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

export function loading() {
  const { appendLoading, removeLoading } = useLoading();
  domReady().then(appendLoading);

  window.onmessage = ev => {
    ev.data.payload === 'removeLoading' && removeLoading();
  };

  setTimeout(removeLoading, 4999);
  setTimeout(removeLoading, 4999);
}
