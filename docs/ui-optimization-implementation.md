# Pixuli 界面优化实现方案

## 🎯 核心组件设计

### 1. 新布局结构

```
App.tsx
├── Layout (新布局容器)
│   ├── Sidebar (左侧导航栏)
│   │   ├── NavigationMenu (主要导航)
│   │   ├── SourceList (仓库源列表)
│   │   └── FooterActions (底部操作)
│   ├── Header (顶部栏)
│   │   ├── Logo
│   │   ├── SearchBar (搜索栏)
│   │   └── ActionButtons (操作按钮)
│   └── MainContent (主内容区)
│       ├── UploadArea (上传区域，可折叠)
│       └── ImageGrid (图片网格)
```

## 📦 组件实现示例

### Sidebar 组件结构

```tsx
// packages/common/src/components/sidebar/Sidebar.tsx
interface SidebarProps {
  currentView: 'photos' | 'explore' | 'tags' | 'favorites' | 'settings';
  onViewChange: (view: string) => void;
  sources: Source[];
  selectedSourceId: string | null;
  onSourceSelect: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  t: (key: string) => string;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  sources,
  selectedSourceId,
  onSourceSelect,
  collapsed,
  onToggleCollapse,
  t,
}) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <h2>Pixuli</h2>
        {!collapsed && <button onClick={onToggleCollapse}>收起</button>}
      </div>

      {/* 主要导航 */}
      <nav className="sidebar-nav">
        <NavItem
          icon={<Image />}
          label={t('sidebar.photos')}
          active={currentView === 'photos'}
          onClick={() => onViewChange('photos')}
        />
        <NavItem
          icon={<Compass />}
          label={t('sidebar.explore')}
          active={currentView === 'explore'}
          onClick={() => onViewChange('explore')}
        />
        <NavItem
          icon={<Tag />}
          label={t('sidebar.tags')}
          active={currentView === 'tags'}
          onClick={() => onViewChange('tags')}
        />
        <NavItem
          icon={<Heart />}
          label={t('sidebar.favorites')}
          active={currentView === 'favorites'}
          onClick={() => onViewChange('favorites')}
        />
      </nav>

      {/* 仓库源列表 */}
      <div className="sidebar-sources">
        <div className="sidebar-section-header">
          <span>{t('sidebar.sources')}</span>
          <button
            onClick={() => {
              /* 添加源 */
            }}
          >
            <Plus />
          </button>
        </div>
        <SourceList
          sources={sources}
          selectedId={selectedSourceId}
          onSelect={onSourceSelect}
        />
      </div>

      {/* 底部操作 */}
      <div className="sidebar-footer">
        <NavItem
          icon={<Settings />}
          label={t('sidebar.settings')}
          active={currentView === 'settings'}
          onClick={() => onViewChange('settings')}
        />
        <NavItem
          icon={<HelpCircle />}
          label={t('sidebar.help')}
          onClick={() => {
            /* 打开帮助 */
          }}
        />
      </div>
    </aside>
  );
};
```

### Header 组件优化

```tsx
// packages/common/src/components/header/Header.tsx
interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUpload: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCount: number;
  onBatchAction: (action: string) => void;
  t: (key: string) => string;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onUpload,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  selectedCount,
  onBatchAction,
  t,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">Pixuli</h1>
      </div>

      <div className="header-center">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={t('header.search.placeholder')}
        />
      </div>

      <div className="header-right">
        {selectedCount > 0 && (
          <BatchActions count={selectedCount} onAction={onBatchAction} />
        )}
        <button onClick={onUpload} className="upload-button">
          <Upload /> {t('header.upload')}
        </button>
        <ViewToggle mode={viewMode} onChange={onViewModeChange} />
        <SortDropdown value={sortBy} onChange={onSortChange} />
        <LanguageSwitcher />
        <SettingsButton />
        <HelpButton />
      </div>
    </header>
  );
};
```

### 搜索栏组件

```tsx
// packages/common/src/components/search/SearchBar.tsx
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 快捷键 '/' 聚焦搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused) {
        e.preventDefault();
        // 聚焦搜索框
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  return (
    <div className="search-bar">
      <Search className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="search-input"
      />
      {value && (
        <button onClick={() => onChange('')} className="search-clear">
          <X />
        </button>
      )}
      {isFocused && suggestions.length > 0 && (
        <SearchSuggestions suggestions={suggestions} />
      )}
    </div>
  );
};
```

### 日期分组组件

```tsx
// packages/common/src/components/image-browser/DateGroupedImageGrid.tsx
const DateGroupedImageGrid: React.FC<Props> = ({ images }) => {
  const groupedImages = useMemo(() => {
    return groupImagesByDate(images);
  }, [images]);

  return (
    <div className="date-grouped-grid">
      {Object.entries(groupedImages).map(([dateLabel, dateImages]) => (
        <div key={dateLabel} className="date-group">
          <h2 className="date-group-header">{dateLabel}</h2>
          <ImageGrid images={dateImages} />
        </div>
      ))}
    </div>
  );
};

function groupImagesByDate(images: ImageItem[]) {
  const groups: Record<string, ImageItem[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  images.forEach(image => {
    const imageDate = new Date(image.createdAt);
    let label: string;

    if (imageDate >= today) {
      label = '今天';
    } else if (imageDate >= new Date(today.getTime() - 86400000)) {
      label = '昨天';
    } else if (imageDate >= new Date(today.getTime() - 7 * 86400000)) {
      label = '本周';
    } else if (
      imageDate >= new Date(today.getFullYear(), today.getMonth(), 1)
    ) {
      label = '本月';
    } else {
      label = formatDateGroup(imageDate);
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(image);
  });

  return groups;
}
```

### 时间轴导航组件

```tsx
// packages/common/src/components/timeline/YearTimeline.tsx
const YearTimeline: React.FC<Props> = ({ images, onYearSelect }) => {
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    images.forEach(img => {
      const year = new Date(img.createdAt).getFullYear();
      yearSet.add(year);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [images]);

  return (
    <div className="year-timeline">
      {years.map(year => (
        <button
          key={year}
          onClick={() => onYearSelect(year)}
          className="year-item"
        >
          {year}
        </button>
      ))}
    </div>
  );
};
```

## 🎨 CSS 样式建议

### Sidebar 样式

```css
.sidebar {
  width: 240px;
  height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar.collapsed {
  transform: translateX(-240px);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s;
}

.nav-item:hover {
  background: var(--hover-bg);
}

.nav-item.active {
  background: var(--active-bg);
  color: var(--text-primary);
  border-left: 3px solid var(--primary-color);
}
```

### Header 样式

```css
.app-header {
  height: 64px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-center {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  align-items: center;
  background: var(--search-bg);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  margin-left: 0.5rem;
}
```

## 🔄 迁移步骤

### Step 1: 创建新组件（不破坏现有功能）

1. 在 `packages/common/src/components` 下创建：
   - `sidebar/` - 侧边栏组件
   - `header/` - 优化后的顶部栏
   - `search/` - 搜索组件
   - `timeline/` - 时间轴组件

2. 创建新的布局组件 `Layout.tsx`

### Step 2: 渐进式迁移

1. **Web 端先迁移**
   - 创建新的 `AppV2.tsx` 使用新布局
   - 通过路由或开关切换新旧版本
   - 测试和优化

2. **桌面端迁移**
   - 复用 Web 端的组件
   - 适配 Electron 特定功能

### Step 3: 功能增强

1. 添加搜索功能
2. 实现日期分组
3. 添加时间轴导航
4. 优化交互体验

## 📋 待实现功能清单

- [ ] 创建 Sidebar 组件
- [ ] 优化 Header 组件（添加搜索栏）
- [ ] 创建新的 Layout 布局
- [ ] 实现日期分组显示
- [ ] 添加时间轴导航
- [ ] 实现全局搜索功能
- [ ] 优化响应式设计
- [ ] 添加键盘快捷键
- [ ] 实现右键菜单
- [ ] 优化拖拽上传体验

## 🎯 优先级

### P0 (必须)

1. Sidebar 组件
2. Header 优化（搜索栏）
3. 新布局结构

### P1 (重要)

4. 日期分组
5. 搜索功能
6. 响应式优化

### P2 (可选)

7. 时间轴导航
8. 右键菜单
9. 高级搜索
