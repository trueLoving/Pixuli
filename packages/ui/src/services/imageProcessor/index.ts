/**
 * 图片处理服务（Web/Desktop 纯 Web 实现）
 * 仅适用于 Web 与 Electron 渲染进程，使用 Canvas API，不依赖 WASM。
 * 移动端请使用各端自己的实现（如 expo-image-manipulator）并通过统一接口对接。
 */

export {
  WebImageProcessorService,
  webImageProcessorService,
  type OutputMimeType,
} from './webImageProcessor';
