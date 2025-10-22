export default function TutorialPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1>Pixuli 使用说明教程</h1>

        <p>
          本文档将引导您快速上手 Pixuli 图片管理应用，主要包括 GitHub
          存储配置和图片上传功能。
        </p>

        <h2>前提条件</h2>

        <ul>
          <li>已安装 Pixuli 应用</li>
          <li>拥有 GitHub 账号</li>
        </ul>

        <hr />

        <h2>配置步骤</h2>

        <h3>步骤 1: 创建开源仓库</h3>

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

        <h3>步骤 2: 获取 GitHub Token</h3>

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

        <h3>步骤 3: 在 Pixuli 中配置存储</h3>

        <ol>
          <li>打开 Pixuli 应用</li>
          <li>
            进入 <strong>设置</strong> 或 <strong>配置</strong> 页面
          </li>
          <li>
            找到 <strong>GitHub 存储配置</strong> 选项
          </li>
          <li>填写以下配置信息：</li>
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
                  <strong>用户名</strong>
                </td>
                <td>您的 GitHub 用户名</td>
                <td>
                  <code>yourgithubname</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>仓库名</strong>
                </td>
                <td>刚创建的仓库名称</td>
                <td>
                  <code>my-images</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>分支名</strong>
                </td>
                <td>主分支名称</td>
                <td>
                  <code>main</code> 或 <code>master</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>存储路径</strong>
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

        <ol start={5}>
          <li>
            点击 <strong>保存</strong> 或 <strong>确认</strong> 完成配置
          </li>
          <li>应用会测试连接，成功后可开始使用</li>
        </ol>

        <hr />

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
              <li>图片会自动上传到您的 GitHub 仓库</li>
              <li>支持多种图片格式</li>
              <li>可在 GitHub 仓库中查看和管理</li>
            </ul>
          </li>
        </ol>

        <h3>查看和管理</h3>

        <ul>
          <li>
            <strong>预览图片</strong>：在应用中直接预览所有已上传的图片
          </li>
          <li>
            <strong>文件管理</strong>：按上传时间和文件名进行管理
          </li>
          <li>
            <strong>在线访问</strong>：通过 GitHub 仓库 URL 在线查看所有图片
          </li>
        </ul>

        <hr />

        <h2>常用功能</h2>

        <h3>GitHub 仓库访问</h3>

        <p>所有上传的图片都保存在您的 GitHub 仓库中，可以通过以下方式访问：</p>

        <pre>
          <code>https://github.com/您的用户名/仓库名/存储路径/</code>
        </pre>

        <p>例如：</p>

        <pre>
          <code>https://github.com/johndoe/my-images/images/</code>
        </pre>

        <hr />

        <h2>故障排除</h2>

        <h3>常见问题</h3>

        <ol>
          <li>
            <strong>无法上传图片</strong>
            <ul>
              <li>检查 GitHub Token 是否有效</li>
              <li>确认仓库设置为 Public</li>
              <li>验证网络连接是否正常</li>
            </ul>
          </li>
          <li>
            <strong>Token 过期</strong>
            <ul>
              <li>重新生成 GitHub Token</li>
              <li>在 Pixuli 中更新新的 Token</li>
            </ul>
          </li>
          <li>
            <strong>图片无法查看</strong>
            <ul>
              <li>检查仓库的可见性设置</li>
              <li>确认存储路径配置正确</li>
            </ul>
          </li>
        </ol>

        <h3>获取帮助</h3>

        <p>如遇到其他问题，请参考：</p>
        <ul>
          <li>
            <a href="https://github.com/trueLoving/Pixuli/issues">
              GitHub Issues
            </a>
          </li>
          <li>
            <a href="https://pixuli-web.vercel.app/">Web 版在线体验</a>
          </li>
          <li>
            <a href="/keyboard">键盘快捷键说明</a>
          </li>
        </ul>

        <hr />

        <h2>总结</h2>

        <p>通过以上 3 个简单步骤，您就可以：</p>
        <ol>
          <li>✅ 创建 GitHub 开源仓库</li>
          <li>✅ 获取访问权限 Token</li>
          <li>✅ 在 Pixuli 中完成配置</li>
          <li>✅ 开始上传和管理图片</li>
        </ol>

        <p>现在您可以享受 Pixuli 带来的图片管理体验了！</p>
      </div>
    </div>
  );
}
