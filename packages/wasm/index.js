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
        // Web 版本的 default 函数需要调用以初始化 WASM
        // 检查 default 导出是否存在
        if (!module.default) {
          // 如果没有 default，检查是否有其他导出方式
          if (module.__wbg_init) {
            await module.__wbg_init();
          } else {
            throw new Error(
              `Web WASM module.default is undefined. ` +
                `Available exports: ${Object.keys(module).join(', ')}. ` +
                `Make sure pkg-web/pixuli_wasm.js is properly built.`,
            );
          }
        } else if (typeof module.default === 'function') {
          await module.default();
        } else {
          throw new Error(
            `Web WASM module.default is not a function (it is ${typeof module.default}). ` +
              `Make sure pkg-web/pixuli_wasm.js is properly built.`,
          );
        }
      } else if (env === 'react-native') {
        // React Native：暂时禁用 WASM 支持
        // React Native 的 Metro bundler 无法直接处理 `import * as wasm from "./pixuli_wasm_bg.wasm"`
        // 需要特殊处理，暂时禁用，等找到更好的解决方案后再开放
        throw new Error(
          'WASM is temporarily disabled for React Native.\n' +
            'Metro bundler cannot handle WASM file imports directly.\n' +
            'Please use Web or Node.js version instead.\n' +
            '\n' +
            'TODO: Implement a better solution for React Native WASM support.',
        );

        // 之前的实现（暂时注释掉）：
        // try {
        //   // 直接使用 React Native 专用加载器
        //   // 注意：不能直接导入 pkg-mobile/pixuli_wasm.js，因为它包含无法解析的 WASM import
        //   const { loadWasmModule } = await import('./react-native-loader.js');
        //   module = await loadWasmModule();
        // } catch (err) {
        //   throw new Error(
        //     `React Native WASM loading failed: ${err.message}\n` +
        //     `Make sure Metro bundler is running and WASM file is accessible.`
        //   );
        // }
      } else {
        // Node.js/Electron 主进程：使用 nodejs 版本
        // Node.js 版本是同步初始化的，不需要调用 default()
        module = await import('./pkg-node/pixuli_wasm.js');
        // Node.js 版本的 WASM 模块已经同步初始化，不需要调用 default()
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

// ES6 模块导出（支持 Web 端）
export { init };

export async function compressToWebp(imageData, options) {
  const module = await ensureInitialized();
  return module.compress_to_webp(imageData, options);
}

export async function batchCompressToWebp(imagesData, options) {
  const module = await ensureInitialized();
  return module.batch_compress_to_webp(imagesData, options);
}

export async function convertImageFormat(imageData, options) {
  const module = await ensureInitialized();
  return module.convert_image_format(imageData, options);
}

export async function batchConvertImageFormat(imagesData, options) {
  const module = await ensureInitialized();
  return module.batch_convert_image_format(imagesData, options);
}

export async function getImageInfo(imageData) {
  const module = await ensureInitialized();
  return module.get_image_info(imageData);
}

export async function analyzeImage(imageData, options) {
  const module = await ensureInitialized();
  return module.analyze_image(imageData, options);
}

export async function batchAnalyzeImages(imagesData, options) {
  const module = await ensureInitialized();
  return module.batch_analyze_images(imagesData, options);
}

export async function getSupportedFormats() {
  const module = await ensureInitialized();
  return module.get_supported_formats();
}

export async function getFormatInfo(formatStr) {
  const module = await ensureInitialized();
  return module.get_format_info(formatStr);
}

export async function checkModelAvailability(modelPath) {
  const module = await ensureInitialized();
  return module.check_model_availability(modelPath);
}

export async function plus100(input) {
  // 确保 WASM 已初始化
  const module = await ensureInitialized();
  return module.plus_100(input);
}

// 注意：ES6 模块版本，Web 端使用
// Node.js 和 React Native 请使用 index.cjs
