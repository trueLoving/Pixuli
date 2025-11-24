import PageLayout from '../../components/PageLayout';

export default function PWADesignPage() {
  return (
    <PageLayout
      title="Web 端 PWA 设计思路方案"
      subtitle="完整的 PWA 功能设计文档，涵盖架构设计、缓存策略、离线功能和用户体验优化"
      icon="fas fa-mobile-alt"
    >
      <div className="content-card">
        <h1>📱 Web 端 PWA 设计思路方案</h1>

        <p>
          本文档详细描述了 Pixuli Web 端 PWA（Progressive Web
          App）功能的完整设计思路，包括架构设计、缓存策略、离线功能、后台同步、推送通知等核心功能的实现方案。
        </p>

        <hr />

        <h2>📋 目录</h2>
        <ul>
          <li>
            <a href="#overview">概述</a>
          </li>
          <li>
            <a href="#design-goals">设计目标</a>
          </li>
          <li>
            <a href="#architecture">架构设计</a>
          </li>
          <li>
            <a href="#cache-strategy">缓存策略设计</a>
          </li>
          <li>
            <a href="#offline-features">离线功能设计</a>
          </li>
          <li>
            <a href="#background-sync">后台同步设计</a>
          </li>
          <li>
            <a href="#push-notification">推送通知设计</a>
          </li>
          <li>
            <a href="#user-experience">用户体验设计</a>
          </li>
          <li>
            <a href="#implementation">实现方案</a>
          </li>
          <li>
            <a href="#best-practices">最佳实践</a>
          </li>
        </ul>

        <hr />

        <h2 id="overview">🎯 概述</h2>

        <p>
          PWA（Progressive Web App）是一种结合了 Web 和原生应用优势的 Web
          应用技术。Pixuli Web 端通过实现完整的 PWA
          功能，为用户提供接近原生应用的体验，包括：
        </p>

        <ul>
          <li>
            <strong>可安装性</strong>
            ：用户可以将应用安装到主屏幕，像原生应用一样使用
          </li>
          <li>
            <strong>离线能力</strong>
            ：在网络不稳定或离线状态下，用户仍可浏览已缓存的图片
          </li>
          <li>
            <strong>后台同步</strong>：离线时的操作会在网络恢复后自动同步
          </li>
          <li>
            <strong>推送通知</strong>：支持服务器推送通知，及时提醒用户重要信息
          </li>
          <li>
            <strong>快速加载</strong>：通过智能缓存策略，实现秒开体验
          </li>
        </ul>

        <hr />

        <h2 id="design-goals">🎯 设计目标</h2>

        <h3>核心目标</h3>
        <ul>
          <li>
            <strong>离线优先</strong>
            ：确保核心功能在离线状态下可用，提升用户体验
          </li>
          <li>
            <strong>性能优化</strong>
            ：通过智能缓存策略，减少网络请求，提升加载速度
          </li>
          <li>
            <strong>数据一致性</strong>
            ：通过后台同步机制，确保离线操作的数据一致性
          </li>
          <li>
            <strong>用户体验</strong>：提供清晰的状态反馈，让用户了解应用状态
          </li>
          <li>
            <strong>可维护性</strong>：采用模块化设计，便于维护和扩展
          </li>
        </ul>

        <h3>技术目标</h3>
        <ul>
          <li>
            <strong>兼容性</strong>：支持现代浏览器，优雅降级处理不支持的场景
          </li>
          <li>
            <strong>可扩展性</strong>：设计灵活的架构，便于添加新的 PWA 功能
          </li>
          <li>
            <strong>可测试性</strong>：提供完善的测试方案，确保功能稳定性
          </li>
        </ul>

        <hr />

        <h2 id="architecture">🏗️ 架构设计</h2>

        <h3>整体架构</h3>
        <p>
          PWA 功能采用分层架构，包含 Service Worker 层、服务层、状态管理层和 UI
          组件层：
        </p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`┌─────────────────────────────────────────────────┐
│            UI 组件层 (Components)                │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ 安装提示组件  │  │ 离线指示器    │           │
│  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         状态管理层 (State Management)            │
│  ┌──────────────────────────────────────────┐   │
│  │  imageStore (集成后台同步)                │   │
│  │  - 图片上传/删除/更新                      │   │
│  │  - 离线操作队列管理                        │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           服务层 (Services)                      │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ pwaService   │  │ background   │            │
│  │              │  │ SyncService  │            │
│  │ - SW注册     │  │              │            │
│  │ - 更新管理   │  │ - 操作队列   │            │
│  │ - 缓存管理   │  │ - 同步执行   │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐                              │
│  │ push         │                              │
│  │ Notification │                              │
│  │ Service      │                              │
│  │              │                              │
│  │ - 订阅管理   │                              │
│  │ - 通知显示   │                              │
│  └──────────────┘                              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      Service Worker 层 (Service Worker)          │
│  ┌──────────────────────────────────────────┐   │
│  │  sw.js (自定义 Service Worker)          │   │
│  │                                          │   │
│  │  - 缓存策略实现                          │   │
│  │  - 后台同步处理                          │   │
│  │  - 推送通知处理                          │   │
│  │  - 离线资源管理                          │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           存储层 (Storage)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Cache    │  │ IndexedDB│  │ Local    │      │
│  │ Storage │  │          │  │ Storage  │      │
│  │          │  │ - 同步   │  │          │      │
│  │ - 资源   │  │   队列   │  │ - 配置   │      │
│  │   缓存   │  │          │  │          │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘`}
          </pre>
        </div>

        <h3>核心组件</h3>

        <h4>1. Service Worker (sw.js)</h4>
        <ul>
          <li>
            <strong>职责</strong>
            ：处理网络请求、管理缓存、执行后台同步、处理推送通知
          </li>
          <li>
            <strong>生命周期</strong>：安装 → 激活 → 运行 → 更新
          </li>
          <li>
            <strong>关键事件</strong>
            ：install、activate、fetch、sync、push、message
          </li>
        </ul>

        <h4>2. PWA Service (pwaService.ts)</h4>
        <ul>
          <li>
            <strong>职责</strong>：Service Worker
            注册、更新管理、缓存管理、事件通信
          </li>
          <li>
            <strong>功能</strong>：统一的 PWA API 封装，简化上层调用
          </li>
        </ul>

        <h4>3. Background Sync Service (backgroundSyncService.ts)</h4>
        <ul>
          <li>
            <strong>职责</strong>：管理离线操作队列、执行后台同步、处理同步失败
          </li>
          <li>
            <strong>存储</strong>：使用 IndexedDB 持久化待同步操作
          </li>
        </ul>

        <h4>4. Push Notification Service (pushNotificationService.ts)</h4>
        <ul>
          <li>
            <strong>职责</strong>：管理推送订阅、显示通知、处理通知点击
          </li>
          <li>
            <strong>支持</strong>：VAPID 密钥、订阅管理、权限管理
          </li>
        </ul>

        <hr />

        <h2 id="cache-strategy">💾 缓存策略设计</h2>

        <h3>设计原则</h3>
        <ul>
          <li>
            <strong>资源分类</strong>：根据资源类型和更新频率选择不同的缓存策略
          </li>
          <li>
            <strong>时效性平衡</strong>：在数据新鲜度和性能之间找到平衡
          </li>
          <li>
            <strong>存储限制</strong>
            ：合理设置缓存大小和过期时间，避免占用过多存储空间
          </li>
        </ul>

        <h3>缓存策略矩阵</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">资源类型</th>
                <th className="border border-gray-300 px-4 py-2">策略</th>
                <th className="border border-gray-300 px-4 py-2">过期时间</th>
                <th className="border border-gray-300 px-4 py-2">最大条目</th>
                <th className="border border-gray-300 px-4 py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">GitHub API</td>
                <td className="border border-gray-300 px-4 py-2">
                  NetworkFirst
                </td>
                <td className="border border-gray-300 px-4 py-2">24 小时</td>
                <td className="border border-gray-300 px-4 py-2">50</td>
                <td className="border border-gray-300 px-4 py-2">
                  优先网络，失败时使用缓存，10秒超时
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  GitHub 图片
                </td>
                <td className="border border-gray-300 px-4 py-2">CacheFirst</td>
                <td className="border border-gray-300 px-4 py-2">7 天</td>
                <td className="border border-gray-300 px-4 py-2">100</td>
                <td className="border border-gray-300 px-4 py-2">
                  优先缓存，图片更新频率低
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">本地图片</td>
                <td className="border border-gray-300 px-4 py-2">CacheFirst</td>
                <td className="border border-gray-300 px-4 py-2">30 天</td>
                <td className="border border-gray-300 px-4 py-2">200</td>
                <td className="border border-gray-300 px-4 py-2">
                  长期缓存，支持离线浏览
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">静态资源</td>
                <td className="border border-gray-300 px-4 py-2">CacheFirst</td>
                <td className="border border-gray-300 px-4 py-2">1 年</td>
                <td className="border border-gray-300 px-4 py-2">100</td>
                <td className="border border-gray-300 px-4 py-2">
                  JS/CSS 等静态文件，版本化更新
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>缓存策略详解</h3>

        <h4>NetworkFirst 策略</h4>
        <p>
          <strong>适用场景</strong>：需要实时数据的 API 请求
        </p>
        <p>
          <strong>工作流程</strong>：
        </p>
        <ol>
          <li>首先尝试网络请求</li>
          <li>如果网络请求成功，更新缓存并返回响应</li>
          <li>如果网络请求失败（超时或错误），从缓存返回</li>
          <li>如果缓存也没有，返回错误</li>
        </ol>
        <p>
          <strong>优势</strong>：保证数据新鲜度，同时提供离线降级
        </p>

        <h4>CacheFirst 策略</h4>
        <p>
          <strong>适用场景</strong>：更新频率低的静态资源（图片、CSS、JS）
        </p>
        <p>
          <strong>工作流程</strong>：
        </p>
        <ol>
          <li>首先检查缓存</li>
          <li>如果缓存存在，直接返回</li>
          <li>如果缓存不存在，请求网络并更新缓存</li>
        </ol>
        <p>
          <strong>优势</strong>：快速响应，减少网络请求，节省带宽
        </p>

        <hr />

        <h2 id="offline-features">📴 离线功能设计</h2>

        <h3>离线能力矩阵</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">功能</th>
                <th className="border border-gray-300 px-4 py-2">在线</th>
                <th className="border border-gray-300 px-4 py-2">离线</th>
                <th className="border border-gray-300 px-4 py-2">实现方式</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">浏览图片</td>
                <td className="border border-gray-300 px-4 py-2">✅</td>
                <td className="border border-gray-300 px-4 py-2">✅</td>
                <td className="border border-gray-300 px-4 py-2">
                  从缓存加载已缓存的图片
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">上传图片</td>
                <td className="border border-gray-300 px-4 py-2">✅</td>
                <td className="border border-gray-300 px-4 py-2">⏳</td>
                <td className="border border-gray-300 px-4 py-2">
                  添加到同步队列，网络恢复后自动上传
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">删除图片</td>
                <td className="border border-gray-300 px-4 py-2">✅</td>
                <td className="border border-gray-300 px-4 py-2">⏳</td>
                <td className="border border-gray-300 px-4 py-2">
                  乐观更新 + 后台同步
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">更新图片</td>
                <td className="border border-gray-300 px-4 py-2">✅</td>
                <td className="border border-gray-300 px-4 py-2">⏳</td>
                <td className="border border-gray-300 px-4 py-2">
                  乐观更新 + 后台同步
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">搜索图片</td>
                <td className="border border-gray-300 px-4 py-2">✅</td>
                <td className="border border-gray-300 px-4 py-2">✅</td>
                <td className="border border-gray-300 px-4 py-2">
                  在本地缓存数据中搜索
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>离线状态管理</h3>

        <h4>状态检测</h4>
        <ul>
          <li>
            <strong>在线/离线事件</strong>：监听 `online` 和 `offline` 事件
          </li>
          <li>
            <strong>网络状态 API</strong>：使用 `navigator.onLine` 检测网络状态
          </li>
          <li>
            <strong>实际网络检测</strong>：通过实际请求检测网络可用性
          </li>
        </ul>

        <h4>状态指示</h4>
        <ul>
          <li>
            <strong>离线横幅</strong>：显示离线状态和缓存信息
          </li>
          <li>
            <strong>同步状态</strong>：显示待同步操作数量
          </li>
          <li>
            <strong>缓存大小</strong>：显示已缓存资源大小
          </li>
        </ul>

        <hr />

        <h2 id="background-sync">🔄 后台同步设计</h2>

        <h3>设计目标</h3>
        <ul>
          <li>
            <strong>数据一致性</strong>：确保离线操作最终同步到服务器
          </li>
          <li>
            <strong>用户体验</strong>：离线操作立即生效（乐观更新）
          </li>
          <li>
            <strong>可靠性</strong>：支持重试机制，处理同步失败
          </li>
        </ul>

        <h3>同步流程</h3>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`用户操作（离线）
    ↓
检测网络状态
    ↓
添加到同步队列（IndexedDB）
    ↓
乐观更新 UI（立即反馈）
    ↓
注册后台同步（Background Sync API）
    ↓
[网络恢复]
    ↓
Service Worker 触发同步事件
    ↓
从 IndexedDB 读取待同步操作
    ↓
逐个执行同步操作
    ↓
成功 → 从队列移除
失败 → 保留在队列，下次重试
    ↓
更新 UI 状态`}
          </pre>
        </div>

        <h3>操作类型</h3>

        <h4>1. 图片上传</h4>
        <ul>
          <li>
            <strong>离线处理</strong>：创建临时图片项，使用本地预览 URL
          </li>
          <li>
            <strong>同步执行</strong>：实际上传图片到 GitHub
          </li>
          <li>
            <strong>结果处理</strong>：更新图片项，替换临时 ID
          </li>
        </ul>

        <h4>2. 图片删除</h4>
        <ul>
          <li>
            <strong>离线处理</strong>：立即从 UI 移除（乐观更新）
          </li>
          <li>
            <strong>同步执行</strong>：从 GitHub 删除文件
          </li>
          <li>
            <strong>失败处理</strong>：恢复图片项到 UI
          </li>
        </ul>

        <h4>3. 图片更新</h4>
        <ul>
          <li>
            <strong>离线处理</strong>：立即更新 UI（乐观更新）
          </li>
          <li>
            <strong>同步执行</strong>：更新 GitHub 元数据文件
          </li>
          <li>
            <strong>失败处理</strong>：回滚到原始状态
          </li>
        </ul>

        <h3>重试机制</h3>
        <ul>
          <li>
            <strong>自动重试</strong>：Background Sync API 自动重试失败的操作
          </li>
          <li>
            <strong>重试限制</strong>：避免无限重试，设置最大重试次数
          </li>
          <li>
            <strong>错误处理</strong>：记录失败原因，便于调试
          </li>
        </ul>

        <hr />

        <h2 id="push-notification">🔔 推送通知设计</h2>

        <h3>设计目标</h3>
        <ul>
          <li>
            <strong>及时性</strong>：重要事件及时通知用户
          </li>
          <li>
            <strong>用户控制</strong>：用户可以选择是否接收通知
          </li>
          <li>
            <strong>交互性</strong>：通知可点击，直接跳转到相关页面
          </li>
        </ul>

        <h3>通知类型</h3>

        <h4>1. 系统通知</h4>
        <ul>
          <li>
            <strong>应用更新</strong>：新版本可用时通知
          </li>
          <li>
            <strong>同步完成</strong>：后台同步完成时通知
          </li>
          <li>
            <strong>同步失败</strong>：同步失败时通知用户
          </li>
        </ul>

        <h4>2. 业务通知（未来扩展）</h4>
        <ul>
          <li>
            <strong>图片上传完成</strong>：批量上传完成时通知
          </li>
          <li>
            <strong>存储空间警告</strong>：存储空间不足时通知
          </li>
        </ul>

        <h3>订阅流程</h3>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`用户点击"订阅通知"
    ↓
检查通知权限
    ↓
[未授权] → 请求权限
    ↓
[已授权] → 创建推送订阅
    ↓
获取订阅信息（endpoint + keys）
    ↓
发送订阅信息到服务器
    ↓
服务器保存订阅信息
    ↓
服务器可以发送推送通知`}
          </pre>
        </div>

        <h3>通知处理</h3>
        <ul>
          <li>
            <strong>显示通知</strong>：Service Worker 接收推送并显示
          </li>
          <li>
            <strong>点击处理</strong>：点击通知时聚焦或打开应用窗口
          </li>
          <li>
            <strong>关闭处理</strong>：自动关闭或用户手动关闭
          </li>
        </ul>

        <hr />

        <h2 id="user-experience">✨ 用户体验设计</h2>

        <h3>安装体验</h3>

        <h4>安装提示</h4>
        <ul>
          <li>
            <strong>触发时机</strong>：检测到 `beforeinstallprompt` 事件
          </li>
          <li>
            <strong>显示条件</strong>：未安装且 24 小时内未关闭过提示
          </li>
          <li>
            <strong>UI 设计</strong>：友好的提示卡片，清晰的安装按钮
          </li>
        </ul>

        <h4>安装流程</h4>
        <ol>
          <li>用户点击"安装"按钮</li>
          <li>调用 `prompt()` 显示浏览器安装对话框</li>
          <li>用户确认后，应用安装到主屏幕</li>
          <li>应用以独立窗口模式打开</li>
        </ol>

        <h3>更新体验</h3>

        <h4>更新检测</h4>
        <ul>
          <li>
            <strong>自动检测</strong>：Service Worker 更新时自动检测
          </li>
          <li>
            <strong>更新提示</strong>：显示更新提示卡片
          </li>
          <li>
            <strong>一键更新</strong>：点击更新按钮，跳过等待并刷新
          </li>
        </ul>

        <h4>更新策略</h4>
        <ul>
          <li>
            <strong>开发环境</strong>：禁用自动刷新，避免开发时死循环
          </li>
          <li>
            <strong>生产环境</strong>：延迟刷新，确保用户看到更新提示
          </li>
        </ul>

        <h3>状态反馈</h3>

        <h4>离线指示器</h4>
        <ul>
          <li>
            <strong>在线状态</strong>：绿色横幅，显示"网络连接已恢复"
          </li>
          <li>
            <strong>离线状态</strong>：黄色横幅，显示离线提示和缓存大小
          </li>
          <li>
            <strong>同步状态</strong>：蓝色横幅，显示待同步操作数量
          </li>
        </ul>

        <h4>操作反馈</h4>
        <ul>
          <li>
            <strong>离线操作</strong>：显示"已添加到同步队列"提示
          </li>
          <li>
            <strong>同步完成</strong>：显示同步成功提示
          </li>
          <li>
            <strong>同步失败</strong>：显示错误信息，提供重试选项
          </li>
        </ul>

        <hr />

        <h2 id="implementation">🛠️ 实现方案</h2>

        <h3>技术栈</h3>
        <ul>
          <li>
            <strong>Service Worker</strong>：自定义 Service Worker（sw.js）
          </li>
          <li>
            <strong>Workbox</strong>：Vite PWA 插件，简化 Service Worker 配置
          </li>
          <li>
            <strong>IndexedDB</strong>：存储待同步操作队列
          </li>
          <li>
            <strong>Background Sync API</strong>：后台同步功能
          </li>
          <li>
            <strong>Push API</strong>：推送通知功能
          </li>
        </ul>

        <h3>文件结构</h3>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`apps/web/
├── public/
│   └── sw.js                    # 自定义 Service Worker
├── src/
│   ├── services/
│   │   ├── pwaService.ts        # PWA 核心服务
│   │   ├── backgroundSyncService.ts  # 后台同步服务
│   │   └── pushNotificationService.ts # 推送通知服务
│   ├── components/
│   │   └── pwa/
│   │       ├── PWAInstallPrompt.tsx  # 安装提示组件
│   │       ├── OfflineIndicator.tsx   # 离线指示器组件
│   │       └── locales/
│   │           └── index.ts           # 国际化翻译
│   ├── stores/
│   │   └── imageStore.ts        # 图片存储（集成后台同步）
│   ├── main.tsx                 # 入口文件（注册 Service Worker）
│   └── vite.config.ts           # Vite 配置（PWA 插件配置）`}
          </pre>
        </div>

        <h3>关键实现点</h3>

        <h4>1. Service Worker 注册</h4>
        <ul>
          <li>
            <strong>时机</strong>：应用启动时自动注册
          </li>
          <li>
            <strong>作用域</strong>：`/`，覆盖整个应用
          </li>
          <li>
            <strong>更新检测</strong>：自动检测并提示更新
          </li>
        </ul>

        <h4>2. 缓存管理</h4>
        <ul>
          <li>
            <strong>版本控制</strong>：使用版本号管理缓存，自动清理旧版本
          </li>
          <li>
            <strong>过期策略</strong>：根据资源类型设置不同的过期时间
          </li>
          <li>
            <strong>大小限制</strong>：设置最大条目数，避免缓存过大
          </li>
        </ul>

        <h4>3. 后台同步</h4>
        <ul>
          <li>
            <strong>队列管理</strong>：使用 IndexedDB 持久化待同步操作
          </li>
          <li>
            <strong>同步执行</strong>：在 Service Worker 中执行同步逻辑
          </li>
          <li>
            <strong>错误处理</strong>：失败的操作保留在队列中，等待下次重试
          </li>
        </ul>

        <hr />

        <h2 id="best-practices">📚 最佳实践</h2>

        <h3>开发实践</h3>
        <ul>
          <li>
            <strong>开发环境</strong>：禁用自动刷新，避免开发时死循环
          </li>
          <li>
            <strong>调试工具</strong>：使用 Chrome DevTools 的 Application
            面板调试
          </li>
          <li>
            <strong>版本管理</strong>：每次更新 Service Worker 时更新版本号
          </li>
        </ul>

        <h3>性能优化</h3>
        <ul>
          <li>
            <strong>缓存策略</strong>：根据资源类型选择最合适的缓存策略
          </li>
          <li>
            <strong>缓存大小</strong>：合理设置缓存大小，避免占用过多存储空间
          </li>
          <li>
            <strong>预缓存</strong>：预缓存关键资源，提升首次加载速度
          </li>
        </ul>

        <h3>用户体验</h3>
        <ul>
          <li>
            <strong>状态反馈</strong>：清晰的状态指示，让用户了解应用状态
          </li>
          <li>
            <strong>错误处理</strong>：友好的错误提示，提供解决方案
          </li>
          <li>
            <strong>离线提示</strong>：明确告知用户哪些功能可用，哪些不可用
          </li>
        </ul>

        <h3>兼容性</h3>
        <ul>
          <li>
            <strong>功能检测</strong>：使用前检测 API 是否支持
          </li>
          <li>
            <strong>优雅降级</strong>：不支持的功能提供替代方案
          </li>
          <li>
            <strong>测试覆盖</strong>：在不同浏览器和设备上测试
          </li>
        </ul>

        <hr />

        <h2>📖 参考资源</h2>

        <ul>
          <li>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API"
              target="_blank"
              rel="noopener noreferrer"
            >
              Service Worker API - MDN
            </a>
          </li>
          <li>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/Manifest"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web App Manifest - MDN
            </a>
          </li>
          <li>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API"
              target="_blank"
              rel="noopener noreferrer"
            >
              Background Sync API - MDN
            </a>
          </li>
          <li>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Push_API"
              target="_blank"
              rel="noopener noreferrer"
            >
              Push API - MDN
            </a>
          </li>
          <li>
            <a
              href="https://developers.google.com/web/tools/workbox"
              target="_blank"
              rel="noopener noreferrer"
            >
              Workbox - Google Developers
            </a>
          </li>
          <li>
            <a
              href="https://web.dev/progressive-web-apps/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Progressive Web Apps - web.dev
            </a>
          </li>
        </ul>
      </div>
    </PageLayout>
  );
}
