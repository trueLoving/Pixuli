# 壳层 Hooks（`app/src/hooks`）

编排级 hooks：应用 init、路由同步、键盘快捷键、面板尺寸等。**不含**业务域逻辑（域逻辑在
`features/`）。

## 键盘快捷键分工

| 层            | 路径                             | 职责                                                   |
| ------------- | -------------------------------- | ------------------------------------------------------ |
| **引擎 SSOT** | `ui/utils/keyboardShortcuts.ts`  | `KeyboardShortcutManager`、`keyboardManager` 注册/分发 |
| **壳层编排**  | `hooks/keyboardShortcuts.ts`     | `createKeyboardShortcuts(t)`，CustomEvent 映射         |
| **壳层注册**  | `hooks/useKeyboardShortcuts.ts`  | 启动时将快捷键挂到 `keyboardManager`                   |
| **设置展示**  | `hooks/useKeyboardCategories.ts` | 设置页快捷键分类数据                                   |
| **组件级**    | `ui/hooks/useKeyboard.ts`        | `useKeyboard` / `useEscapeKey` primitive               |
| **域内**      | 如 `AssetLibrary.tsx`            | 必要时 `keyboardManager.registerBatch`                 |

**约定**：新增全局快捷键优先走 `hooks/useKeyboardShortcuts` +
`keyboardShortcuts.ts`；Modal 内 Esc 用
`useEscapeKey`；feature 内局部快捷键在域内注册并注明冲突。

文案 SSOT：`i18n/locales/*/keyboard.json`。
