# 应用内 UI（`app/src/ui`）

三端共用的薄 DOM UI 层，从 `@/ui` 导入：

- **primitives**（Search、Toaster、ContentFeedback…）
- **brand**（`BrandPixelMark`）
- hooks / toast / keyboard manager（`ui/utils/keyboardShortcuts`）

复合业务 UI 在 owning feature / layout：

| 模块                                             | 位置                                         |
| ------------------------------------------------ | -------------------------------------------- |
| 资源库工作区 / 上传 / EmptyState / SearchContext | `features/library`（`LibraryWorkbench`）     |
| 编辑 / 预览 Modal                                | `features/inspector`                         |
| GitHub/Gitee 配置、版本信息、源管理 hooks        | `features/settings`                          |
| 压缩 / 转换 overlay、`imageProcessor`            | `features/tools`（`UtilityToolOverlay`）     |
| 工作区 / folderTree                              | `features/workspace`                         |
| 启动 splash                                      | `boot/loading`（文案来自 `i18n/brand.json`） |
| 侧栏呈现 / 容器                                  | `layouts/sidebar` · `layouts/AppSidebar`     |

壳层与路由见 [../README.md](../README.md)（`/library`、工具非页面）。

文案 SSOT：`app/src/i18n/locales`（域 JSON）；preloading 等壳层用 `brand`
domain。

## 边界

- 可依赖 `@pixuli/core`（类型、工具）
- **禁止**依赖 `@pixuli/provider-*` 与 `src/storage/providers`（ESLint）
- **core / provider 禁止**依赖本目录

应用级快捷键绑定（依赖 i18n）在 `hooks/keyboardShortcuts.ts`，不在本目录。
