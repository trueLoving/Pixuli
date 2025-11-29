# 未配置仓库源时的界面实现示例

## 🎯 核心思路

**关键原则：保持布局结构，只替换内容区域**

即使没有配置仓库源，也要：

1. ✅ 显示完整的侧边栏和顶部栏
2. ✅ 主内容区显示友好的引导界面
3. ✅ 提供多种添加仓库源的入口
4. ✅ 支持 Demo 模式快速体验

## 📦 组件实现

### 1. EmptyState 组件

```tsx
// packages/common/src/components/empty-state/EmptyState.tsx
import React from 'react';
import { Github, GitBranch, Play, BookOpen, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  onAddGitHub: () => void;
  onAddGitee: () => void;
  onTryDemo?: () => void;
  t: (key: string) => string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onAddGitHub,
  onAddGitee,
  onTryDemo,
  t,
}) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        {/* 图标 */}
        <div className="empty-state-icon">
          <ImageIcon size={80} className="text-gray-400" />
        </div>

        {/* 标题 */}
        <h2 className="empty-state-title">{t('emptyState.title')}</h2>

        {/* 描述 */}
        <p className="empty-state-description">{t('emptyState.description')}</p>

        {/* 主要操作按钮 */}
        <div className="empty-state-actions">
          <button onClick={onAddGitHub} className="empty-state-button primary">
            <Github className="w-5 h-5" />
            {t('emptyState.addGitHub')}
          </button>
          <button onClick={onAddGitee} className="empty-state-button primary">
            <GitBranch className="w-5 h-5" />
            {t('emptyState.addGitee')}
          </button>
          {onTryDemo && (
            <button
              onClick={onTryDemo}
              className="empty-state-button secondary"
            >
              <Play className="w-5 h-5" />
              {t('emptyState.tryDemo')}
            </button>
          )}
        </div>

        {/* 快速开始指南 */}
        <div className="empty-state-guide">
          <h3 className="guide-title">{t('emptyState.quickStart')}</h3>
          <div className="guide-steps">
            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>{t('emptyState.step1.title')}</h4>
                <p>{t('emptyState.step1.description')}</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>{t('emptyState.step2.title')}</h4>
                <p>{t('emptyState.step2.description')}</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>{t('emptyState.step3.title')}</h4>
                <p>{t('emptyState.step3.description')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 帮助链接 */}
        <div className="empty-state-help">
          <HelpCircle className="w-4 h-4" />
          <span>{t('emptyState.needHelp')}</span>
          <a href="/docs/getting-started" className="help-link">
            {t('emptyState.viewDocs')}
          </a>
        </div>
      </div>
    </div>
  );
};
```

### 2. 侧边栏空状态

```tsx
// packages/common/src/components/sidebar/SidebarEmptyState.tsx
export const SidebarEmptyState: React.FC<Props> = ({ onAddSource, t }) => {
  return (
    <div className="sidebar-empty-state">
      <div className="sidebar-empty-icon">
        <Plus size={32} className="text-gray-400" />
      </div>
      <p className="sidebar-empty-text">{t('sidebar.emptyState.text')}</p>
      <button onClick={onAddSource} className="sidebar-add-button">
        <Plus size={16} />
        {t('sidebar.emptyState.addSource')}
      </button>
    </div>
  );
};
```

### 3. 更新 App.tsx

```tsx
// apps/web/src/App.tsx
function App() {
  // ... 现有代码 ...

  // 判断是否有配置
  const hasConfig = githubConfig || giteeConfig;

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部栏 - 始终显示 */}
      <Header
        hasConfig={hasConfig}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        // ... 其他 props
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 - 始终显示 */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          sources={sources}
          selectedSourceId={selectedSourceId}
          onSourceSelect={handleSourceSelect}
          hasConfig={hasConfig}
          onAddSource={handleAddSource}
          t={t}
        />

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto">
          {!hasConfig ? (
            // 未配置：显示引导界面
            <EmptyState
              onAddGitHub={() => {
                setStorageType('github');
                setShowConfigModal(true);
              }}
              onAddGitee={() => {
                setStorageType('gitee');
                setShowConfigModal(true);
              }}
              onTryDemo={handleTryDemo}
              t={t}
            />
          ) : (
            // 已配置：显示正常内容
            <ImageContent
              images={images}
              loading={loading}
              // ... 其他 props
            />
          )}
        </main>
      </div>

      {/* 模态框等 */}
    </div>
  );
}
```

### 4. 侧边栏导航项禁用状态

```tsx
// packages/common/src/components/sidebar/NavItem.tsx
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active,
  disabled,
  onClick,
  tooltip,
}) => {
  return (
    <button
      className={`
        nav-item
        ${active ? 'active' : ''}
        ${disabled ? 'disabled' : ''}
      `}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={tooltip}
    >
      <span className="nav-item-icon">{icon}</span>
      <span className="nav-item-label">{label}</span>
      {disabled && (
        <span className="nav-item-badge" title={tooltip}>
          <Lock size={12} />
        </span>
      )}
    </button>
  );
};
```

## 🎨 CSS 样式

```css
/* EmptyState 样式 */
.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 3rem 2rem;
}

.empty-state-content {
  max-width: 600px;
  text-align: center;
}

.empty-state-icon {
  margin-bottom: 2rem;
  opacity: 0.6;
}

.empty-state-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.empty-state-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.empty-state-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.empty-state-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.empty-state-button.primary {
  background: var(--primary-color);
  color: white;
}

.empty-state-button.primary:hover {
  background: var(--primary-color-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.empty-state-button.secondary {
  background: var(--secondary-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.empty-state-guide {
  text-align: left;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.guide-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.guide-step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.step-content h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.step-content p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 侧边栏空状态 */
.sidebar-empty-state {
  padding: 2rem 1rem;
  text-align: center;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  margin: 1rem;
  background: var(--card-bg);
}

.sidebar-empty-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.sidebar-empty-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.sidebar-add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.sidebar-add-button:hover {
  background: var(--primary-color-dark);
}

/* 导航项禁用状态 */
.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.nav-item-badge {
  margin-left: auto;
  opacity: 0.6;
}
```

## 🌐 语言包

```json
// packages/common/src/locales/app/zh-CN.json
{
  "emptyState": {
    "title": "欢迎使用 Pixuli",
    "description": "开始管理您的图片库，首先需要添加一个仓库源",
    "addGitHub": "配置 GitHub",
    "addGitee": "配置 Gitee",
    "tryDemo": "体验 Demo 模式",
    "quickStart": "快速开始",
    "step1": {
      "title": "选择存储平台",
      "description": "选择 GitHub 或 Gitee 作为图片存储仓库"
    },
    "step2": {
      "title": "填写仓库信息",
      "description": "输入仓库所有者、仓库名、分支和访问令牌"
    },
    "step3": {
      "title": "开始使用",
      "description": "配置完成后即可上传和管理图片"
    },
    "needHelp": "需要帮助？",
    "viewDocs": "查看文档"
  },
  "sidebar": {
    "emptyState": {
      "text": "还没有仓库源",
      "addSource": "添加仓库源"
    }
  }
}
```

## 🔄 状态管理

```tsx
// 在 App.tsx 中
const hasConfig = githubConfig || giteeConfig;

// 侧边栏显示逻辑
<Sidebar>
  {/* 导航菜单 - 禁用但可见 */}
  <NavItem
    icon={<Image />}
    label={t('sidebar.photos')}
    disabled={!hasConfig}
    tooltip={!hasConfig ? t('sidebar.needSource') : undefined}
  />

  {/* 仓库源区域 */}
  {sources.length === 0 ? (
    <SidebarEmptyState onAddSource={handleAddSource} t={t} />
  ) : (
    <SourceList sources={sources} />
  )}
</Sidebar>;
```

## ✅ 优势

1. **保持界面一致性**：用户始终看到相同的布局结构
2. **降低学习成本**：配置前后界面结构一致
3. **提供清晰引导**：多个入口可以添加仓库源
4. **支持快速体验**：Demo 模式让用户快速了解功能
5. **友好的用户体验**：不会因为缺少配置而感到困惑
