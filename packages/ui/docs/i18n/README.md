# Pixuli UI 国际化文档

本目录包含 Pixuli UI 组件库的国际化相关文档。

## 📋 文档列表

### 🌍 国际化指南

- **[i18n-guide.md](./i18n-guide.md)** - 国际化使用指南
  - 快速开始
  - 自定义翻译
  - 常用 Key 值
  - 高级用法

- **[i18n-keys.md](./i18n-keys.md)** - 完整国际化 Key 值参考
  - 所有可用的翻译 key
  - 中英文对照
  - 分类整理
  - 使用说明

## 🚀 快速开始

### 1. 查看国际化指南

```bash
# 查看国际化使用指南
cat i18n-guide.md

# 查看完整 Key 值列表
cat i18n-keys.md
```

### 2. 在项目中使用

```tsx
import { defaultTranslate, zhCN, enUS } from 'pixuli-ui/src'

// 使用中文翻译
const t = defaultTranslate(zhCN)

// 使用英文翻译
const t = defaultTranslate(enUS)

// 在组件中使用
<ImageBrowser
  images={images}
  t={t}
  onDeleteImage={handleDelete}
  onUpdateImage={handleUpdate}
/>
```

## 📝 文档更新

当组件库更新时，这些文档也会相应更新：

- 新增的翻译 key 会添加到 `i18n-keys.md`
- 新的使用方式会更新到 `i18n-guide.md`
- 保持文档与代码同步

## 🤝 贡献

如果您发现文档有误或需要补充，欢迎提交 Issue 或 Pull Request。

## 📄 许可证

MIT License
