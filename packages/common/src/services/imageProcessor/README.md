# 图片处理服务（Web/Desktop）

- **适用端**：Web、Electron 渲染进程。
- **实现方式**：纯 Web 技术（Canvas API），不依赖 WASM。
- **依赖约定**：当前实现仅使用浏览器原生 API，无额外 npm 依赖；若将来接入 WASM 或第三方图片库，应由**使用方项目**安装，并在本包（pixuli-common）中以
  **peerDependencies** 声明，不放入 common 的 dependencies。

## 导出

- `WebImageProcessorService`：类，可实例化。
- `webImageProcessorService`：单例，可直接用。
- `compress(file, options)`：压缩。
- `convert(file, outputFormat, options)`：格式转换。

类型见
`types/image.ts`：`ImageCompressionOptions`、`ImageProcessResult`、`ImageConversionOptions`、`OutputMimeType`。

使用完毕后若仅用于一次性展示，建议对返回的 `result.uri` 调用
`URL.revokeObjectURL(result.uri)` 释放 Blob URL，避免内存占用。
