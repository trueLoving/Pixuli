# GitHubConfigModal 组件

GitHub 配置模态框，用于配置 GitHub 存储，支持配置导入/导出和验证功能。

## 📋 基本用法

```tsx
import { GitHubConfigModal } from 'pixuli-ui/src';

function App() {
  const [showConfig, setShowConfig] = useState(false);
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);

  const handleSaveConfig = (config: GitHubConfig) => {
    // 保存配置到本地存储或状态管理
    setGithubConfig(config);
    localStorage.setItem('githubConfig', JSON.stringify(config));
    setShowConfig(false);
  };

  const handleClearConfig = () => {
    // 清除配置
    setGithubConfig(null);
    localStorage.removeItem('githubConfig');
    setShowConfig(false);
  };

  return (
    <div>
      <button onClick={() => setShowConfig(true)}>配置 GitHub</button>

      <GitHubConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        githubConfig={githubConfig}
        onSaveConfig={handleSaveConfig}
        onClearConfig={handleClearConfig}
        platform="web"
      />
    </div>
  );
}
```

## 🔧 Props

| 属性            | 类型                             | 必需 | 默认值  | 说明           |
| --------------- | -------------------------------- | ---- | ------- | -------------- |
| `isOpen`        | `boolean`                        | ✅   | -       | 是否显示模态框 |
| `onClose`       | `() => void`                     | ✅   | -       | 关闭回调       |
| `githubConfig`  | `GitHubConfig \| null`           | ❌   | -       | 当前配置       |
| `onSaveConfig`  | `(config: GitHubConfig) => void` | ✅   | -       | 保存配置回调   |
| `onClearConfig` | `() => void`                     | ✅   | -       | 清除配置回调   |
| `platform`      | `'web' \| 'desktop'`             | ❌   | `'web'` | 平台类型       |
| `t`             | `(key: string) => string`        | ❌   | -       | 翻译函数       |

## 📝 类型定义

### GitHubConfig

```tsx
interface GitHubConfig {
  owner: string; // GitHub 用户名或组织名
  repo: string; // 仓库名称
  branch: string; // 分支名称
  token: string; // Personal Access Token
  path: string; // 图片存储路径
}
```

## 🎨 功能特性

### 配置表单

提供完整的 GitHub 配置表单：

- **用户名/组织名**: GitHub 用户名或组织名
- **仓库名称**: 用于存储图片的仓库名称
- **分支名称**: 通常为 main 或 master
- **存储路径**: 仓库中存储图片的文件夹路径
- **Token**: Personal Access Token

### 配置验证

内置配置验证功能：

- 检查必填字段
- 验证 Token 格式
- 验证仓库路径格式

### 配置导入/导出

支持配置的导入和导出：

- **导出**: 将当前配置保存为 JSON 文件
- **导入**: 从 JSON 文件加载配置
- **跨平台**: 支持桌面端和 Web 端配置互导

### 帮助信息

提供详细的配置帮助：

- Token 获取指南
- 配置导入导出说明
- 常见问题解答

## 🌍 国际化支持

组件支持国际化，需要传入翻译函数：

```tsx
import { zhCN, defaultTranslate } from 'pixuli-ui/src'

const t = defaultTranslate(zhCN)

<GitHubConfigModal
  isOpen={showConfig}
  onClose={() => setShowConfig(false)}
  githubConfig={githubConfig}
  onSaveConfig={handleSaveConfig}
  onClearConfig={handleClearConfig}
  t={t}
/>
```

### 相关翻译 Key

- `github.config.title` - GitHub 仓库配置
- `github.config.username` - GitHub 用户名
- `github.config.repository` - 仓库名称
- `github.config.branch` - 分支名称
- `github.config.path` - 图片存储路径
- `github.config.token` - GitHub Token
- `github.config.saveConfig` - 保存配置
- `github.config.clearConfig` - 清除配置
- `github.config.import` - 导入
- `github.config.export` - 导出

## 🎨 自定义样式

```tsx
<GitHubConfigModal
  className="my-github-config"
  isOpen={showConfig}
  onClose={() => setShowConfig(false)}
  githubConfig={githubConfig}
  onSaveConfig={handleSaveConfig}
  onClearConfig={handleClearConfig}
/>
```

```css
.my-github-config .modal-content {
  max-width: 600px;
  border-radius: 12px;
}

.my-github-config .form-group {
  margin-bottom: 20px;
}

.my-github-config .form-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.my-github-config .form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.my-github-config .form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.my-github-config .help-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.my-github-config .button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}
```

## 📱 响应式设计

组件采用响应式设计：

- **桌面端**: 显示完整的配置表单和帮助信息
- **平板端**: 优化触摸操作体验
- **移动端**: 简化界面，突出核心配置项

## 🔧 高级用法

### 自定义验证

```tsx
const validateGitHubConfig = (config: GitHubConfig) => {
  const errors: string[] = [];

  // 验证用户名
  if (!config.owner || config.owner.length < 1) {
    errors.push('用户名不能为空');
  }

  // 验证仓库名
  if (!config.repo || config.repo.length < 1) {
    errors.push('仓库名不能为空');
  }

  // 验证 Token 格式
  if (!config.token || !config.token.startsWith('ghp_')) {
    errors.push('Token 格式不正确');
  }

  // 验证路径
  if (!config.path || !config.path.startsWith('/')) {
    errors.push('路径必须以 / 开头');
  }

  return errors;
};

const handleSaveConfig = (config: GitHubConfig) => {
  const errors = validateGitHubConfig(config);
  if (errors.length > 0) {
    alert(errors.join('\n'));
    return;
  }

  // 保存配置
  setGithubConfig(config);
  localStorage.setItem('githubConfig', JSON.stringify(config));
  setShowConfig(false);
};
```

### 配置导入导出

```tsx
const handleExportConfig = () => {
  if (!githubConfig) return;

  const dataStr = JSON.stringify(githubConfig, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'github-config.json';
  link.click();
};

const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const config = JSON.parse(e.target?.result as string);
      setGithubConfig(config);
    } catch (error) {
      alert('配置文件格式不正确');
    }
  };
  reader.readAsText(file);
};
```

### 平台特定配置

```tsx
// Web 端配置
<GitHubConfigModal
  isOpen={showConfig}
  onClose={() => setShowConfig(false)}
  githubConfig={githubConfig}
  onSaveConfig={handleSaveConfig}
  onClearConfig={handleClearConfig}
  platform="web"
/>

// 桌面端配置
<GitHubConfigModal
  isOpen={showConfig}
  onClose={() => setShowConfig(false)}
  githubConfig={githubConfig}
  onSaveConfig={handleSaveConfig}
  onClearConfig={handleClearConfig}
  platform="desktop"
/>
```

## ⚠️ 注意事项

1. **Token 安全**: Token 包含敏感信息，需要安全存储
2. **配置验证**: 建议在保存前验证配置的有效性
3. **错误处理**: 需要适当的错误提示和异常处理
4. **国际化**: 使用国际化时确保传入完整的翻译函数
5. **平台差异**: 不同平台可能有不同的配置需求

## 🔗 相关组件

- [UpyunConfigModal](./upyun-config-modal.md) - 又拍云配置模态框
- [KeyboardHelpModal](./keyboard-help-modal.md) - 键盘快捷键帮助模态框
- [ImageBrowser](./image-browser.md) - 图片浏览器组件
