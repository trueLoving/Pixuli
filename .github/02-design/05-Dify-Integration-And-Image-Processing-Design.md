# Pixuli：Dify 工作流接入与图片处理方案设计

- **文档版本**：1.0
- **创建日期**：2025-02-10
- **项目名称**：Pixuli - 智能图床与图片管理

---

## I. 文档目的与范围

### 1.1 目的

本文档描述：

1. **Dify 工作流接入方案**：图片分析（image→text）与图片生成（text→image）的接口设计与实现路径。
2. **图片压缩、编辑、格式转换**：上述能力是接入 AI（如 Dify）还是通过传统方式（WASM/服务端/原生）实现更合适的分析与建议。

### 1.2 范围

- 产品、前端、后端、桌面端（Electron）开发：方案理解与排期
- 与现有 PRD（F-TOOL-ANZ-01、F-TOOL-GEN-01、F-WEB-DESK-08）及可选 Pixuli
  Server 的衔接

---

## II. 现状简述

### 2.1 已有能力

| 能力          | 现状                                                                             | 位置                                              |
| ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| 图片分析 (AI) | 桌面端已接 Qwen LLM、Ollama、Shimmy；Web/Mobile 待统一                           | `apps/pixuli/electron/main/services/aiService.ts` |
| 图片生成      | 未实现，PRD 计划含 Dify 集成                                                     | F-TOOL-GEN-01                                     |
| 格式转换      | WASM 已实现（JPEG/PNG 等），逻辑待与 UI 打通                                     | `packages/wasm/src/convert/`                      |
| 压缩          | WASM 有 WebP 设计，因依赖 C 在 WASM 中暂不可用；Mobile 用 expo-image-manipulator | `packages/wasm/src/compress/`                     |
| 编辑          | Mobile 有裁剪/缩放/格式；Web/Desktop 有页面框架，逻辑待接                        | `packages/wasm/src/edit/`、Mobile `processImage`  |
| 服务端图片    | Server 使用 Sharp 做元数据等，未暴露压缩/转换 API                                | `server/src/images/`                              |

### 2.2 技术栈对齐

- **前端**：React + Zustand，多端复用 `packages/common`
- **桌面**：Electron，主进程可调 Node/HTTP，已有 `aiAPI` 暴露
- **可选后端**：NestJS + Prisma，可增加代理 Dify 或做后处理

---

## III. Dify 工作流接入方案

### 3.1 选型理由

- **统一编排**：分析、生成、后续扩展（如 OCR、风格迁移）可在 Dify 内用工作流编排，便于迭代。
- **与现有 AI 并存**：桌面端保留 Qwen/Ollama/Shimmy 本地分析；Dify 作为「云端/统一工作流」选项，通过配置切换。
- **多端一致**：Web/Desktop/Mobile 均可通过同一套「Dify 工作流 API」调用，无需各端分别接多种模型。

### 3.2 图片分析（Image → Text）

**含义**：上传一张图片，返回文本描述、标签、场景等，用于自动打标、描述、检索。

#### 3.2.1 工作流约定（在 Dify 中配置）

- **输入**：
  - `image`：图片文件（multipart）或 `image_url`（可访问 URL）或
    `image_base64`（Base64 字符串，需在 Dify 中支持）。
- **输出**（示例，按实际工作流输出变量名）：
  - `description`：图片描述
  - `tags`：标签数组或逗号分隔字符串
  - `scene_type`：场景类型（可选）

具体输入/输出变量名以在 Dify 工作流编辑器中配置的为准，前端通过「工作流配置」读取或写死一份默认映射。

#### 3.2.2 调用方式

- 使用 **Dify 工作流执行 API**：
  - 端点：`POST https://<dify-host>/v1/workflows/run`
  - 认证：`Authorization: Bearer <api_key>`
  - Body（JSON）：  
    `inputs`: 上述输入变量；  
    `response_mode`: `blocking`（短时分析）或 `streaming`（需解析 SSE）；  
    `user`: 用户标识（如 `pixuli-{clientId}`）。

- 图片传递方式建议：
  - **方式 A**：前端将图片转为 Base64，放入
    `inputs.image_base64`（或 Dify 工作流中定义的变量名）。适合小图或缩略图，避免再传文件 URL。
  - **方式 B**：若 Pixuli Server 参与，先上传到 Server/MinIO，得到 URL，再传
    `inputs.image_url`。适合大图或需要统一存储与审计的场景。

#### 3.2.3 前端/桌面集成要点

- **Web**：通过 Pixuli Server 代理（推荐）或前端直连 Dify（需处理 CORS 与 API
  Key 暴露风险）。
- **Desktop**：主进程 `aiService` 或新建 `difyService` 用 Node `https`/`fetch`
  调 Dify；API Key 存本地（如 electron-store），不写死。
- **Mobile**：建议通过 Server 代理，避免在 App 内存 Dify
  Key；若直连，需做安全存储与混淆。

#### 3.2.4 与现有分析的统一抽象

- 在 `packages/common` 或各端定义「图片分析 Provider」接口：  
  输入：图片（File/URI/Buffer）、选项；输出：统一结构（如 `{ description, tags, source: 'dify'|'ollama'|... }`）。
- 桌面端：在设置中增加「Dify 工作流（图片分析）」开关与配置（API Base URL、API
  Key、工作流 ID/名称）；调用时若启用 Dify 则走 Dify，否则走现有 Ollama/Qwen/Shimmy。
- 这样既保留本地分析，又为 Dify 留出唯一入口，便于后续扩展（如多工作流、A/B）。

### 3.3 图片生成（Text → Image）

**含义**：根据文本 prompt 生成图片，结果可保存到当前图床或本地。

#### 3.3.1 工作流约定

- **输入**：
  - `prompt`：文本描述
  - 可选：`negative_prompt`、`size`、`style` 等（与 Dify 内节点一致）。
- **输出**：
  - 图片：以 **URL** 或 **Base64** 形式由工作流输出（如 `image_url` 或
    `image_base64`）。  
    若 Dify 侧是「先存对象存储再返回 URL」或「直接返回 Base64」，前端只需兼容这两种之一或两种都支持。

#### 3.3.2 调用方式

- 同样使用 `POST /v1/workflows/run`，`inputs` 中传 `prompt` 等。
- **长耗时**：生成可能超过 30s，建议：
  - 优先使用 `response_mode: "blocking"`
    并适当放宽超时（若 Dify 与客户端允许）；
  - 或使用异步模式：先 `run` 拿到 `workflow_run_id`，再轮询
    `GET /v1/workflows/run/{workflow_run_id}` 直至
    `succeeded`/`failed`，再从返回中取 `outputs.image_url` 或 `image_base64`。

#### 3.3.3 结果落盘与入库

- 若返回 URL：前端可下载为 Blob/ArrayBuffer，再走现有「上传到当前图床」逻辑（GitHub/Gitee 或 Pixuli
  Server）。
- 若返回 Base64：解码为二进制后同样走上传流程。
- 元数据：可将 `prompt`、`workflow_run_id`
  等写入图片描述或扩展元数据，便于追溯。

### 3.4 配置与安全

- **配置项**（建议）：
  - Dify API Base URL（如 `https://api.dify.ai` 或自托管地址）
  - API Key（仅存本地或 Server 端）
  - 分析工作流 ID 或标识、生成工作流 ID 或标识（若 Dify API 需要）
- **安全**：
  - 不在前端代码或仓库中写死 API
    Key；Web 直连 Dify 时考虑短期 Token 或通过 Pixuli Server 代理。
- **错误与重试**：
  - 对 429/5xx 做有限次重试；超时与网络错误给出明确提示，并记录到操作日志（与现有 PRD 一致）。

### 3.5 实现阶段建议

| 阶段 | 内容                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | 在 Desktop 主进程实现 Dify 工作流调用（分析 + 生成），配置项存本地，与现有 aiAPI 并列或替换为「Dify 工作流」选项 |
| 2    | 定义 common 侧「分析/生成」抽象与类型，Web 通过 Server 代理调用 Dify                                             |
| 3    | 可选：Pixuli Server 提供 `/api/ai/analyze`、`/api/ai/generate` 代理到 Dify，统一鉴权与限流                       |
| 4    | Mobile 通过 Server 或直连（需安全存储 Key）接入同一套工作流                                                      |

---

## IV. 图片压缩、编辑、转换：AI 还是传统方式？

### 4.1 结论概览

| 能力                                            | 建议实现方式                          | 说明                               |
| ----------------------------------------------- | ------------------------------------- | ---------------------------------- |
| **压缩**                                        | 传统（WASM / 服务端 / 原生）          | 确定性、可预期体积与画质，无需 AI  |
| **格式转换**                                    | 传统（WASM / 服务端 / 原生）          | 编解码即可，已有 WASM convert 基础 |
| **基础编辑**（裁剪、旋转、缩放、翻转）          | 传统（WASM / expo-image-manipulator） | 几何与像素级操作，算法成熟         |
| **智能/创意编辑**（去背景、风格化、扩图、修复） | 可选 AI（Dify 工作流）                | 语义与生成类，适合工作流编排       |

### 4.2 压缩

- **不建议用 AI 做「压缩」**：
  - 压缩目标通常是「在给定画质下减小体积」或「在给定体积下尽量保真」，属于有明确数学目标的信号处理，用编码器（如 JPEG 质量、PNG 压缩级别、WebP）更合适。
  - AI 可用于「感知优化」或「超分后再缩小」等高级场景，但成本高、延迟大，不适合作为默认压缩路径。
- **推荐**：
  - **Web/Desktop**：继续用 **WASM + image-rs**
    做 JPEG/PNG 质量压缩与尺寸缩放；WebP 若需在 WASM 中支持，可调研纯 Rust 实现或先由服务端 Sharp 提供 WebP 压缩接口。
  - **Mobile**：保持 **expo-image-manipulator** 等原生能力。
  - **可选**：Pixuli Server 提供
    `POST /api/images/compress`（Sharp），接受图片 + 质量/格式参数，返回压缩后文件或 URL，供无法用 WASM 的环境使用。

### 4.3 编辑

- **基础编辑**（裁剪、旋转、缩放、翻转、简单滤镜）：
  - 用 **传统方式** 即可：WASM（`packages/wasm/src/edit/`
    扩展）、Mobile 已有实现，Web/Desktop 将同一套参数传到 WASM 或 Server。
  - 无需 Dify。
- **智能/创意编辑**：
  - 例如：去背景、风格迁移、局部修复、扩图（outpainting）。这类需求
    **适合用 AI**，可做成
    **Dify 工作流**：输入图片 + 参数，输出新图（URL/Base64），再由前端上传到图床。
  - 实现上可与「图片生成」共用 Dify 配置与运行机制，仅工作流不同。

### 4.4 格式转换

- **纯格式转换**（如 PNG→JPEG、JPEG→WebP）：
  - **不建议用 AI**：解码→编码即可，WASM 已有 `convert`
    模块，服务端 Sharp 也可做。
  - 建议：Web/Desktop 打通 WASM 转换与 UI；Mobile 继续用现有能力；如需 WebP 且 WASM 暂不可用，可由 Server 提供转换接口。

### 4.5 与 PRD 的对应

- **F-TOOL-EDT-01 / F-TOOL-ANZ-01**：编辑与基础分析以
  **传统 + 现有 AI（含 Dify 分析）** 实现。
- **F-TOOL-GEN-01**：文本生成图片由 **Dify 工作流** 实现。
- **F-WEB-DESK-08（AI 能力）**：自动打标、场景识别等以 **Dify 图片分析工作流**
  为主；压缩/转换/基础编辑不走 AI。

---

## V. 架构示意

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                     Pixuli Client                        │
                    │  (Web / Desktop / Mobile)                                │
                    ├─────────────────────────────────────────────────────────┤
                    │  • 压缩/转换/基础编辑 → WASM 或 Native (expo-image-manipulator)  │
                    │  • 图片分析 (image→text) → Dify 工作流 或 本地 AI (Ollama/Qwen)   │
                    │  • 图片生成 (text→image) → Dify 工作流                         │
                    │  • 智能编辑（可选）→ Dify 工作流                                │
                    └───────────────────────┬───────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────────┐
                    │                         ▼                             │
                    │  可选：Pixuli Server                                    │
                    │  • 代理 Dify（/api/ai/analyze, /api/ai/generate）        │
                    │  • 图片存储、压缩/转换 API（Sharp）                        │
                    └─────────────────────────┬─────────────────────────────┘
                                              │
                    ┌─────────────────────────▼─────────────────────────────┐
                    │  Dify（自托管或云）                                      │
                    │  • 工作流 1：Image → 描述/标签 (image→text)               │
                    │  • 工作流 2：Prompt → 图片 (text→image)                  │
                    │  • 工作流 3（可选）：智能编辑                              │
                    └─────────────────────────────────────────────────────────┘
```

---

## VI. 后续可补充内容

- Dify 工作流输入/输出变量的具体命名与版本管理（便于多环境切换）。
- Pixuli Server 代理 Dify 的接口规范（请求/响应、错误码、限流）。
- 压缩/转换在 Web 端使用 WASM 时的降级策略（如 WASM 加载失败时是否回退到 Server）。
- 安全：API Key 存储、Server 代理时的鉴权与审计。

---

**文档结束**
