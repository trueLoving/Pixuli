import { getBrandCopy } from '../i18n/brandCopy';

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

/** 与 BrandPixelMark variant="loading" 同构，供 React 挂载前注入 */
const BRAND_PIXEL_SVG = `
  <svg class="loading-mark-svg" width="112" height="112" viewBox="0 0 64 72" aria-hidden="true" focusable="false">
    <path class="loading-mark-top" d="M32 8 L54 20 L32 32 L10 20 Z" fill="#5EE1F7" stroke="#C4B5FD" stroke-width="1.25"/>
    <path d="M10 20 L32 32 L32 56 L10 44 Z" fill="#DDD6FE" stroke="#C4B5FD" stroke-width="1.25"/>
    <path d="M14 28 H26 M14 34 H24 M14 40 H22" fill="none" stroke="#C4B5FD" stroke-width="1" stroke-linecap="square" opacity="0.55"/>
    <path d="M32 32 L54 20 L54 44 L32 56 Z" fill="#FAF8FF" stroke="#C4B5FD" stroke-width="1.25"/>
    <g fill="none" stroke="#C4B5FD" stroke-width="1">
      <path d="M36 30 L43 26 L43 32 L36 36 Z"/>
      <path d="M44 25.5 L51 21.5 L51 27.5 L44 31.5 Z"/>
      <path d="M36 37 L43 33 L43 39 L36 43 Z"/>
      <path d="M44 32.5 L51 28.5 L51 34.5 L44 38.5 Z"/>
      <path d="M36 44 L43 40 L43 46 L36 50 Z"/>
      <path d="M44 39.5 L51 35.5 L51 41.5 L44 45.5 Z"/>
    </g>
    <g class="loading-mark-pixels" aria-hidden="true">
      <rect class="loading-mark-pixel loading-mark-pixel--1" x="28" y="2" width="4" height="4" rx="0.5"/>
      <rect class="loading-mark-pixel loading-mark-pixel--2" x="36" y="0" width="4" height="4" rx="0.5"/>
      <rect class="loading-mark-pixel loading-mark-pixel--3" x="22" y="4" width="4" height="4" rx="0.5"/>
      <rect class="loading-mark-pixel loading-mark-pixel--4" x="42" y="3" width="4" height="4" rx="0.5"/>
      <rect class="loading-mark-pixel loading-mark-pixel--5" x="32" y="-2" width="4" height="4" rx="0.5"/>
    </g>
  </svg>
`;

function useLoading() {
  const brand = getBrandCopy();
  const className = `simple-loading`;
  const styleContent = `
  @keyframes simple-loading-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes brand-pixel-glow {
    0%, 100% {
      opacity: 0.72;
      filter: drop-shadow(0 0 4px rgba(94, 225, 247, 0.45));
    }
    50% {
      opacity: 1;
      filter: drop-shadow(0 0 10px rgba(94, 225, 247, 0.85));
    }
  }

  @keyframes brand-pixel-rise {
    0% {
      opacity: 0;
      transform: translateY(6px);
    }
    35% { opacity: 1; }
    100% {
      opacity: 0;
      transform: translateY(-14px);
    }
  }

  .${className} {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #faf8ff 0%, #f5f3ff 48%, #eef2ff 100%);
    z-index: 2147483647;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: simple-loading-fade-in 0.25s ease-out;
    user-select: none;
  }

  .${className} * {
    box-sizing: border-box;
  }

  body.simple-loading-active {
    overflow: hidden !important;
  }

  body.simple-loading-active > *:not(.simple-loading) {
    visibility: hidden !important;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0;
    padding: 1.5rem;
  }

  .logo-container {
    margin-bottom: 1.25rem;
    line-height: 0;
  }

  .loading-mark-svg {
    display: block;
    overflow: visible;
  }

  .loading-mark-top {
    animation: brand-pixel-glow 1.2s ease-in-out infinite;
  }

  .loading-mark-pixel {
    fill: #5ee1f7;
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: brand-pixel-rise 1.2s ease-in-out infinite;
  }

  .loading-mark-pixel--1 { animation-delay: 0s; }
  .loading-mark-pixel--2 { animation-delay: 0.15s; }
  .loading-mark-pixel--3 { animation-delay: 0.3s; }
  .loading-mark-pixel--4 { animation-delay: 0.45s; }
  .loading-mark-pixel--5 { animation-delay: 0.6s; }

  .loading-text {
    color: #1e1b4b;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.35rem;
    letter-spacing: -0.02em;
  }

  .loading-subtitle {
    color: #6b7280;
    font-size: 0.9375rem;
    font-weight: 400;
    margin: 0 0 1.75rem;
    line-height: 1.5;
  }

  .progress-container {
    width: 12.5rem;
    height: 3px;
    background: #ede9fe;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #5ee1f7, #22d3ee);
    border-radius: 999px;
    width: 0%;
    transition: width 0.3s ease;
  }

  @media (max-width: 768px) {
    .loading-mark-svg {
      width: 5.5rem;
      height: 5.5rem;
    }

    .loading-text {
      font-size: 1.5rem;
    }

    .loading-subtitle {
      font-size: 0.875rem;
    }

    .progress-container {
      width: 10rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .${className} {
      background: color-mix(in srgb, #1e1b4b 92%, #000);
    }

    .loading-text {
      color: #f5f3ff;
    }

    .loading-subtitle {
      color: #c4b5fd;
    }

    .progress-container {
      background: rgba(196, 181, 253, 0.2);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .${className} {
      animation: none;
    }

    .loading-mark-top {
      animation: none;
      opacity: 1;
      filter: drop-shadow(0 0 4px rgba(94, 225, 247, 0.5));
    }

    .loading-mark-pixel {
      animation: none;
      transform: none;
    }

    .loading-mark-pixel--1,
    .loading-mark-pixel--2,
    .loading-mark-pixel--3 {
      opacity: 0.9;
    }

    .loading-mark-pixel--4,
    .loading-mark-pixel--5 {
      opacity: 0;
    }
  }
      `;

  const oStyle = document.createElement('style');
  const oDiv = document.createElement('div');

  oStyle.id = 'app-loading-style';
  oStyle.innerHTML = styleContent;
  oDiv.className = className;
  oDiv.setAttribute('role', 'status');
  oDiv.setAttribute('aria-live', 'polite');
  oDiv.setAttribute('aria-label', brand.bootAriaLabel);

  oDiv.innerHTML = `
      <div class="loading-content">
        <div class="logo-container">
          ${BRAND_PIXEL_SVG}
        </div>
        <div class="loading-text">${brand.name}</div>
        <div class="loading-subtitle">${brand.tagline}</div>
        <div class="progress-container">
          <div class="progress-bar" id="progress-bar"></div>
        </div>
      </div>
    `;

  const updateProgress = () => {
    const progressBar = oDiv.querySelector('#progress-bar') as HTMLElement;
    if (progressBar) {
      let progress = 0;
      const targetProgress = 100;

      const animateProgress = () => {
        if (progress < targetProgress) {
          const increment = Math.min(
            Math.random() * 8 + 2,
            targetProgress - progress,
          );
          progress += increment;
          progressBar.style.width = Math.min(progress, targetProgress) + '%';
          requestAnimationFrame(animateProgress);
        }
      };

      setTimeout(animateProgress, 200);
    }
  };

  return {
    appendLoading() {
      document.body.classList.add('simple-loading-active');
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
      updateProgress();
    },
    removeLoading() {
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

  window.addEventListener('message', ev => {
    if (ev.data?.payload === 'removeLoading') {
      removeLoading();
    }
  });

  setTimeout(removeLoading, 4999);
}

export function removeLoading() {
  const loadingDiv = document.querySelector('.simple-loading');
  const loadingStyle = document.getElementById('app-loading-style');

  if (loadingDiv) {
    document.body.classList.remove('simple-loading-active');
    if (loadingStyle) {
      document.head.removeChild(loadingStyle);
    }
    document.body.removeChild(loadingDiv);
  }
}
