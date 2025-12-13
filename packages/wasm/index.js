/**
 * 统一 WASM 入口：根据运行环境自动加载对应的 WASM 模块
 */

let wasmModule = null;
let initPromise = null;

/**
 * 检测运行环境
 */
function detectEnvironment() {
  // React Native 环境
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'react-native';
  }

  // 浏览器环境（包括 Electron 渲染进程）
  if (typeof window !== 'undefined' || typeof self !== 'undefined') {
    return 'browser';
  }

  // Node.js 环境（包括 Electron 主进程）
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    return 'node';
  }

  return 'browser'; // 默认浏览器环境
}

/**
 * 初始化 WASM 模块
 */
async function init() {
  if (wasmModule) {
    return wasmModule;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const env = detectEnvironment();

    try {
      let module;

      if (env === 'browser') {
        // Web 端：使用 web 版本
        module = await import('./pkg-web/pixuli_wasm.js');
        await module.default(); // 初始化 WASM
      } else if (env === 'react-native') {
        // React Native：使用 bundler 版本
        module = await import('./pkg-mobile/pixuli_wasm.js');
        await module.default();
      } else {
        // Node.js/Electron 主进程：使用 nodejs 版本
        module = await import('./pkg-node/pixuli_wasm.js');
        await module.default();
      }

      wasmModule = module;
      return wasmModule;
    } catch (err) {
      initPromise = null;
      throw new Error(`Failed to load WASM module: ${err.message}`);
    }
  })();

  return initPromise;
}

/**
 * 确保 WASM 已初始化
 */
async function ensureInitialized() {
  if (!wasmModule) {
    await init();
  }
  return wasmModule;
}

// 导出所有功能函数
module.exports = {
  init,

  async compressToWebp(imageData, options) {
    const module = await ensureInitialized();
    return module.compress_to_webp(imageData, options);
  },

  async batchCompressToWebp(imagesData, options) {
    const module = await ensureInitialized();
    return module.batch_compress_to_webp(imagesData, options);
  },

  async convertImageFormat(imageData, options) {
    const module = await ensureInitialized();
    return module.convert_image_format(imageData, options);
  },

  async batchConvertImageFormat(imagesData, options) {
    const module = await ensureInitialized();
    return module.batch_convert_image_format(imagesData, options);
  },

  async getImageInfo(imageData) {
    const module = await ensureInitialized();
    return module.get_image_info(imageData);
  },

  async analyzeImage(imageData, options) {
    const module = await ensureInitialized();
    return module.analyze_image(imageData, options);
  },

  async batchAnalyzeImages(imagesData, options) {
    const module = await ensureInitialized();
    return module.batch_analyze_images(imagesData, options);
  },

  async getSupportedFormats() {
    const module = await ensureInitialized();
    return module.get_supported_formats();
  },

  async getFormatInfo(formatStr) {
    const module = await ensureInitialized();
    return module.get_format_info(formatStr);
  },

  async checkModelAvailability(modelPath) {
    const module = await ensureInitialized();
    return module.check_model_availability(modelPath);
  },

  plus100(input) {
    // 同步函数，不需要初始化检查（但建议先调用 init）
    if (!wasmModule) {
      throw new Error('WASM module not initialized. Call init() first.');
    }
    return wasmModule.plus_100(input);
  },
};
