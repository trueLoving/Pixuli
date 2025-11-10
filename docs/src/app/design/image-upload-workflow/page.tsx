import PageLayout from '../../../components/PageLayout';

export default function ImageUploadWorkflowPage() {
  return (
    <PageLayout
      title="图片上传业务流程设计"
      subtitle="详细描述图片从用户选择到存储到 GitHub 的完整业务流程"
      icon="fas fa-upload"
    >
      <div className="content-card">
        <h1>📤 图片上传业务流程设计</h1>

        <p>
          本文档详细描述了 Pixuli
          应用中图片上传的完整业务流程，从用户选择文件到最终存储到 GitHub
          仓库的每个步骤。
        </p>

        <hr />

        <h2>🎯 设计目标</h2>

        <h3>核心目标</h3>
        <ul>
          <li>
            <strong>用户体验</strong>
            ：提供流畅的上传体验，支持单文件和多文件上传
          </li>
          <li>
            <strong>数据完整性</strong>
            ：确保图片和元数据（尺寸、标签、描述等）完整保存
          </li>
          <li>
            <strong>容错性</strong>：即使元数据上传失败，图片文件也能成功上传
          </li>
          <li>
            <strong>性能优化</strong>：在上传前获取图片尺寸，避免重复加载
          </li>
          <li>
            <strong>进度反馈</strong>：提供实时上传进度和状态反馈
          </li>
        </ul>

        <h3>架构原则</h3>
        <ul>
          <li>
            <strong>分离关注点</strong>：图片文件上传和元数据上传分离
          </li>
          <li>
            <strong>数据优先</strong>：优先保存图片文件，元数据作为补充
          </li>
          <li>
            <strong>状态管理</strong>：使用 Zustand 管理上传状态和进度
          </li>
          <li>
            <strong>错误处理</strong>：完善的错误处理和用户提示
          </li>
        </ul>

        <hr />

        <h2>📊 完整业务流程</h2>

        <h3>1. 用户交互层（UI Component）</h3>

        <h4>1.1 文件选择</h4>
        <ul>
          <li>
            <strong>组件</strong>：<code>ImageUpload</code> (
            <code>packages/ui/src/components/image-upload/ImageUpload.tsx</code>
            )
          </li>
          <li>
            <strong>方式</strong>：支持拖拽上传和点击选择
          </li>
          <li>
            <strong>技术</strong>：使用 <code>react-dropzone</code> 库
          </li>
          <li>
            <strong>功能</strong>：
            <ul>
              <li>文件类型验证（仅图片格式）</li>
              <li>文件大小限制</li>
              <li>多文件选择支持</li>
            </ul>
          </li>
        </ul>

        <h4>1.2 文件信息获取</h4>
        <ul>
          <li>
            <strong>获取尺寸</strong>：在文件选择后立即获取图片尺寸
          </li>
          <li>
            <strong>技术实现</strong>：
            <pre>
              <code>{`const img = new Image();
const objectUrl = URL.createObjectURL(file);
img.onload = () => {
  const dimensions = {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  };
};`}</code>
            </pre>
          </li>
          <li>
            <strong>超时处理</strong>：10秒超时，失败时使用默认值 (0, 0)
          </li>
          <li>
            <strong>显示</strong>：在界面上显示文件尺寸信息
          </li>
        </ul>

        <h4>1.3 上传表单</h4>
        <ul>
          <li>
            <strong>单文件上传</strong>：文件名、描述、标签
          </li>
          <li>
            <strong>多文件上传</strong>：统一描述和标签，自动生成文件名
          </li>
          <li>
            <strong>预览</strong>：显示选中文件的缩略图和尺寸信息
          </li>
        </ul>

        <h3>2. 状态管理层（Zustand Store）</h3>

        <h4>2.1 Store 结构</h4>
        <ul>
          <li>
            <strong>位置</strong>：
            <code>apps/web/src/stores/imageStore.ts</code>
          </li>
          <li>
            <strong>状态</strong>：
            <ul>
              <li>
                <code>images</code>：图片列表
              </li>
              <li>
                <code>loading</code>：加载状态
              </li>
              <li>
                <code>batchUploadProgress</code>：批量上传进度
              </li>
            </ul>
          </li>
        </ul>

        <h4>2.2 上传方法</h4>
        <ul>
          <li>
            <strong>单文件上传</strong>：<code>uploadImage(uploadData)</code>
          </li>
          <li>
            <strong>多文件上传</strong>：
            <code>uploadMultipleImages(uploadData)</code>
          </li>
          <li>
            <strong>进度更新</strong>：实时更新每个文件的上传状态
          </li>
        </ul>

        <h3>3. 服务层（Storage Service）</h3>

        <h4>3.1 GitHubStorageService</h4>
        <ul>
          <li>
            <strong>位置</strong>：
            <code>apps/web/src/services/githubStorage.ts</code>
          </li>
          <li>
            <strong>核心方法</strong>：<code>uploadImage(uploadData)</code>
          </li>
        </ul>

        <h4>3.2 上传流程（三步骤）</h4>

        <h5>步骤 1：准备阶段 - 获取图片尺寸</h5>
        <ul>
          <li>
            <strong>方法</strong>：<code>getImageDimensions(file)</code>
          </li>
          <li>
            <strong>实现</strong>：使用浏览器 Image API 获取真实尺寸
          </li>
          <li>
            <strong>超时</strong>：10秒超时保护
          </li>
          <li>
            <strong>容错</strong>：失败时返回{' '}
            <code>{'{ width: 0, height: 0 }'}</code>
          </li>
        </ul>

        <h5>步骤 2：上传图片文件</h5>
        <ul>
          <li>
            <strong>方法</strong>：
            <code>uploadImageFile(file, fileName, description)</code>
          </li>
          <li>
            <strong>流程</strong>：
            <ol>
              <li>
                将文件转换为 base64：<code>fileToBase64(file)</code>
              </li>
              <li>
                构建文件路径：<code>{'{path}/{fileName}'}</code>
              </li>
              <li>
                调用 GitHub API：
                <code>
                  PUT
                  /repos/&#123;owner&#125;/&#123;repo&#125;/contents/&#123;path&#125;
                </code>
              </li>
              <li>返回响应：SHA、download_url、html_url</li>
            </ol>
          </li>
          <li>
            <strong>GitHub API 请求体</strong>：
            <pre>
              <code>{`{
  "message": "Upload image: {fileName}",
  "content": "{base64Content}",
  "branch": "{branch}"
}`}</code>
            </pre>
          </li>
        </ul>

        <h5>步骤 3：上传元数据</h5>
        <ul>
          <li>
            <strong>方法</strong>：
            <code>uploadImageMetadata(fileName, metadata)</code>
          </li>
          <li>
            <strong>元数据内容</strong>：
            <pre>
              <code>{`{
  "id": "{sha}",
  "name": "{fileName}",
  "description": "{description}",
  "tags": ["tag1", "tag2"],
  "size": {fileSize},        // 文件大小（字节）
  "width": {width},          // 图片宽度
  "height": {height},        // 图片高度
  "createdAt": "{ISOString}",
  "updatedAt": "{ISOString}"
}`}</code>
            </pre>
          </li>
          <li>
            <strong>存储位置</strong>：
            <code>
              &#123;path&#125;/.metadata/&#123;fileName&#125;.metadata.&#123;ext&#125;.json
            </code>
          </li>
          <li>
            <strong>容错处理</strong>：
            <ul>
              <li>元数据上传失败不影响图片文件上传</li>
              <li>记录警告日志，提示后续可补充</li>
            </ul>
          </li>
        </ul>

        <h3>4. 数据流图</h3>

        <pre>
          <code>{`用户选择文件
    ↓
[UI Layer] ImageUpload 组件
    ├─ 文件验证
    ├─ 获取图片尺寸（预览用）
    └─ 显示上传表单
    ↓
[State Layer] imageStore.uploadImage()
    ├─ 设置 loading 状态
    └─ 调用 storageService.uploadImage()
    ↓
[Service Layer] GitHubStorageService.uploadImage()
    ├─ 步骤1：getImageDimensions(file)
    │   └─ 获取 width, height
    ├─ 步骤2：uploadImageFile()
    │   ├─ fileToBase64(file)
    │   ├─ GitHub API PUT /contents/&#123;path&#125;
    │   └─ 返回 SHA, download_url, html_url
    ├─ 构建 ImageItem 对象
    │   ├─ id: SHA
    │   ├─ size: file.size
    │   ├─ width, height
    │   ├─ tags, description
    │   └─ createdAt, updatedAt
    └─ 步骤3：uploadImageMetadata()
        ├─ 构建元数据 JSON
        ├─ 转换为 base64
        └─ GitHub API PUT /contents/.metadata/&#123;fileName&#125;.json
    ↓
[State Layer] 更新状态
    ├─ 添加新图片到 images 数组
    ├─ 更新 loading 状态
    └─ 显示成功提示
    ↓
[UI Layer] 刷新图片列表`}</code>
        </pre>

        <h3>5. 批量上传流程</h3>

        <h4>5.1 多文件处理</h4>
        <ul>
          <li>
            <strong>方法</strong>：<code>uploadMultipleImages(uploadData)</code>
          </li>
          <li>
            <strong>流程</strong>：
            <ol>
              <li>初始化批量上传进度状态</li>
              <li>遍历文件列表，逐个上传</li>
              <li>为每个文件更新进度状态</li>
              <li>上传成功后更新状态为 success</li>
              <li>上传失败时更新状态为 error</li>
              <li>所有文件完成后显示总结</li>
            </ol>
          </li>
        </ul>

        <h4>5.2 进度跟踪</h4>
        <ul>
          <li>
            <strong>状态结构</strong>：
            <pre>
              <code>{`{
  total: number,           // 总文件数
  completed: number,        // 已完成数
  current: string,          // 当前上传文件名
  items: UploadProgress[]   // 每个文件的状态
}`}</code>
            </pre>
          </li>
          <li>
            <strong>UploadProgress</strong>：
            <pre>
              <code>{`{
  id: string,
  progress: number,         // 0-100
  status: 'uploading' | 'success' | 'error',
  message?: string,
  width?: number,           // 图片宽度
  height?: number           // 图片高度
}`}</code>
            </pre>
          </li>
        </ul>

        <h3>6. 错误处理</h3>

        <h4>6.1 尺寸获取失败</h4>
        <ul>
          <li>
            <strong>处理</strong>：使用默认值{' '}
            <code>{'{ width: 0, height: 0 }'}</code>
          </li>
          <li>
            <strong>影响</strong>：不影响上传流程，后续可补充
          </li>
        </ul>

        <h4>6.2 图片文件上传失败</h4>
        <ul>
          <li>
            <strong>处理</strong>：抛出错误，停止上传流程
          </li>
          <li>
            <strong>用户提示</strong>：显示错误消息
          </li>
        </ul>

        <h4>6.3 元数据上传失败</h4>
        <ul>
          <li>
            <strong>处理</strong>：记录警告，但不影响图片上传成功
          </li>
          <li>
            <strong>原因</strong>：图片文件已成功上传，元数据可后续补充
          </li>
          <li>
            <strong>日志</strong>：记录警告信息，提示可手动补充
          </li>
        </ul>

        <h3>7. 关键技术点</h3>

        <h4>7.1 文件转 Base64</h4>
        <ul>
          <li>
            <strong>方法</strong>：<code>FileReader.readAsDataURL()</code>
          </li>
          <li>
            <strong>处理</strong>：移除 <code>data:image/...;base64,</code> 前缀
          </li>
        </ul>

        <h4>7.2 图片尺寸获取</h4>
        <ul>
          <li>
            <strong>属性</strong>：使用 <code>naturalWidth</code> 和{' '}
            <code>naturalHeight</code>
          </li>
          <li>
            <strong>原因</strong>：获取真实尺寸，不受 CSS 缩放影响
          </li>
          <li>
            <strong>备选</strong>：如果 naturalWidth 不可用，使用 width
          </li>
        </ul>

        <h4>7.3 GitHub API 调用</h4>
        <ul>
          <li>
            <strong>认证</strong>：使用 Personal Access Token
          </li>
          <li>
            <strong>方法</strong>：PUT 请求创建/更新文件
          </li>
          <li>
            <strong>SHA 管理</strong>：更新文件时需要提供当前文件的 SHA
          </li>
        </ul>

        <h3>8. 元数据文件结构</h3>

        <h4>8.1 文件命名规则</h4>
        <ul>
          <li>
            <strong>格式</strong>：
            <code>&#123;filename&#125;.metadata.&#123;ext&#125;.json</code>
          </li>
          <li>
            <strong>示例</strong>：<code>photo.metadata.jpg.json</code>
          </li>
        </ul>

        <h4>8.2 元数据内容</h4>
        <pre>
          <code>{`{
  "id": "abc123...",
  "name": "photo.jpg",
  "description": "图片描述",
  "tags": ["tag1", "tag2"],
  "size": 2097152,        // 文件大小（字节）
  "width": 1920,          // 图片宽度
  "height": 1080,         // 图片高度
  "createdAt": "2025-11-10T01:07:00.879Z",
  "updatedAt": "2025-11-10T01:07:00.879Z"
}`}</code>
        </pre>

        <h3>9. 性能优化</h3>

        <ul>
          <li>
            <strong>提前获取尺寸</strong>：在上传前获取，避免重复加载
          </li>
          <li>
            <strong>批量上传优化</strong>：逐个上传，避免并发过多
          </li>
          <li>
            <strong>进度反馈</strong>：实时更新，提升用户体验
          </li>
          <li>
            <strong>错误恢复</strong>：部分失败不影响其他文件
          </li>
        </ul>

        <h3>10. 代码位置总结</h3>

        <table>
          <thead>
            <tr>
              <th>层级</th>
              <th>文件路径</th>
              <th>关键方法</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>UI 层</td>
              <td>
                <code>
                  packages/ui/src/components/image-upload/ImageUpload.tsx
                </code>
              </td>
              <td>
                <code>onDrop</code>, <code>handleSubmit</code>
              </td>
            </tr>
            <tr>
              <td>状态层</td>
              <td>
                <code>apps/web/src/stores/imageStore.ts</code>
              </td>
              <td>
                <code>uploadImage</code>, <code>uploadMultipleImages</code>
              </td>
            </tr>
            <tr>
              <td>服务层</td>
              <td>
                <code>apps/web/src/services/githubStorage.ts</code>
              </td>
              <td>
                <code>uploadImage</code>, <code>uploadImageFile</code>,{' '}
                <code>uploadImageMetadata</code>
              </td>
            </tr>
          </tbody>
        </table>

        <hr />

        <h2>📝 总结</h2>

        <p>
          图片上传业务流程采用三层架构设计：UI
          层负责用户交互，状态层管理上传状态和进度，服务层处理实际的存储逻辑。整个流程分为三个关键步骤：获取图片尺寸、上传图片文件、上传元数据。这种设计确保了数据完整性、良好的用户体验和系统的健壮性。
        </p>
      </div>
    </PageLayout>
  );
}
