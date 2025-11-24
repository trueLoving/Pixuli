import PageLayout from '../../components/PageLayout';

export default function OperationLogDesignPage() {
  return (
    <PageLayout
      title="桌面端操作日志设计方案"
      subtitle="详细的设计文档，涵盖操作日志系统的架构、功能和技术实现"
      icon="fas fa-file-alt"
    >
      <div className="content-card">
        <h1>📋 桌面端操作日志设计方案</h1>

        <p>
          本文档详细描述了 Pixuli
          桌面端操作日志系统的设计方案，包括设计目标、架构设计、功能实现和技术细节。
        </p>

        <hr />

        <h2>🎯 设计目标</h2>

        <h3>核心目标</h3>
        <ul>
          <li>
            <strong>全面记录</strong>
            ：记录用户的所有关键操作，包括上传、删除、编辑、压缩、转换等
          </li>
          <li>
            <strong>可追溯性</strong>：提供完整的操作历史，支持问题排查和审计
          </li>
          <li>
            <strong>性能优化</strong>：日志记录不影响主业务流程的性能
          </li>
          <li>
            <strong>用户友好</strong>：提供直观的日志查看、搜索和导出功能
          </li>
          <li>
            <strong>可扩展性</strong>：支持未来添加新的操作类型和功能
          </li>
        </ul>

        <h3>非功能性需求</h3>
        <ul>
          <li>
            <strong>存储效率</strong>：使用 localStorage
            存储，自动处理存储空间限制
          </li>
          <li>
            <strong>查询性能</strong>：支持高效的日志查询和过滤
          </li>
          <li>
            <strong>数据安全</strong>：日志数据仅存储在本地，不上传到服务器
          </li>
          <li>
            <strong>国际化支持</strong>：支持中英文界面
          </li>
        </ul>

        <hr />

        <h2>🏗️ 架构设计</h2>

        <h3>整体架构</h3>
        <p>操作日志系统采用分层架构设计，包含服务层、存储层和展示层：</p>

        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`┌─────────────────────────────────────────┐
│           展示层 (UI Layer)                │
│  ┌─────────────────────────────────────┐  │
│  │   OperationLogModal Component       │  │
│  │   - 日志列表展示                    │  │
│  │   - 过滤和搜索                      │  │
│  │   - 统计信息显示                    │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           状态层 (State Layer)           │
│  ┌─────────────────────────────────────┐  │
│  │   LogStore (Zustand)               │  │
│  │   - 日志状态管理                    │  │
│  │   - 过滤条件管理                    │  │
│  │   - 统计信息计算                    │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           服务层 (Service Layer)         │
│  ┌─────────────────────────────────────┐  │
│  │   LogService (Singleton)           │  │
│  │   - 日志记录                        │  │
│  │   - 日志查询                        │  │
│  │   - 日志清理                        │  │
│  │   - 日志导出                        │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           存储层 (Storage Layer)         │
│  ┌─────────────────────────────────────┐  │
│  │   localStorage                     │  │
│  │   - 本地持久化存储                  │  │
│  │   - 自动容量管理                    │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘`}
          </pre>
        </div>

        <h3>核心组件</h3>

        <h4>1. LogService（日志服务）</h4>
        <ul>
          <li>
            <strong>职责</strong>：日志的创建、查询、清理和导出
          </li>
          <li>
            <strong>设计模式</strong>：单例模式，确保全局唯一实例
          </li>
          <li>
            <strong>关键特性</strong>：
            <ul>
              <li>防抖保存机制，避免频繁写入 localStorage</li>
              <li>自动容量管理，超出限制时清理旧日志</li>
              <li>支持多种查询和过滤条件</li>
            </ul>
          </li>
        </ul>

        <h4>2. LogStore（状态管理）</h4>
        <ul>
          <li>
            <strong>职责</strong>：管理日志的 UI 状态和用户交互
          </li>
          <li>
            <strong>技术栈</strong>：Zustand
          </li>
          <li>
            <strong>关键特性</strong>：
            <ul>
              <li>响应式状态更新</li>
              <li>过滤条件管理</li>
              <li>统计信息实时计算</li>
            </ul>
          </li>
        </ul>

        <h4>3. OperationLogModal（UI 组件）</h4>
        <ul>
          <li>
            <strong>职责</strong>：提供日志查看和管理的用户界面
          </li>
          <li>
            <strong>关键特性</strong>：
            <ul>
              <li>表格形式展示日志列表</li>
              <li>实时统计信息展示</li>
              <li>多条件过滤和搜索</li>
              <li>日志导出功能</li>
            </ul>
          </li>
        </ul>

        <hr />

        <h2>📊 数据结构设计</h2>

        <h3>操作日志实体 (OperationLog)</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`interface OperationLog {
  id: string;              // 日志唯一标识
  action: LogActionType;    // 操作类型
  status: LogStatus;        // 操作状态（成功/失败/进行中）
  timestamp: number;        // 时间戳（毫秒）
  userId?: string;          // 用户ID（可选）
  imageId?: string;         // 图片ID（如果相关）
  imageName?: string;       // 图片名称
  details?: Record<string, any>;  // 详细信息
  error?: string;           // 错误信息（如果失败）
  duration?: number;         // 操作耗时（毫秒）
}`}
          </pre>
        </div>

        <h3>操作类型枚举 (LogActionType)</h3>
        <ul>
          <li>
            <code>UPLOAD</code> - 上传图片
          </li>
          <li>
            <code>DELETE</code> - 删除图片
          </li>
          <li>
            <code>EDIT</code> - 编辑图片信息
          </li>
          <li>
            <code>COMPRESS</code> - 压缩图片
          </li>
          <li>
            <code>CONVERT</code> - 转换图片格式
          </li>
          <li>
            <code>ANALYZE</code> - AI 分析
          </li>
          <li>
            <code>CONFIG_CHANGE</code> - 配置变更
          </li>
          <li>
            <code>BATCH_UPLOAD</code> - 批量上传
          </li>
          <li>
            <code>BATCH_DELETE</code> - 批量删除
          </li>
        </ul>

        <h3>操作状态枚举 (LogStatus)</h3>
        <ul>
          <li>
            <code>SUCCESS</code> - 操作成功
          </li>
          <li>
            <code>FAILED</code> - 操作失败
          </li>
          <li>
            <code>PENDING</code> - 操作进行中
          </li>
        </ul>

        <h3>过滤条件 (LogFilter)</h3>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`interface LogFilter {
  action?: LogActionType | LogActionType[];  // 操作类型过滤
  status?: LogStatus | LogStatus[];           // 状态过滤
  startTime?: number;                         // 开始时间
  endTime?: number;                           // 结束时间
  imageId?: string;                           // 图片ID过滤
  keyword?: string;                           // 关键词搜索
}`}
          </pre>
        </div>

        <hr />

        <h2>⚙️ 功能设计</h2>

        <h3>1. 日志记录功能</h3>
        <h4>记录时机</h4>
        <ul>
          <li>
            <strong>操作开始时</strong>：记录操作类型、图片信息等
          </li>
          <li>
            <strong>操作完成时</strong>：更新状态、记录耗时、错误信息等
          </li>
        </ul>

        <h4>集成点</h4>
        <ul>
          <li>
            <strong>ImageStore</strong>
            ：在图片操作（上传、删除、编辑）时自动记录
          </li>
          <li>
            <strong>配置变更</strong>：记录 GitHub/又拍云配置的变更
          </li>
          <li>
            <strong>批量操作</strong>：记录批量上传和批量删除的汇总信息
          </li>
        </ul>

        <h4>性能优化</h4>
        <ul>
          <li>
            <strong>异步记录</strong>：日志记录不阻塞主业务流程
          </li>
          <li>
            <strong>防抖保存</strong>：使用 500ms 防抖，避免频繁写入
            localStorage
          </li>
          <li>
            <strong>容量限制</strong>：默认最多保存 10000
            条日志，超出自动清理旧日志
          </li>
        </ul>

        <h3>2. 日志查询功能</h3>
        <h4>查询方式</h4>
        <ul>
          <li>
            <strong>全量查询</strong>：获取所有日志
          </li>
          <li>
            <strong>条件过滤</strong>：按操作类型、状态、时间范围等过滤
          </li>
          <li>
            <strong>关键词搜索</strong>：搜索图片名称、错误信息等
          </li>
          <li>
            <strong>分页查询</strong>：支持 limit 和 offset 参数
          </li>
        </ul>

        <h4>排序支持</h4>
        <ul>
          <li>按时间戳排序（默认降序）</li>
          <li>按操作类型排序</li>
          <li>按状态排序</li>
        </ul>

        <h3>3. 日志过滤功能</h3>
        <h4>过滤条件</h4>
        <ul>
          <li>
            <strong>操作类型过滤</strong>：单选或多选操作类型
          </li>
          <li>
            <strong>状态过滤</strong>：筛选成功/失败/进行中的操作
          </li>
          <li>
            <strong>时间范围过滤</strong>：选择开始和结束时间
          </li>
          <li>
            <strong>图片ID过滤</strong>：查看特定图片的所有操作
          </li>
          <li>
            <strong>关键词搜索</strong>：在图片名称、错误信息、详细信息中搜索
          </li>
        </ul>

        <h3>4. 统计信息功能</h3>
        <h4>统计维度</h4>
        <ul>
          <li>
            <strong>总数统计</strong>：所有日志的总数
          </li>
          <li>
            <strong>今日统计</strong>：今日的日志数量
          </li>
          <li>
            <strong>成功率</strong>：成功操作占总操作的比例
          </li>
          <li>
            <strong>按操作类型统计</strong>：各操作类型的数量分布
          </li>
          <li>
            <strong>按状态统计</strong>：各状态的数量分布
          </li>
        </ul>

        <h3>5. 日志导出功能</h3>
        <h4>导出格式</h4>
        <ul>
          <li>
            <strong>JSON 格式</strong>：完整的结构化数据，便于程序处理
          </li>
          <li>
            <strong>CSV 格式</strong>：表格形式，便于 Excel 等工具打开
          </li>
        </ul>

        <h4>导出方式</h4>
        <ul>
          <li>
            <strong>Electron 文件系统</strong>：通过主进程保存文件（优先）
          </li>
          <li>
            <strong>浏览器下载</strong>：降级方案，使用 Blob 和下载链接
          </li>
        </ul>

        <h4>导出内容</h4>
        <ul>
          <li>支持导出所有日志</li>
          <li>支持导出过滤后的日志</li>
          <li>
            包含完整的日志信息（ID、操作类型、状态、时间、图片信息、错误信息等）
          </li>
        </ul>

        <h3>6. 日志清理功能</h3>
        <h4>清理方式</h4>
        <ul>
          <li>
            <strong>清理所有日志</strong>：删除所有历史日志
          </li>
          <li>
            <strong>按时间清理</strong>：删除指定时间之前的日志
          </li>
          <li>
            <strong>按操作类型清理</strong>：删除指定类型的日志
          </li>
          <li>
            <strong>保留最新N条</strong>：只保留最新的 N 条日志
          </li>
        </ul>

        <h4>自动清理</h4>
        <ul>
          <li>
            <strong>容量限制</strong>：当日志数量超过 10000 条时，自动清理旧日志
          </li>
          <li>
            <strong>存储空间不足</strong>：当 localStorage
            空间不足时，自动清理旧日志
          </li>
        </ul>

        <hr />

        <h2>💻 技术实现</h2>

        <h3>技术栈</h3>
        <ul>
          <li>
            <strong>TypeScript</strong>：类型安全的开发
          </li>
          <li>
            <strong>Zustand</strong>：轻量级状态管理
          </li>
          <li>
            <strong>React</strong>：UI 组件开发
          </li>
          <li>
            <strong>localStorage</strong>：本地持久化存储
          </li>
          <li>
            <strong>Electron</strong>：文件系统访问
          </li>
        </ul>

        <h3>关键实现细节</h3>

        <h4>1. 单例模式实现</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`export class LogService {
  private static instance: LogService;

  private constructor() {
    this.loadLogs();
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }
}`}
          </pre>
        </div>

        <h4>2. 防抖保存机制</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`private saveLogs(): void {
  if (this.saveTimeout) {
    clearTimeout(this.saveTimeout);
  }
  this.saveTimeout = setTimeout(() => {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
  }, 500);
}`}
          </pre>
        </div>

        <h4>3. 容量管理</h4>
        <div className="overflow-x-auto">
          <pre className="bg-gray-100 p-4 rounded">
            {`public log(...): void {
  this.logs.unshift(logEntry);

  // 限制日志数量
  if (this.logs.length > this.maxLogs) {
    this.logs = this.logs.slice(0, this.maxLogs);
  }

  this.saveLogs();
}`}
          </pre>
        </div>

        <h4>4. 错误处理</h4>
        <ul>
          <li>
            <strong>存储空间不足</strong>：捕获
            QuotaExceededError，自动清理旧日志
          </li>
          <li>
            <strong>数据损坏</strong>：解析失败时重置日志数组
          </li>
          <li>
            <strong>操作失败</strong>：记录错误信息，不影响主业务流程
          </li>
        </ul>

        <h3>Electron 集成</h3>
        <h4>文件保存 API</h4>
        <ul>
          <li>
            <strong>主进程</strong>：注册 <code>file:save</code> IPC 处理器
          </li>
          <li>
            <strong>预加载脚本</strong>：暴露 <code>electronAPI.saveFile</code>{' '}
            方法
          </li>
          <li>
            <strong>渲染进程</strong>：调用 API 保存文件
          </li>
        </ul>

        <hr />

        <h2>🎨 UI/UX 设计</h2>

        <h3>界面布局</h3>
        <ul>
          <li>
            <strong>模态框设计</strong>：全屏模态框，提供充足的展示空间
          </li>
          <li>
            <strong>统计面板</strong>
            ：顶部显示关键统计信息（总数、今日、成功率等）
          </li>
          <li>
            <strong>过滤面板</strong>：可展开/收起的过滤条件面板
          </li>
          <li>
            <strong>日志列表</strong>：表格形式展示，支持滚动查看
          </li>
        </ul>

        <h3>交互设计</h3>
        <ul>
          <li>
            <strong>实时更新</strong>：新日志自动添加到列表顶部
          </li>
          <li>
            <strong>状态图标</strong>
            ：使用图标直观显示操作状态（成功/失败/进行中）
          </li>
          <li>
            <strong>时间格式化</strong>：根据用户语言环境格式化时间显示
          </li>
          <li>
            <strong>错误信息高亮</strong>：失败的操作用红色显示错误信息
          </li>
        </ul>

        <h3>国际化支持</h3>
        <ul>
          <li>
            <strong>多语言</strong>：支持中文和英文
          </li>
          <li>
            <strong>时间格式</strong>：根据语言环境自动调整时间显示格式
          </li>
          <li>
            <strong>操作类型标签</strong>：根据语言显示对应的操作类型名称
          </li>
        </ul>

        <hr />

        <h2>🚀 性能优化</h2>

        <h3>存储优化</h3>
        <ul>
          <li>
            <strong>防抖保存</strong>：500ms 防抖，减少 localStorage 写入次数
          </li>
          <li>
            <strong>容量限制</strong>：最多保存 10000 条日志，防止存储溢出
          </li>
          <li>
            <strong>自动清理</strong>：超出容量时自动清理最旧的日志
          </li>
        </ul>

        <h3>查询优化</h3>
        <ul>
          <li>
            <strong>内存查询</strong>：所有查询在内存中进行，无需异步操作
          </li>
          <li>
            <strong>过滤优化</strong>：先应用过滤条件，再进行排序和分页
          </li>
          <li>
            <strong>分页支持</strong>：支持 limit 和
            offset，避免一次性加载大量数据
          </li>
        </ul>

        <h3>UI 优化</h3>
        <ul>
          <li>
            <strong>虚拟滚动</strong>：未来可考虑实现虚拟滚动，支持大量日志展示
          </li>
          <li>
            <strong>懒加载</strong>：统计信息按需计算，不阻塞 UI 渲染
          </li>
          <li>
            <strong>防抖搜索</strong>：搜索输入使用防抖，减少不必要的查询
          </li>
        </ul>

        <hr />

        <h2>🔒 安全性考虑</h2>

        <ul>
          <li>
            <strong>本地存储</strong>：所有日志仅存储在本地，不上传到服务器
          </li>
          <li>
            <strong>敏感信息</strong>：不记录敏感信息（如密码、Token 等）
          </li>
          <li>
            <strong>数据验证</strong>：加载日志时验证数据格式，防止恶意数据注入
          </li>
          <li>
            <strong>错误隔离</strong>：日志记录失败不影响主业务流程
          </li>
        </ul>

        <hr />

        <h2>📈 未来扩展</h2>

        <h3>功能扩展</h3>
        <ul>
          <li>
            <strong>日志分析</strong>：提供更详细的数据分析和可视化
          </li>
          <li>
            <strong>日志同步</strong>：支持多设备间日志同步（可选）
          </li>
          <li>
            <strong>日志备份</strong>：自动备份日志到云端（可选）
          </li>
          <li>
            <strong>自定义字段</strong>：允许用户添加自定义日志字段
          </li>
          <li>
            <strong>日志模板</strong>：提供日志模板，快速记录特定场景的操作
          </li>
        </ul>

        <h3>性能优化</h3>
        <ul>
          <li>
            <strong>索引优化</strong>：为常用查询字段建立索引
          </li>
          <li>
            <strong>虚拟滚动</strong>：实现虚拟滚动，支持百万级日志展示
          </li>
          <li>
            <strong>Web Worker</strong>：将日志查询移到 Web Worker，不阻塞主线程
          </li>
          <li>
            <strong>数据库迁移</strong>：考虑使用 IndexedDB 替代 localStorage
          </li>
        </ul>

        <h3>用户体验</h3>
        <ul>
          <li>
            <strong>实时通知</strong>：重要操作失败时显示通知
          </li>
          <li>
            <strong>操作回放</strong>：支持操作历史回放（仅查看模式）
          </li>
          <li>
            <strong>批量操作</strong>：支持批量导出、批量清理等操作
          </li>
          <li>
            <strong>自定义视图</strong>：允许用户自定义日志列表的显示字段
          </li>
        </ul>

        <hr />

        <h2>📝 总结</h2>

        <p>
          桌面端操作日志系统是一个完整、高效、用户友好的日志管理解决方案。通过分层架构设计、性能优化和良好的用户体验，为用户提供了全面的操作追踪和管理能力。
        </p>

        <p>
          系统设计充分考虑了可扩展性和维护性，为未来的功能扩展留下了充足的空间。同时，通过本地存储和错误隔离，确保了系统的安全性和稳定性。
        </p>

        <hr />

        <h2>📚 相关文档</h2>

        <ul>
          <li>
            <a href="/tutorial">使用教程</a> - 了解如何使用操作日志功能
          </li>
          <li>
            <a href="/keyboard">键盘快捷键</a> - 查看相关快捷键
          </li>
          <li>
            <a href="https://github.com/trueLoving/Pixuli">GitHub 仓库</a> -
            查看源代码
          </li>
        </ul>

        <p>
          <em>最后更新：2025年11月</em>
        </p>
      </div>
    </PageLayout>
  );
}
