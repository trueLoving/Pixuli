import PageLayout from '../../components/PageLayout';

export default function ProductsPage() {
  return (
    <PageLayout
      title="产品矩阵"
      subtitle="全面了解 Pixuli 的产品生态和功能特性"
      icon="fas fa-cube"
    >
      <div className="content-card">
        <h1>📊 Pixuli 产品矩阵与功能清单</h1>

        <blockquote>
          <p>全面了解 Pixuli 的产品生态和功能特性</p>
        </blockquote>

        <p>
          Pixuli
          是一个完整的图片管理生态系统，提供从桌面应用到云端服务的全方位解决方案。本页面详细介绍了我们的产品矩阵和功能清单。
        </p>

        <hr />

        <h2>🏗️ 产品矩阵</h2>

        <h3>核心产品</h3>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>产品</th>
                <th>平台</th>
                <th>状态</th>
                <th>描述</th>
                <th>主要功能</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Pixuli Desktop</strong>
                </td>
                <td>Windows, macOS</td>
                <td>✅ 已发布</td>
                <td>跨平台桌面应用</td>
                <td>图片管理、批量处理、格式转换、本地存储</td>
              </tr>
              <tr>
                <td>
                  <strong>Pixuli Web</strong>
                </td>
                <td>浏览器</td>
                <td>✅ 已发布</td>
                <td>在线图片管理平台</td>
                <td>云端存储、GitHub 集成、在线浏览、团队协作</td>
              </tr>
              <tr>
                <td>
                  <strong>Pixuli Mobile</strong>
                </td>
                <td>iOS, Android</td>
                <td>✅ Android 已发布 | 📋 iOS 开发中</td>
                <td>移动端应用</td>
                <td>拍照上传、移动浏览、离线同步、幻灯片播放</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>技术栈</h3>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>层级</th>
                <th>技术</th>
                <th>用途</th>
                <th>版本</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>前端</strong>
                </td>
                <td>React + TypeScript</td>
                <td>用户界面</td>
                <td>19.1.0</td>
              </tr>
              <tr>
                <td>
                  <strong>桌面</strong>
                </td>
                <td>Electron</td>
                <td>跨平台打包</td>
                <td>33.4.11</td>
              </tr>
              <tr>
                <td>
                  <strong>后端</strong>
                </td>
                <td>Node.js + Rust</td>
                <td>性能优化</td>
                <td>最新版</td>
              </tr>
              <tr>
                <td>
                  <strong>处理</strong>
                </td>
                <td>Rust + WebAssembly</td>
                <td>图片处理</td>
                <td>最新版</td>
              </tr>
              <tr>
                <td>
                  <strong>存储</strong>
                </td>
                <td>GitHub API / Gitee API</td>
                <td>云端存储</td>
                <td>最新版</td>
              </tr>
              <tr>
                <td>
                  <strong>移动</strong>
                </td>
                <td>React Native + Expo</td>
                <td>跨平台移动应用</td>
                <td>0.81.5</td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr />

        <h2>🚀 功能清单</h2>

        <h3>🖼️ 图片管理</h3>

        <h4>基础功能</h4>
        <ul>
          <li>
            ✅ <strong>图片上传</strong> - 支持拖拽、点击上传
          </li>
          <li>
            ✅ <strong>批量操作</strong> - 批量上传、删除、重命名
          </li>
          <li>
            ✅ <strong>格式支持</strong> - JPEG, PNG, WebP, GIF, SVG, BMP
          </li>
          <li>
            ✅ <strong>预览功能</strong> - 缩略图、全屏预览
          </li>
          <li>
            ✅ <strong>搜索筛选</strong> - 按名称、日期、标签搜索
          </li>
        </ul>

        <h4>高级功能</h4>
        <ul>
          <li>
            ✅ <strong>分类管理</strong> - 自定义文件夹结构
          </li>
          <li>
            ✅ <strong>元数据查看</strong> - EXIF 信息显示
          </li>
          <li>
            ✅ <strong>重复检测</strong> - 自动识别重复图片
          </li>
          <li>
            ✅ <strong>云端同步</strong> - GitHub 存储集成
          </li>
        </ul>

        <h3>🌐 Web 端功能</h3>

        <h4>在线管理</h4>
        <ul>
          <li>
            ✅ <strong>GitHub 集成</strong> - 与 GitHub 仓库无缝集成
          </li>
          <li>
            ✅ <strong>在线浏览</strong> - 浏览器中直接查看图片
          </li>
          <li>
            ✅ <strong>云端上传</strong> - 直接上传到 GitHub 仓库
          </li>
          <li>
            ✅ <strong>团队协作</strong> - 支持多人协作管理
          </li>
          <li>
            ✅ <strong>版本控制</strong> - 利用 Git 版本控制
          </li>
        </ul>

        <h4>用户体验</h4>
        <ul>
          <li>
            ✅ <strong>响应式设计</strong> - 适配各种屏幕尺寸
          </li>
          <li>
            ✅ <strong>键盘快捷键</strong> - 完整的键盘操作支持
          </li>
          <li>
            ✅ <strong>多语言支持</strong> - 中英文界面切换
          </li>
          <li>
            ✅ <strong>演示模式</strong> - 无需配置即可体验功能
          </li>
        </ul>

        <h3>🖥️ 桌面端功能</h3>

        <h4>本地管理</h4>
        <ul>
          <li>
            ✅ <strong>本地文件系统</strong> - 完整的本地文件访问
          </li>
          <li>
            ✅ <strong>批量处理</strong> - 批量格式转换和压缩
          </li>
          <li>
            ✅ <strong>格式转换</strong> - 支持多种图片格式互转
          </li>
          <li>
            ✅ <strong>智能压缩</strong> - WebP 压缩优化
          </li>
          <li>
            ✅ <strong>离线工作</strong> - 无需网络连接
          </li>
        </ul>

        <h4>系统集成</h4>
        <ul>
          <li>
            ✅ <strong>系统通知</strong> - 原生系统通知支持
          </li>
          <li>
            ✅ <strong>文件关联</strong> - 系统文件类型关联
          </li>
          <li>
            ✅ <strong>拖拽支持</strong> - 系统级拖拽操作
          </li>
          <li>
            ✅ <strong>多窗口</strong> - 支持多窗口管理
          </li>
          <li>
            ✅ <strong>自动更新</strong> - 自动检查和更新
          </li>
        </ul>

        <h3>⌨️ 用户体验</h3>

        <h4>键盘操作</h4>
        <ul>
          <li>
            ✅ <strong>快捷键支持</strong> - 完整的键盘导航
          </li>
          <li>
            ✅ <strong>自定义快捷键</strong> - 用户可配置
          </li>
          <li>
            ✅ <strong>无障碍支持</strong> - 屏幕阅读器兼容
          </li>
          <li>
            ✅ <strong>多语言界面</strong> - 中英文切换
          </li>
          <li>
            🔄 <strong>手势支持</strong> - 触控板手势
          </li>
        </ul>

        <h4>界面设计</h4>
        <ul>
          <li>
            ✅ <strong>响应式布局</strong> - 适配不同屏幕
          </li>
          <li>
            ✅ <strong>主题切换</strong> - 明暗主题
          </li>
          <li>
            ✅ <strong>自定义布局</strong> - 可调整界面
          </li>
          <li>
            ✅ <strong>动画效果</strong> - 流畅的过渡动画
          </li>
          <li>
            📋 <strong>个性化</strong> - 自定义界面元素
          </li>
        </ul>

        <h3>🔧 技术特性</h3>

        <h4>性能优化</h4>
        <ul>
          <li>
            ✅ <strong>懒加载</strong> - 按需加载图片
          </li>
          <li>
            ✅ <strong>缓存机制</strong> - 智能缓存策略
          </li>
          <li>
            ✅ <strong>多线程处理</strong> - 并行处理任务
          </li>
          <li>
            ✅ <strong>内存管理</strong> - 高效内存使用
          </li>
          <li>
            🔄 <strong>GPU 加速</strong> - 硬件加速支持
          </li>
        </ul>

        <h4>数据安全</h4>
        <ul>
          <li>
            ✅ <strong>本地存储</strong> - 数据本地保存
          </li>
          <li>
            ✅ <strong>加密传输</strong> - HTTPS 安全传输
          </li>
          <li>
            ✅ <strong>隐私保护</strong> - 不上传敏感数据
          </li>
          <li>
            ✅ <strong>备份恢复</strong> - 数据备份机制
          </li>
          <li>
            📋 <strong>权限控制</strong> - 细粒度权限管理
          </li>
        </ul>

        <hr />

        <h2>🔗 相关资源</h2>

        <h3>下载链接</h3>
        <ul>
          <li>
            <a href="https://github.com/trueLoving/Pixuli/releases">
              桌面版下载
            </a>{' '}
            - 支持 Windows, macOS, Linux
          </li>
          <li>
            <a href="https://pixuli-web.vercel.app/">Web 版访问</a> -
            在线图片管理
          </li>
          <li>
            <a href="https://github.com/trueLoving/Pixuli">GitHub 仓库</a> -
            开源代码
          </li>
          <li>
            <a href="/tutorial">使用教程</a> - 详细使用指南
          </li>
          <li>
            <a href="/keyboard">键盘快捷键</a> - 快捷键参考
          </li>
        </ul>

        <hr />

        <p>
          <em>最后更新：2025年11月</em>
        </p>
      </div>
    </PageLayout>
  );
}
