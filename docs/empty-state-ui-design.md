# 未配置仓库源时的界面交互设计

## 🎯 设计目标

当用户首次使用或没有配置仓库源时，提供：

1. **清晰的引导**：告诉用户需要做什么
2. **快速开始**：让用户能够快速完成配置
3. **保持导航可见**：即使没有数据，也要保持界面结构
4. **友好的体验**：减少用户的困惑和操作步骤

## 📐 设计方案

### 方案一：保持完整布局 + 引导内容（推荐）

**优点：**

- 用户可以看到完整的界面结构
- 不会因为缺少配置而完全改变布局
- 符合 Immich 的设计理念
- 配置后无缝切换

**布局结构：**

```
┌─────────────────────────────────────────────────────────┐
│  Header (正常显示)                                        │
│  [Logo] [搜索栏(禁用)]              [设置] [帮助]          │
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│  Sidebar │  Empty State (引导内容)                       │
│  (左侧)   │                                               │
│          │  ┌─────────────────────────────────────┐    │
│  导航菜单 │  │  欢迎使用 Pixuli                     │    │
│  (灰色)   │  │                                     │    │
│          │  │  [添加第一个仓库源]                   │    │
│  - 照片   │  │                                     │    │
│  - 探索   │  │  或 [体验 Demo 模式]                 │    │
│  - 标签   │  │                                     │    │
│          │  └─────────────────────────────────────┘    │
│  仓库源   │                                               │
│  ┌─────┐ │  快速开始指南：                              │
│  │ +   │ │  • 配置 GitHub 仓库                         │
│  │添加 │ │  • 配置 Gitee 仓库                          │
│  └─────┘ │  • 查看使用教程                             │
│          │                                               │
└──────────┴──────────────────────────────────────────────┘
```

### 方案二：简化布局 + 欢迎页面

**优点：**

- 更专注于引导用户配置
- 减少干扰元素

**缺点：**

- 用户看不到完整界面
- 配置后需要切换布局

## 🎨 推荐实现：方案一

### 1. 侧边栏状态

#### 导航菜单（禁用但可见）

```tsx
<nav className="sidebar-nav">
  <NavItem
    icon={<Image />}
    label="照片"
    disabled={true}
    tooltip="请先添加仓库源"
  />
  <NavItem
    icon={<Compass />}
    label="探索"
    disabled={true}
    tooltip="请先添加仓库源"
  />
  // ... 其他导航项
</nav>
```

#### 仓库源区域（突出显示）

```tsx
<div className="sidebar-sources">
  <div className="empty-source-prompt">
    <div className="empty-source-icon">
      <Plus size={24} />
    </div>
    <p className="empty-source-text">添加第一个仓库源</p>
    <button onClick={handleAddSource} className="add-source-button">
      添加仓库源
    </button>
  </div>
</div>
```

### 2. 主内容区域

#### 空状态组件

```tsx
<EmptyState>
  <EmptyStateIcon>
    <ImageIcon size={64} />
  </EmptyStateIcon>

  <EmptyStateTitle>欢迎使用 Pixuli</EmptyStateTitle>

  <EmptyStateDescription>
    开始管理您的图片库，首先需要添加一个仓库源
  </EmptyStateDescription>

  <EmptyStateActions>
    <PrimaryButton onClick={handleAddGitHub}>
      <Github /> 配置 GitHub
    </PrimaryButton>
    <PrimaryButton onClick={handleAddGitee}>
      <GiteeIcon /> 配置 Gitee
    </PrimaryButton>
    <SecondaryButton onClick={handleTryDemo}>
      <Play /> 体验 Demo 模式
    </SecondaryButton>
  </EmptyStateActions>

  <EmptyStateGuide>
    <GuideSection>
      <h3>快速开始</h3>
      <GuideSteps>
        <Step>
          <StepNumber>1</StepNumber>
          <StepText>选择 GitHub 或 Gitee</StepText>
        </Step>
        <Step>
          <StepNumber>2</StepNumber>
          <StepText>填写仓库信息</StepText>
        </Step>
        <Step>
          <StepNumber>3</StepNumber>
          <StepText>开始上传和管理图片</StepText>
        </Step>
      </GuideSteps>
    </GuideSection>

    <GuideSection>
      <h3>需要帮助？</h3>
      <GuideLinks>
        <Link href="/docs/getting-started">使用教程</Link>
        <Link href="/docs/faq">常见问题</Link>
        <Link href="/docs/github-setup">GitHub 配置指南</Link>
        <Link href="/docs/gitee-setup">Gitee 配置指南</Link>
      </GuideLinks>
    </GuideSection>
  </EmptyStateGuide>
</EmptyState>
```

### 3. 顶部栏状态

#### 搜索栏（禁用但可见）

```tsx
<SearchBar disabled={true} placeholder="添加仓库源后即可搜索图片" />
```

#### 操作按钮

- **上传按钮**：禁用，显示 tooltip "请先添加仓库源"
- **设置按钮**：可用（可以配置）
- **帮助按钮**：可用

## 🔄 交互流程

### 流程 1：从侧边栏添加

```
用户点击侧边栏的 "添加仓库源"
  → 打开添加源对话框
  → 选择 GitHub 或 Gitee
  → 填写配置信息
  → 保存后自动加载图片
  → 界面切换到正常状态
```

### 流程 2：从主内容区添加

```
用户点击主内容区的 "配置 GitHub" 或 "配置 Gitee"
  → 打开配置模态框
  → 填写配置信息
  → 保存后自动加载图片
  → 界面切换到正常状态
```

### 流程 3：Demo 模式

```
用户点击 "体验 Demo 模式"
  → 使用预设的 Demo 配置
  → 自动加载 Demo 图片
  → 显示 Demo 模式提示
  → 用户可以随时退出 Demo 模式
```

## 💡 优化细节

### 1. 渐进式引导

**首次访问：**

- 显示完整的引导界面
- 突出显示"添加仓库源"按钮
- 显示快速开始指南

**返回访问（但未配置）：**

- 简化引导界面
- 只显示核心操作按钮
- 隐藏详细指南（可展开）

### 2. 智能提示

```tsx
// 检测用户行为，提供智能提示
if (userVisitedBefore && !hasConfig) {
  showBanner('您之前访问过，是否要恢复之前的配置？');
}

if (userHasGitHubAccount) {
  showSuggestion('检测到您有 GitHub 账号，推荐使用 GitHub 存储');
}
```

### 3. 配置向导

对于新用户，可以提供分步配置向导：

```tsx
<ConfigurationWizard>
  <WizardStep step={1} title="选择存储平台">
    <PlatformSelector onSelect={platform => setSelectedPlatform(platform)} />
  </WizardStep>

  <WizardStep step={2} title="填写仓库信息">
    <RepositoryForm platform={selectedPlatform} onSubmit={handleSubmit} />
  </WizardStep>

  <WizardStep step={3} title="验证连接">
    <ConnectionTest config={config} onSuccess={handleSuccess} />
  </WizardStep>
</ConfigurationWizard>
```

### 4. 示例和预览

```tsx
<EmptyState>
  {/* ... 其他内容 ... */}

  <PreviewSection>
    <h3>功能预览</h3>
    <FeatureGrid>
      <FeatureCard
        icon={<Upload />}
        title="快速上传"
        description="支持拖拽上传，批量处理"
        preview={uploadPreviewImage}
      />
      <FeatureCard
        icon={<Search />}
        title="智能搜索"
        description="按标签、描述快速查找"
        preview={searchPreviewImage}
      />
      <FeatureCard
        icon={<Tag />}
        title="标签管理"
        description="自动生成标签，轻松分类"
        preview={tagPreviewImage}
      />
    </FeatureGrid>
  </PreviewSection>
</EmptyState>
```

## 🎯 实现建议

### 组件结构

```
packages/common/src/components/
├── empty-state/
│   ├── EmptyState.tsx          # 空状态容器
│   ├── EmptyStateIcon.tsx      # 图标
│   ├── EmptyStateTitle.tsx     # 标题
│   ├── EmptyStateDescription.tsx # 描述
│   ├── EmptyStateActions.tsx   # 操作按钮
│   └── EmptyStateGuide.tsx     # 引导内容
├── onboarding/
│   ├── WelcomeScreen.tsx       # 欢迎界面
│   ├── ConfigurationWizard.tsx # 配置向导
│   └── QuickStartGuide.tsx     # 快速开始指南
```

### 状态管理

```tsx
// stores/onboardingStore.ts
interface OnboardingState {
  isFirstVisit: boolean;
  hasSeenWelcome: boolean;
  currentStep: number;
  showGuide: boolean;
}

// 检测首次访问
useEffect(() => {
  const hasVisited = localStorage.getItem('pixuli-has-visited');
  if (!hasVisited) {
    setOnboardingState({
      isFirstVisit: true,
      hasSeenWelcome: false,
    });
    localStorage.setItem('pixuli-has-visited', 'true');
  }
}, []);
```

## 📱 响应式设计

### 桌面端

- 完整布局：侧边栏 + 主内容区
- 引导内容居中显示
- 显示完整的功能预览

### 移动端

- 隐藏侧边栏（抽屉式）
- 引导内容全屏显示
- 简化操作按钮

## ✅ 最佳实践

1. **保持界面结构一致**
   - 即使没有数据，也要显示完整的布局
   - 避免完全不同的界面切换

2. **提供多种入口**
   - 侧边栏可以添加
   - 主内容区可以添加
   - 顶部栏可以添加

3. **清晰的视觉引导**
   - 使用高对比度的按钮
   - 添加动画效果吸引注意
   - 使用图标和插图

4. **减少操作步骤**
   - 一键配置（如果可能）
   - 记住用户的选择
   - 提供快速模板

5. **友好的错误处理**
   - 配置失败时给出明确提示
   - 提供解决方案链接
   - 允许重试

## 🔄 状态转换

```
未配置状态
  ↓ (用户添加仓库源)
配置中状态 (显示加载)
  ↓ (配置成功)
正常状态 (显示图片)
  ↓ (用户删除所有源)
未配置状态 (显示引导)
```

## 📋 实现清单

- [ ] 创建 EmptyState 组件
- [ ] 创建 Onboarding 组件
- [ ] 实现侧边栏空状态
- [ ] 实现主内容区引导界面
- [ ] 添加配置向导
- [ ] 实现 Demo 模式入口
- [ ] 添加快速开始指南
- [ ] 实现状态转换逻辑
- [ ] 优化响应式设计
- [ ] 添加动画效果
