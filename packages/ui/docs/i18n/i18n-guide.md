# Pixuli UI 国际化使用指南

## 🚀 快速开始

### 1. 导入翻译函数

```tsx
import { defaultTranslate, zhCN, enUS } from '@packages/ui/src';

// 使用中文翻译
const t = defaultTranslate(zhCN);

// 使用英文翻译
const t = defaultTranslate(enUS);
```

### 2. 在组件中使用

```tsx
import { ImageBrowser, ImageUpload } from '@packages/ui/src';

function App() {
  const t = defaultTranslate(zhCN);

  return (
    <div>
      <ImageUpload
        onUploadImage={handleUpload}
        onUploadMultipleImages={handleBatchUpload}
        loading={uploading}
        t={t}
      />

      <ImageBrowser
        images={images}
        onDeleteImage={handleDelete}
        onUpdateImage={handleUpdate}
        t={t}
      />
    </div>
  );
}
```

## 🎨 自定义翻译

### 覆盖现有翻译

```tsx
const customTranslations = {
  'app.title': '我的图片管理器',
  'common.save': '保存设置',
  'image.upload.uploadButton': '开始上传',
};

const t = defaultTranslate({
  ...zhCN,
  ...customTranslations,
});
```

### 添加新翻译

```tsx
const myTranslations = {
  'custom.newFeature': '新功能',
  'custom.description': '这是一个新功能的描述',
};

const t = defaultTranslate({
  ...zhCN,
  ...myTranslations,
});
```

## 📋 常用 Key 值

### 应用基础

- `app.title` - 应用标题
- `app.welcome` - 欢迎信息
- `app.description` - 应用描述

### 通用操作

- `common.save` - 保存
- `common.cancel` - 取消
- `common.delete` - 删除
- `common.edit` - 编辑
- `common.loading` - 加载中

### 图片相关

- `image.upload.uploadButton` - 上传按钮
- `image.upload.dragInactive` - 拖拽提示
- `image.list.preview` - 预览
- `image.list.edit` - 编辑
- `image.list.delete` - 删除

### 配置相关

- `github.config.title` - GitHub 配置标题
- `github.config.saveConfig` - 保存配置

## 🔧 高级用法

### 动态语言切换

```tsx
import { useState } from 'react';
import { defaultTranslate, zhCN, enUS } from '@packages/ui/src';

function App() {
  const [language, setLanguage] = useState('zh');

  const translations = language === 'zh' ? zhCN : enUS;
  const t = defaultTranslate(translations);

  return (
    <div>
      <button onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}>
        {language === 'zh' ? 'English' : '中文'}
      </button>

      <ImageBrowser
        images={images}
        t={t}
        onDeleteImage={handleDelete}
        onUpdateImage={handleUpdate}
      />
    </div>
  );
}
```

### 参数化翻译

```tsx
// 支持参数的翻译
const translations = {
  'image.filter.showingImagesCount': '显示 {count} 张图片',
  'image.filter.totalImagesCount': '(共 {count} 张)',
};

const t = defaultTranslate(translations);

// 使用时需要手动替换参数
const message = t('image.filter.showingImagesCount').replace('{count}', '10');
```

## 📚 完整 Key 值列表

查看 [i18n-keys.md](./i18n-keys.md) 获取完整的国际化 key 值列表。

## ⚠️ 注意事项

1. **类型安全**: 建议使用 TypeScript 确保翻译 key 的类型安全
2. **默认值**: 如果翻译 key 不存在，会返回 key 本身作为默认值
3. **嵌套结构**: 翻译对象支持多层嵌套，使用点号访问
4. **参数替换**: 需要手动处理 `{count}` 等参数的替换
5. **更新维护**: 组件库更新时可能会添加新的翻译 key
