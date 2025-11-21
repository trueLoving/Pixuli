import PageLayout from '../../components/PageLayout';
import Image from 'next/image';

export default function TutorialPage() {
  return (
    <PageLayout
      title="使用教程"
      subtitle="快速上手 Pixuli 图片管理应用，掌握核心功能"
      icon="fas fa-graduation-cap"
    >
      <div className="content-card">
        <h1>Pixuli 使用教程</h1>

        <p>
          本文档将引导您快速上手 Pixuli 图片管理应用，主要包括 GitHub 和 Gitee
          仓库源配置，以及如何在界面中配置仓库源。
        </p>

        <h2>目录</h2>

        <ul>
          <li>
            <a href="#prerequisites">前提条件</a>
          </li>
          <li>
            <a href="#github-setup">GitHub 仓库源配置</a>
          </li>
          <li>
            <a href="#gitee-setup">Gitee 仓库源配置</a>
          </li>
          <li>
            <a href="#ui-config">在界面中配置仓库源</a>
          </li>
          <li>
            <a href="#usage">使用功能</a>
          </li>
          <li>
            <a href="#troubleshooting">故障排除</a>
          </li>
        </ul>

        <hr id="prerequisites" />

        <h2>前提条件</h2>

        <ul>
          <li>已安装 Pixuli 应用（桌面端、Web 端或移动端）</li>
          <li>拥有 GitHub 或 Gitee 账号</li>
          <li>已创建用于存储图片的仓库</li>
        </ul>

        <hr id="github-setup" />

        <h2>GitHub 仓库源配置</h2>

        <h3>步骤 1: 创建 GitHub 仓库</h3>

        <ol>
          <li>登录您的 GitHub 账号</li>
          <li>
            点击右上角的 <strong>"+"</strong> 按钮，选择{' '}
            <strong>"New repository"</strong>
          </li>
          <li>
            填写仓库信息：
            <ul>
              <li>
                <strong>Repository name</strong>: 输入仓库名称（例如：
                <code>my-images</code>）
              </li>
              <li>
                <strong>Visibility</strong>: 选择 <strong>Public</strong>
                （必须设置为公开）
              </li>
              <li>
                <strong>Initialize</strong>: 可选择添加 README.md
              </li>
            </ul>
          </li>
          <li>
            点击 <strong>"Create repository"</strong> 完成创建
          </li>
        </ol>

        <blockquote>
          <p>
            ⚠️ <strong>重要提示</strong>: 仓库必须设置为 <strong>Public</strong>
            ，否则 Pixuli 无法访问您的图片。
          </p>
        </blockquote>

        <h3>步骤 2: 获取 GitHub Personal Access Token</h3>

        <ol>
          <li>
            进入 GitHub 设置页面：点击头像 → <strong>Settings</strong>
          </li>
          <li>
            在左侧菜单中找到 <strong>"Developer settings"</strong>
          </li>
          <li>
            点击 <strong>"Personal access tokens"</strong> →{' '}
            <strong>"Tokens (classic)"</strong>
          </li>
          <li>
            点击 <strong>"Generate new token"</strong> →{' '}
            <strong>"Generate new token (classic)"</strong>
          </li>
          <li>
            填写 token 信息：
            <ul>
              <li>
                <strong>Note</strong>: 输入描述（例如：Pixuli Access）
              </li>
              <li>
                <strong>Expiration</strong>: 建议选择较长时间（如 90 days 或 No
                expiration）
              </li>
            </ul>
          </li>
          <li>
            设置权限范围：
            <ul>
              <li>
                ✅ <strong>repo</strong> - 完整仓库访问权限
              </li>
              <li>
                ✅ <strong>public_repo</strong> - 公开仓库访问权限
              </li>
            </ul>
          </li>
          <li>
            点击 <strong>"Generate token"</strong>
          </li>
          <li>
            <strong>复制生成的 token</strong> 并妥善保存（只显示一次）
          </li>
        </ol>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>配置项</th>
                <th>说明</th>
                <th>示例</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>用户名 (Owner)</strong>
                </td>
                <td>您的 GitHub 用户名</td>
                <td>
                  <code>yourgithubname</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>仓库名 (Repository)</strong>
                </td>
                <td>刚创建的仓库名称</td>
                <td>
                  <code>my-images</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>分支名 (Branch)</strong>
                </td>
                <td>主分支名称</td>
                <td>
                  <code>main</code> 或 <code>master</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>存储路径 (Path)</strong>
                </td>
                <td>图片存放的目录</td>
                <td>
                  <code>images</code> 或 <code>photos</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>GitHub Token</strong>
                </td>
                <td>生成的访问令牌</td>
                <td>
                  <code>ghp_xxxxxxxxxxxx</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr id="gitee-setup" />

        <h2>Gitee 仓库源配置</h2>

        <h3>步骤 1: 创建 Gitee 仓库</h3>

        <ol>
          <li>登录您的 Gitee 账号</li>
          <li>
            点击右上角的 <strong>"+"</strong> 按钮，选择{' '}
            <strong>"新建仓库"</strong>
          </li>
          <li>
            填写仓库信息：
            <ul>
              <li>
                <strong>仓库名称</strong>: 输入仓库名称（例如：
                <code>my-images</code>）
              </li>
              <li>
                <strong>是否开源</strong>: 选择 <strong>公开</strong>
                （必须设置为公开）
              </li>
              <li>
                <strong>初始化仓库</strong>: 可选择添加 README.md
              </li>
            </ul>
          </li>
          <li>
            点击 <strong>"创建"</strong> 完成创建
          </li>
        </ol>

        <blockquote>
          <p>
            ⚠️ <strong>重要提示</strong>: 仓库必须设置为 <strong>公开</strong>
            ，否则 Pixuli 无法访问您的图片。
          </p>
        </blockquote>

        <h3>步骤 2: 获取 Gitee Personal Access Token</h3>

        <ol>
          <li>
            进入 Gitee 设置页面：点击头像 → <strong>设置</strong>
          </li>
          <li>
            在左侧菜单中找到 <strong>"安全设置"</strong> →{' '}
            <strong>"私人令牌"</strong>
          </li>
          <li>
            点击 <strong>"生成新令牌"</strong>
          </li>
          <li>
            填写 token 信息：
            <ul>
              <li>
                <strong>令牌描述</strong>: 输入描述（例如：Pixuli Access）
              </li>
              <li>
                <strong>过期时间</strong>: 建议选择较长时间（如 90 天或永久）
              </li>
            </ul>
          </li>
          <li>
            设置权限范围：
            <ul>
              <li>
                ✅ <strong>projects</strong> - 仓库访问权限
              </li>
              <li>
                ✅ <strong>user_info</strong> - 用户信息访问权限
              </li>
            </ul>
          </li>
          <li>
            点击 <strong>"提交"</strong>
          </li>
          <li>
            <strong>复制生成的 token</strong> 并妥善保存（只显示一次）
          </li>
        </ol>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>配置项</th>
                <th>说明</th>
                <th>示例</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>用户名 (Owner)</strong>
                </td>
                <td>您的 Gitee 用户名</td>
                <td>
                  <code>yourgiteename</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>仓库名 (Repository)</strong>
                </td>
                <td>刚创建的仓库名称</td>
                <td>
                  <code>my-images</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>分支名 (Branch)</strong>
                </td>
                <td>主分支名称</td>
                <td>
                  <code>master</code> 或 <code>main</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>存储路径 (Path)</strong>
                </td>
                <td>图片存放的目录</td>
                <td>
                  <code>images</code> 或 <code>photos</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Gitee Token</strong>
                </td>
                <td>生成的访问令牌</td>
                <td>
                  <code>xxxxxxxxxxxxxxxx</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <hr id="ui-config" />

        <h2>在界面中配置仓库源</h2>

        <p>
          配置好 GitHub 或 Gitee 仓库和 Token 后，您需要在 Pixuli
          应用中配置仓库源。不同平台的配置方式略有不同：
        </p>

        <h3>桌面端配置</h3>

        <ol>
          <li>打开 Pixuli 桌面应用</li>
          <li>
            在左侧边栏找到 <strong>"仓库源管理"</strong> 或{' '}
            <strong>"Source Manager"</strong> 选项
          </li>
          <li>
            点击 <strong>"+"</strong> 或 <strong>"添加仓库源"</strong> 按钮
          </li>
          <li>
            选择要添加的仓库源类型：
            <ul>
              <li>
                <strong>GitHub</strong> - 选择此选项配置 GitHub 仓库源
              </li>
              <li>
                <strong>Gitee</strong> - 选择此选项配置 Gitee 仓库源
              </li>
            </ul>
          </li>
          <li>
            在弹出的配置对话框中填写以下信息：
            <ul>
              <li>
                <strong>用户名 (Owner)</strong>: 输入您的 GitHub/Gitee 用户名
              </li>
              <li>
                <strong>仓库名 (Repository)</strong>: 输入仓库名称
              </li>
              <li>
                <strong>分支名 (Branch)</strong>: 输入分支名称（通常为{' '}
                <code>main</code> 或 <code>master</code>）
              </li>
              <li>
                <strong>存储路径 (Path)</strong>: 输入图片存储路径（例如：{' '}
                <code>images</code>）
              </li>
              <li>
                <strong>Token</strong>: 粘贴之前生成的 Personal Access Token
              </li>
            </ul>
          </li>
          <li>
            点击 <strong>"保存"</strong> 或 <strong>"确认"</strong> 完成配置
          </li>
          <li>
            配置成功后，仓库源会显示在仓库源列表中，您可以点击切换不同的仓库源
          </li>
        </ol>

        <div className="my-6">
          <p className="mb-4">
            <strong>仓库源管理界面：</strong>
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/screenshots/desktop-source-config.png"
              alt="桌面端仓库源管理界面"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
          <p className="mt-4 mb-4">
            <strong>GitHub 配置对话框：</strong>
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/screenshots/desktop-github-config.png"
              alt="桌面端 GitHub 配置对话框"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
          <p className="mt-4 mb-4">
            <strong>Gitee 配置对话框：</strong>
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/screenshots/desktop-gitee-config.png"
              alt="桌面端 Gitee 配置对话框"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        </div>

        <h3>Web 端配置</h3>

        <ol>
          <li>
            打开 Pixuli Web 应用（访问{' '}
            <a
              href="https://pixuli-web.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://pixuli-web.vercel.app/
            </a>
            ）
          </li>
          <li>
            点击右上角的 <strong>设置</strong> 图标或进入设置页面
          </li>
          <li>
            找到 <strong>"存储配置"</strong> 或{' '}
            <strong>"Storage Config"</strong> 选项
          </li>
          <li>
            选择要配置的存储类型：
            <ul>
              <li>
                <strong>GitHub</strong> - 配置 GitHub 仓库源
              </li>
              <li>
                <strong>Gitee</strong> - 配置 Gitee 仓库源
              </li>
            </ul>
          </li>
          <li>填写配置信息（与桌面端相同）</li>
          <li>
            点击 <strong>"保存"</strong> 完成配置
          </li>
        </ol>

        <div className="my-6">
          <p className="mb-4">
            <strong>存储配置界面：</strong>
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/screenshots/web-source-config.png"
              alt="Web 端存储配置界面"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
          <p className="mt-4 mb-4">
            <strong>GitHub 配置界面：</strong>
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/screenshots/web-github-config.png"
              alt="Web 端 GitHub 配置界面"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
          <p className="mt-4 mb-4">
            <strong>Gitee 配置界面：</strong>
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/screenshots/web-gitee-config.png"
              alt="Web 端 Gitee 配置界面"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        </div>

        <h3>移动端配置</h3>

        <ol>
          <li>打开 Pixuli 移动应用</li>
          <li>
            进入 <strong>设置</strong> 页面（通常在底部导航栏）
          </li>
          <li>
            找到 <strong>"GitHub 配置"</strong> 或 <strong>"Gitee 配置"</strong>{' '}
            选项
          </li>
          <li>点击进入配置页面，填写相应的配置信息</li>
          <li>
            点击 <strong>"保存"</strong> 完成配置
          </li>
        </ol>

        <div className="my-6">
          <p className="mb-4">
            <strong>配置界面：</strong>
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Image
              src="/screenshots/mobile-source-config.png"
              alt="移动端配置界面"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        </div>

        <h3>配置多个仓库源</h3>

        <p>Pixuli 支持配置多个仓库源，您可以在不同仓库源之间切换：</p>

        <ul>
          <li>
            <strong>桌面端</strong>:
            在仓库源管理列表中，点击不同的仓库源即可切换
          </li>
          <li>
            <strong>Web 端</strong>: 在设置页面中切换存储类型
          </li>
          <li>
            <strong>移动端</strong>: 在首页顶部切换存储源
          </li>
        </ul>

        <hr id="usage" />

        <h2>使用功能</h2>

        <h3>上传图片</h3>

        <p>配置完成后，您可以开始上传和管理图片：</p>

        <ol>
          <li>
            <strong>拖拽上传</strong>：
            <ul>
              <li>直接将要上传的图片拖拽到 Pixuli 窗口</li>
              <li>支持批量拖拽多张图片</li>
            </ul>
          </li>
          <li>
            <strong>点击上传</strong>：
            <ul>
              <li>
                点击应用中的 <strong>"上传"</strong> 或 <strong>"+"</strong>{' '}
                按钮
              </li>
              <li>选择要上传的图片文件</li>
            </ul>
          </li>
          <li>
            <strong>图片存储</strong>：
            <ul>
              <li>图片会自动上传到您配置的仓库源</li>
              <li>支持多种图片格式（JPG、PNG、WebP 等）</li>
              <li>可在仓库中查看和管理</li>
            </ul>
          </li>
        </ol>

        <h3>查看和管理</h3>

        <ul>
          <li>
            <strong>预览图片</strong>：在应用中直接预览所有已上传的图片
          </li>
          <li>
            <strong>文件管理</strong>：按上传时间、文件名、标签等进行管理
          </li>
          <li>
            <strong>在线访问</strong>：通过仓库 URL 在线查看所有图片
          </li>
          <li>
            <strong>批量操作</strong>：支持批量删除、批量编辑标签等操作
          </li>
        </ul>

        <hr id="troubleshooting" />

        <h2>故障排除</h2>

        <h3>常见问题</h3>

        <ol>
          <li>
            <strong>无法上传图片</strong>
            <ul>
              <li>检查 Token 是否有效且未过期</li>
              <li>确认仓库设置为 Public/公开</li>
              <li>验证网络连接是否正常</li>
              <li>检查配置信息是否正确（用户名、仓库名、分支名等）</li>
            </ul>
          </li>
          <li>
            <strong>Token 过期</strong>
            <ul>
              <li>重新生成 GitHub/Gitee Token</li>
              <li>在 Pixuli 中更新新的 Token</li>
            </ul>
          </li>
          <li>
            <strong>图片无法查看</strong>
            <ul>
              <li>检查仓库的可见性设置（必须为公开）</li>
              <li>确认存储路径配置正确</li>
              <li>验证图片是否已成功上传到仓库</li>
            </ul>
          </li>
          <li>
            <strong>无法切换仓库源</strong>
            <ul>
              <li>确认已正确配置多个仓库源</li>
              <li>检查当前仓库源是否可用</li>
              <li>尝试重新加载应用</li>
            </ul>
          </li>
        </ol>

        <h3>获取帮助</h3>

        <p>如遇到其他问题，请参考：</p>
        <ul>
          <li>
            <a
              href="https://github.com/trueLoving/Pixuli/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Issues
            </a>
          </li>
          <li>
            <a
              href="https://pixuli-web.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web 版在线体验
            </a>
          </li>
          <li>
            <a href="/keyboard">键盘快捷键说明</a>
          </li>
        </ul>

        <hr />

        <h2>总结</h2>

        <p>通过以上步骤，您就可以：</p>
        <ol>
          <li>✅ 创建 GitHub 或 Gitee 仓库</li>
          <li>✅ 获取访问权限 Token</li>
          <li>✅ 在 Pixuli 界面中完成仓库源配置</li>
          <li>✅ 开始上传和管理图片</li>
        </ol>

        <p>现在您可以享受 Pixuli 带来的图片管理体验了！</p>
      </div>
    </PageLayout>
  );
}
