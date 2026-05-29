/**
 * 全局类型声明
 * 用于支持跨平台代码中的 Node.js 和 React Native API
 */

// 声明 require 函数（用于 CommonJS 模块）
declare const require: {
  (id: string): any;
  cache: any;
  extensions: any;
  main: any;
  resolve(id: string): string;
} | undefined;

// 扩展 Window 接口以支持 Electron
interface Window {
  process?: {
    type?: string;
    [key: string]: any;
  };
}
