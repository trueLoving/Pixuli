# 📚 Pixuli 文档网站

> Pixuli 官方文档网站，提供完整的产品介绍、使用教程和技术文档

这是 Pixuli 项目的官方文档网站，使用 Next.js 15+ App Router 和 React 构建，提供现代化的文档阅读体验。

## 🌟 项目特色

- **现代化设计** - 基于 Next.js 15+ 和 Tailwind CSS
- **纯 React 组件** - 使用 TypeScript 和 React 组件构建
- **响应式布局** - 完美适配桌面和移动设备
- **SEO 优化** - 完整的元数据和 Open Graph 支持
- **键盘导航** - 完整的键盘快捷键支持
- **多语言支持** - 中英文界面切换

## 🚀 快速开始

### 环境要求

- Node.js 18.0+ 
- pnpm 8.0+ (推荐) 或 npm 9.0+
- Git

### 安装依赖

```bash
# 使用 pnpm
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev
```

访问 [http://localhost:3001](http://localhost:3001) 查看网站。

### 构建生产版本

```bash
# 构建静态文件
pnpm build
```

## 📁 项目结构

```
docs/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx           # 首页
│   │   ├── layout.tsx         # 根布局
│   │   ├── globals.css        # 全局样式
│   │   ├── tutorial/          # 使用教程
│   │   │   └── page.tsx
│   │   ├── keyboard/          # 键盘功能
│   │   │   └── page.tsx
│   │   └── products/          # 产品矩阵
│   │       └── page.tsx
│   └── components/            # React 组件
│       └── Navigation.tsx     # 导航组件
├── public/                    # 静态资源
│   └── images/               # 图片资源
├── next.config.ts            # Next.js 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 项目依赖
```

## 🎨 技术栈

### 核心框架
- **Next.js 15.5.4** - React 全栈框架
- **React 19.1.0** - 用户界面库
- **TypeScript 5** - 类型安全的 JavaScript

### 样式和 UI
- **Tailwind CSS 3.3.2** - 实用优先的 CSS 框架
- **@tailwindcss/typography** - 排版插件
- **Font Awesome 6.4.0** - 图标库

### 构建工具
- **Turbopack** - Next.js 15 的快速构建工具
- **PostCSS** - CSS 后处理器
- **Autoprefixer** - CSS 前缀自动添加

## 📝 内容管理

### 添加新页面

1. 在 `src/app/` 目录下创建新的文件夹
2. 添加 `page.tsx` 文件
3. 在 `Navigation.tsx` 中添加导航链接

示例：
```bash
mkdir src/app/new-page
echo "export default function NewPage() { return <div>新页面</div>; }" > src/app/new-page/page.tsx
```

### 页面组件结构

所有页面都使用 React 函数组件：

```tsx
export default function PageName() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>页面标题</h1>
        <p>页面内容...</p>
      </div>
    </div>
  );
}
```

### 样式系统

使用 Tailwind CSS 的 prose 类进行内容排版：

- **标题** - 自动样式和间距
- **段落** - 优化的行间距
- **列表** - 自定义项目符号
- **代码块** - 语法高亮
- **表格** - 响应式表格样式
- **引用** - 左侧边框样式

## 🔧 开发指南

### 本地开发

1. **克隆仓库**
   ```bash
   git clone https://github.com/trueLoving/Pixuli.git
   cd Pixuli/docs
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **访问网站**
   打开 [http://localhost:3001](http://localhost:3001)

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件和 Hooks
- 使用 Tailwind CSS 进行样式管理

### 提交规范

使用 Conventional Commits 规范：

```bash
# 功能更新
git commit -m "feat: 添加产品矩阵页面"

# 修复问题
git commit -m "fix: 修复导航菜单样式"

# 文档更新
git commit -m "docs: 更新 README 文档"
```

## 🚀 部署指南

### Vercel 部署 (推荐)

1. **连接 GitHub 仓库**
   - 在 Vercel 中导入项目
   - 选择 `docs` 目录作为根目录

2. **配置环境变量**
   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```

3. **自动部署**
   - 推送到 `main` 分支自动触发部署
   - 预览分支自动生成预览链接

### 其他平台部署

#### Netlify
```bash
# 构建命令
npm run build

# 发布目录
.next
```

#### GitHub Pages
```bash
# 安装 gh-pages
npm install -g gh-pages

# 部署
npm run build
gh-pages -d .next
```

## 📊 性能优化

### 构建优化
- **Turbopack** - 使用 Next.js 15 的快速构建工具
- **静态生成** - 所有页面预渲染为静态文件
- **图片优化** - 使用 Next.js Image 组件
- **代码分割** - 自动代码分割和懒加载

### 运行时优化
- **CDN 加速** - 静态资源通过 CDN 分发
- **缓存策略** - 合理的缓存头设置
- **压缩** - Gzip/Brotli 压缩
- **预加载** - 关键资源预加载

## 🔍 SEO 优化

### 元数据配置
```typescript
export const metadata: Metadata = {
  title: "Pixuli - 智能图片管理应用",
  description: "现代化的跨平台图片管理桌面应用",
  keywords: "图片管理,图片处理,桌面应用",
  openGraph: {
    type: "website",
    url: "https://pixuli-docs.vercel.app/",
    title: "Pixuli - 智能图片管理应用",
    description: "智能图片处理和管理",
  },
};
```

### 结构化数据
- 使用 JSON-LD 格式
- 添加面包屑导航
- 实现站点地图
- 优化页面标题和描述

## 🐛 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清除缓存
rm -rf .next node_modules
pnpm install
pnpm build
```

#### 2. 样式不生效
- 检查 Tailwind CSS 配置
- 确认 `globals.css` 正确导入
- 验证 Tailwind 类名拼写

#### 3. 图片加载失败
- 检查 `public/images/` 目录
- 确认图片路径正确
- 使用 Next.js Image 组件

#### 4. 开发服务器启动失败
```bash
# 检查端口占用
lsof -ti:3001

# 使用其他端口
pnpm dev --port 3002
```

## 🤝 贡献指南

### 如何贡献

1. **Fork 项目**
   ```bash
   # Fork 到你的 GitHub 账户
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/new-feature
   ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

4. **推送分支**
   ```bash
   git push origin feature/new-feature
   ```

5. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 详细描述更改内容
   - 等待代码审查

### 贡献类型

- **文档更新** - 完善现有文档
- **新页面** - 添加新的文档页面
- **样式优化** - 改进 UI/UX 设计
- **功能增强** - 添加新功能
- **Bug 修复** - 修复已知问题

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../../LICENSE) 文件了解详情。

## 🔗 相关链接

- **项目主页**: [https://github.com/trueLoving/Pixuli](https://github.com/trueLoving/Pixuli)
- **在线文档**: [https://pixuli-docs.vercel.app](https://pixuli-docs.vercel.app)
- **Web 版应用**: [https://pixuli-web.vercel.app](https://pixuli-web.vercel.app)
- **问题反馈**: [GitHub Issues](https://github.com/trueLoving/Pixuli/issues)
- **功能建议**: [GitHub Discussions](https://github.com/trueLoving/Pixuli/discussions)

---

*最后更新：2025年10月*