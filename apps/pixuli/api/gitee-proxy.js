// Vercel Serverless Function (Node.js runtime)
// 用于代理 Gitee 图片请求，添加必要的请求头和 CORS 响应头

export default async function handler(req, res) {
  // 只允许 GET, HEAD, OPTIONS 请求
  if (
    req.method !== 'GET' &&
    req.method !== 'HEAD' &&
    req.method !== 'OPTIONS'
  ) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  try {
    // 从查询参数或路径中提取 Gitee 路径
    // Vercel rewrites 会将路径作为查询参数传递，或者我们可以从 req.url 中提取
    let giteePath = req.query.path || '';

    // 如果没有 path 参数，尝试从 URL 中提取
    if (!giteePath && req.url) {
      const urlMatch = req.url.match(/\/api\/gitee-proxy\/?(.+)$/);
      if (urlMatch && urlMatch[1]) {
        // 移除查询参数部分
        giteePath = urlMatch[1].split('?')[0];
      }
    }

    if (!giteePath) {
      return res.status(400).json({
        error: 'Invalid path: path parameter is required',
        debug: {
          url: req.url,
          query: req.query,
        },
      });
    }

    // 构建 Gitee URL
    // 从原始 URL 中提取查询参数（排除 path 参数）
    const originalUrl = new URL(req.url, `http://${req.headers.host}`);
    const searchParams = new URLSearchParams(originalUrl.search);
    searchParams.delete('path'); // 移除 path 参数
    const queryString = searchParams.toString();
    const giteeUrl = `https://gitee.com/${giteePath}${
      queryString ? `?${queryString}` : ''
    }`;

    // 发起请求到 Gitee，添加必要的请求头
    // Node.js 18+ 内置 fetch API
    const response = await fetch(giteeUrl, {
      method: req.method,
      headers: {
        Referer: 'https://gitee.com/',
        Origin: 'https://gitee.com',
        'User-Agent': 'Pixuli-Web/1.0',
      },
    });

    // 检查响应状态
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
      });
    }

    // 获取响应内容类型
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    // 设置 CORS 响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // 获取响应数据并返回
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Gitee proxy error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
