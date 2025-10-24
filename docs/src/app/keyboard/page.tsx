import PageLayout from '../../components/PageLayout';

export default function KeyboardPage() {
  return (
    <PageLayout
      title="键盘快捷键"
      subtitle="掌握 Pixuli 的键盘快捷键，让您的图片管理更加高效便捷"
      icon="fas fa-keyboard"
    >
      <div className="content-card">
        <h1>⌨️ Pixuli 键盘快捷键指南</h1>

        <p>掌握 Pixuli 的键盘快捷键，让您的图片管理更加高效便捷。</p>

        <hr />

        <h2>🔧 通用快捷键</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>Esc</kbd>
                </td>
                <td>关闭模态框</td>
                <td>关闭当前打开的对话框或模态框</td>
              </tr>
              <tr>
                <td>
                  <kbd>F1</kbd>
                </td>
                <td>显示帮助</td>
                <td>打开键盘快捷键帮助页面</td>
              </tr>
              <tr>
                <td>
                  <kbd>F5</kbd>
                </td>
                <td>刷新</td>
                <td>重新加载图片列表</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>,</kbd>
                </td>
                <td>打开设置</td>
                <td>打开应用设置页面</td>
              </tr>
              <tr>
                <td>
                  <kbd>/</kbd>
                </td>
                <td>聚焦搜索</td>
                <td>将焦点移动到搜索输入框</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>V</kbd>
                </td>
                <td>切换视图</td>
                <td>在网格视图和列表视图之间切换</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>🖼️ 图片浏览快捷键</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>↑</kbd>
                </td>
                <td>选择上一个</td>
                <td>选择当前图片的上一个图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>↓</kbd>
                </td>
                <td>选择下一个</td>
                <td>选择当前图片的下一个图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>←</kbd>
                </td>
                <td>选择左侧</td>
                <td>选择当前图片左侧的图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>→</kbd>
                </td>
                <td>选择右侧</td>
                <td>选择当前图片右侧的图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Enter</kbd>
                </td>
                <td>打开选中</td>
                <td>打开当前选中的图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Space</kbd>
                </td>
                <td>预览模式</td>
                <td>进入/退出图片预览模式</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>📁 文件操作快捷键</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>O</kbd>
                </td>
                <td>打开文件</td>
                <td>打开文件选择对话框</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>U</kbd>
                </td>
                <td>上传文件</td>
                <td>快速上传图片文件</td>
              </tr>
              <tr>
                <td>
                  <kbd>Delete</kbd>
                </td>
                <td>删除文件</td>
                <td>删除当前选中的图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>D</kbd>
                </td>
                <td>下载文件</td>
                <td>下载当前选中的图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>C</kbd>
                </td>
                <td>复制文件</td>
                <td>复制当前选中的图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>X</kbd>
                </td>
                <td>剪切文件</td>
                <td>剪切当前选中的图片</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>🔍 搜索和筛选快捷键</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>F</kbd>
                </td>
                <td>搜索</td>
                <td>打开搜索功能</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>G</kbd>
                </td>
                <td>下一个结果</td>
                <td>跳转到搜索结果的下一个匹配项</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>G</kbd>
                </td>
                <td>上一个结果</td>
                <td>跳转到搜索结果的上一个匹配项</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>L</kbd>
                </td>
                <td>按标签筛选</td>
                <td>按标签筛选图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>T</kbd>
                </td>
                <td>按类型筛选</td>
                <td>按文件类型筛选图片</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>🖥️ 视图控制快捷键</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>+</kbd>
                </td>
                <td>放大</td>
                <td>放大图片预览</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>-</kbd>
                </td>
                <td>缩小</td>
                <td>缩小图片预览</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>0</kbd>
                </td>
                <td>重置缩放</td>
                <td>重置图片缩放到原始大小</td>
              </tr>
              <tr>
                <td>
                  <kbd>F11</kbd>
                </td>
                <td>全屏</td>
                <td>切换全屏模式</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>R</kbd>
                </td>
                <td>旋转</td>
                <td>顺时针旋转图片 90 度</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
                </td>
                <td>逆时针旋转</td>
                <td>逆时针旋转图片 90 度</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>⚙️ 应用控制快捷键</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Q</kbd>
                </td>
                <td>退出应用</td>
                <td>关闭 Pixuli 应用</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd>
                </td>
                <td>开发者工具</td>
                <td>打开开发者工具（仅开发模式）</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
                </td>
                <td>重新加载</td>
                <td>重新加载应用</td>
              </tr>
              <tr>
                <td>
                  <kbd>Alt</kbd> + <kbd>F4</kbd>
                </td>
                <td>关闭窗口</td>
                <td>关闭当前窗口</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>📋 批量操作快捷键</h2>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>A</kbd>
                </td>
                <td>全选</td>
                <td>选择所有图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd>
                </td>
                <td>取消全选</td>
                <td>取消选择所有图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>B</kbd>
                </td>
                <td>批量操作</td>
                <td>对选中的图片进行批量操作</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>
                </td>
                <td>批量下载</td>
                <td>批量下载选中的图片</td>
              </tr>
              <tr>
                <td>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Delete</kbd>
                </td>
                <td>批量删除</td>
                <td>批量删除选中的图片</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>💡 使用技巧</h2>

        <h3>快捷键记忆技巧</h3>
        <ul>
          <li>
            <strong>通用操作</strong>：大多数应用的通用快捷键（如
            Ctrl+C、Ctrl+V）在 Pixuli 中同样适用
          </li>
          <li>
            <strong>方向键</strong>：使用方向键可以快速在图片间导航
          </li>
          <li>
            <strong>功能键</strong>：F1-F12 键提供快速访问常用功能
          </li>
          <li>
            <strong>组合键</strong>：Ctrl+字母
            组合键用于文件操作，Ctrl+Shift+字母 用于批量操作
          </li>
        </ul>

        <h3>自定义快捷键</h3>
        <p>在应用设置中，您可以自定义部分快捷键以适应您的使用习惯：</p>
        <ol>
          <li>
            打开设置页面（<kbd>Ctrl</kbd> + <kbd>,</kbd>）
          </li>
          <li>找到"键盘快捷键"选项</li>
          <li>点击要修改的快捷键</li>
          <li>按下新的快捷键组合</li>
          <li>保存设置</li>
        </ol>

        <h3>无障碍支持</h3>
        <ul>
          <li>所有快捷键都支持屏幕阅读器</li>
          <li>可以使用 Tab 键在界面元素间导航</li>
          <li>支持键盘焦点指示器</li>
          <li>提供高对比度模式支持</li>
        </ul>

        <hr />

        <h2>🆘 常见问题</h2>

        <h3>快捷键不工作？</h3>
        <ul>
          <li>确保应用处于活动状态（窗口获得焦点）</li>
          <li>检查是否有其他应用占用了相同的快捷键</li>
          <li>尝试重新启动应用</li>
          <li>检查快捷键设置是否正确</li>
        </ul>

        <h3>快捷键冲突？</h3>
        <ul>
          <li>在系统设置中检查全局快捷键设置</li>
          <li>关闭可能冲突的其他应用</li>
          <li>在 Pixuli 设置中修改快捷键</li>
        </ul>

        <hr />

        <h2>📚 更多资源</h2>

        <ul>
          <li>
            <a href="/tutorial">使用教程</a> - 详细的使用指南
          </li>
          <li>
            <a href="/products">功能清单</a> - 完整的功能介绍
          </li>
          <li>
            <a href="https://pixuli-web.vercel.app/">Web 版体验</a> - 在线试用
            Pixuli
          </li>
          <li>
            <a href="https://github.com/trueLoving/Pixuli/issues">问题反馈</a> -
            报告问题或建议
          </li>
          <li>
            <a href="https://github.com/trueLoving/Pixuli/discussions">
              社区讨论
            </a>{' '}
            - 与其他用户交流
          </li>
        </ul>

        <p>
          <em>最后更新：2025年10月</em>
        </p>
      </div>
    </PageLayout>
  );
}
