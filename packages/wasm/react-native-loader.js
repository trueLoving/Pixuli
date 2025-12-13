/**
 * React Native WASM 加载器
 *
 * ⚠️ 暂时禁用：React Native WASM 支持暂时被禁用
 *
 * React Native 支持 WebAssembly，但 Metro bundler 无法直接处理 `import * as wasm from "./pixuli_wasm_bg.wasm"`
 * 需要特殊处理，暂时禁用，等找到更好的解决方案后再开放
 *
 * 之前的实现思路（已注释）：
 * 1. 避免直接导入 pkg-mobile/pixuli_wasm.js（因为它包含无法解析的 WASM 导入）
 * 2. 直接导入 pixuli_wasm_bg.js（JavaScript 绑定）
 * 3. 使用 require() 加载 WASM 文件作为资源
 * 4. 使用 expo-file-system 读取 WASM 文件内容
 * 5. 手动初始化 WebAssembly 模块
 *
 * TODO: 找到更好的 React Native WASM 加载方案
 */

/**
 * 加载 WASM 模块（React Native 专用）
 *
 * ⚠️ 暂时禁用：此函数暂时被禁用，等找到更好的解决方案后再开放
 */
export async function loadWasmModule() {
  // 暂时禁用 React Native WASM 支持
  throw new Error(
    'React Native WASM support is temporarily disabled.\n' +
      'Metro bundler cannot handle WASM file imports directly.\n' +
      'Please use Web or Node.js version instead.\n' +
      '\n' +
      'TODO: Implement a better solution for React Native WASM support.',
  );

  /* 之前的实现代码（暂时注释掉，等找到更好的方案后再启用）

  try {
    let wasmBytes;

    // 方法1：尝试使用 require() 加载 WASM 文件作为资源
    // Metro bundler 会将 .wasm 文件作为资源处理（已配置在 metro.config.js）
    // 自定义 Metro resolver 会处理 WASM 文件的解析
    // 注意：Metro bundler 需要静态的 require() 路径，不能使用动态变量
    try {
      // 使用静态 require() 路径
      // Metro resolver 会解析这个相对路径
      const wasmAsset = require('./pkg-mobile/pixuli_wasm_bg.wasm');
      console.log('[WASM] Successfully required WASM file');

      // 如果 require 返回的是数字（资源 ID），需要使用 Asset API
      if (typeof wasmAsset === 'number') {
        const { Asset } = await import('expo-asset');
        const asset = Asset.fromModule(wasmAsset);
        await asset.downloadAsync();

        // 使用 expo-file-system 读取文件
        const FileSystem = await import('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        wasmBytes = base64ToUint8Array(base64);
      } else {
        // 如果 require 返回的是 URI，直接使用 fetch
        const response = await fetch(wasmAsset);
        const arrayBuffer = await response.arrayBuffer();
        wasmBytes = new Uint8Array(arrayBuffer);
      }
    } catch (requireError) {
      // 方法2：如果 require() 失败，尝试通过 Metro bundler 的 HTTP 服务器加载
      console.warn('[WASM] require() failed, trying fetch:', requireError.message);

      const Platform = require('react-native').Platform;
      const metroHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
      const metroUrl = `http://${metroHost}:8081`;

      // 尝试多个可能的路径
      const possibleUrls = [
        `${metroUrl}/node_modules/pixuli-wasm/pkg-mobile/pixuli_wasm_bg.wasm`,
        `${metroUrl}/packages/wasm/pkg-mobile/pixuli_wasm_bg.wasm`,
        `${metroUrl}/pkg-mobile/pixuli_wasm_bg.wasm`,
      ];

      let lastError;
      for (const wasmUrl of possibleUrls) {
        try {
          console.log(`[WASM] Trying to fetch: ${wasmUrl}`);
          const response = await fetch(wasmUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/wasm',
            },
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            wasmBytes = new Uint8Array(arrayBuffer);
            console.log(`[WASM] Successfully loaded from: ${wasmUrl}`);
            break;
          } else {
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            console.warn(`[WASM] Failed to fetch ${wasmUrl}: ${lastError.message}`);
          }
        } catch (err) {
          lastError = err;
          console.warn(`[WASM] Error fetching ${wasmUrl}:`, err.message);
        }
      }

      if (!wasmBytes) {
        throw new Error(
          `Failed to load WASM file. ` +
          `Require error: ${requireError.message}. ` +
          `Fetch errors: ${lastError?.message || 'Unknown'}. ` +
          `Tried URLs: ${possibleUrls.join(', ')}`
        );
      }
    }

    // 导入 JavaScript 绑定（注意：直接导入 bg.js，避免导入包含 WASM import 的主文件）
    const jsBindings = await import('./pkg-mobile/pixuli_wasm_bg.js');

    // 初始化 WASM 模块
    // wasm-bindgen 生成的代码需要特定的导入对象
    const wasmModule = await WebAssembly.instantiate(wasmBytes, {
      // wasm-bindgen 需要的导入（通常是空的，因为我们的代码很简单）
      wbg: {},
    });

    // 设置 WASM 实例到 JavaScript 绑定
    if (jsBindings.__wbg_set_wasm) {
      jsBindings.__wbg_set_wasm(wasmModule.instance.exports);
    }

    // 返回模块（包含所有导出的函数）
    return {
      ...jsBindings,
      plus_100: jsBindings.plus_100,
    };
  } catch (error) {
    console.error('[WASM] Failed to load WASM module in React Native:', error);
    throw new Error(`React Native WASM loading failed: ${error.message}`);
  }

  */
}

/**
 * 将 base64 字符串转换为 Uint8Array
 *
 * ⚠️ 暂时禁用：此函数暂时被禁用
 */
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
