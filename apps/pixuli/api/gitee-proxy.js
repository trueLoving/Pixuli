// Vercel Serverless Function (Node.js runtime)
// 必须放在 api/ 目录下，Vercel 才会将其部署为 Serverless Function
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
    // vercel.json 的 rewrite 会将 /api/gitee-proxy/:path* 转为 /api/gitee-proxy?path=:path
    let giteePath = req.query.path || '';

    // 如果没有 path 参数，尝试从 URL 中提取（直连 /api/gitee-proxy/xxx 时）
    if (!giteePath && req.url) {
      const urlMatch = req.url.match(/\/api\/gitee-proxy\/?(.+)$/);
      if (urlMatch && urlMatch[1]) {
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
    const originalUrl = new URL(req.url, `http://${req.headers.host}`);
    const searchParams = new URLSearchParams(originalUrl.search);
    searchParams.delete('path');
    const queryString = searchParams.toString();
    const giteeUrl = `https://gitee.com/${giteePath}${
      queryString ? `?${queryString}` : ''
    }`;

    const response = await fetch(giteeUrl, {
      method: req.method,
      headers: {
        Referer: 'https://gitee.com/',
        Origin: 'https://gitee.com',
        'User-Agent': 'Pixuli-Web/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
      });
    }

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

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
