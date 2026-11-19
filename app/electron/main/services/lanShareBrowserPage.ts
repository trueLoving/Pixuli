/** 局域网只读 Host 浏览器页（手机访客） */

export function renderLanShareBrowserPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Pixuli 局域网共享</title>
  <style>
    :root {
      --bg: #f7f7f8;
      --card: #fff;
      --fg: #111;
      --muted: #6b7280;
      --line: #e5e7eb;
      --accent: #6d28d9;
      --accent-soft: #ede9fe;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--fg);
    }
    header {
      position: sticky; top: 0; z-index: 5;
      background: color-mix(in srgb, var(--card) 92%, transparent);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--line);
      padding: 0.75rem 1rem 0.85rem;
    }
    h1 { font-size: 1.05rem; margin: 0 0 0.25rem; }
    .meta { color: var(--muted); font-size: 0.8rem; line-height: 1.4; }
    .toolbar {
      display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; align-items: center;
    }
    input[type="search"] {
      flex: 1 1 10rem; min-height: 2.5rem; border: 1px solid var(--line);
      border-radius: 0.5rem; padding: 0 0.75rem; font-size: 1rem;
    }
    button, .btn {
      min-height: 2.5rem; border-radius: 0.5rem; border: 1px solid var(--line);
      background: var(--card); color: var(--fg); padding: 0 0.85rem; font-size: 0.9rem;
    }
    button.primary {
      background: var(--accent); border-color: var(--accent); color: #fff;
    }
    button:disabled { opacity: 0.45; }
    .crumbs {
      display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.6rem; font-size: 0.85rem;
    }
    .crumbs a { color: var(--accent); text-decoration: none; }
    main { padding: 0.5rem 0 5.5rem; }
    .row {
      display: grid; grid-template-columns: 2.25rem 1fr auto;
      align-items: center; gap: 0.25rem;
      background: var(--card); border-bottom: 1px solid var(--line);
      min-height: 3rem; padding: 0.35rem 0.75rem;
    }
    .row a.name {
      color: inherit; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      padding: 0.35rem 0;
    }
    .row .kind { color: var(--muted); font-size: 0.75rem; margin-left: 0.35rem; }
    .bar {
      position: fixed; left: 0; right: 0; bottom: 0;
      background: var(--card); border-top: 1px solid var(--line);
      padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
      display: flex; gap: 0.5rem; align-items: center; justify-content: space-between;
    }
    .bar .count { font-size: 0.9rem; color: var(--muted); }
    .empty { padding: 2rem 1rem; text-align: center; color: var(--muted); }
    .err { color: #b91c1c; padding: 1rem; }
  </style>
</head>
<body>
  <header>
    <h1>Pixuli 局域网共享</h1>
    <p class="meta">只读访客页 · 勾选文件或文件夹后下载转移包（含描述/标签）· 请到 Pixuli App「导入转移包」写入自己的工作区</p>
    <div class="toolbar">
      <input id="filter" type="search" placeholder="筛选当前目录…" enterkeyhint="search" />
      <button type="button" id="selectVisible">全选可见</button>
      <button type="button" id="clearSelected">清空勾选</button>
    </div>
    <nav class="crumbs" id="crumbs" aria-label="路径"></nav>
  </header>
  <main id="list"></main>
  <div class="bar">
    <span class="count" id="count">已选 0</span>
    <button type="button" class="primary" id="download" disabled>下载转移包</button>
  </div>
  <script>
    const params = new URLSearchParams(location.search);
    const token = params.get('token') || '';
    const state = { path: params.get('path') || '', entries: [], selected: new Set(), filter: '' };

    function withToken(url) {
      const u = new URL(url, location.origin);
      u.searchParams.set('token', token);
      return u.pathname + u.search;
    }

    function setStatus(text) {
      document.getElementById('count').textContent = text;
    }

    function renderCrumbs() {
      const nav = document.getElementById('crumbs');
      const parts = state.path ? state.path.split('/').filter(Boolean) : [];
      let html = '<a href="' + withToken('/?path=') + '">根目录</a>';
      let acc = '';
      for (const part of parts) {
        acc = acc ? acc + '/' + part : part;
        html += ' / <a href="' + withToken('/?path=' + encodeURIComponent(acc)) + '">' + escapeHtml(part) + '</a>';
      }
      nav.innerHTML = html;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function visibleEntries() {
      const q = state.filter.trim().toLowerCase();
      if (!q) return state.entries;
      return state.entries.filter(e => e.name.toLowerCase().includes(q));
    }

    function renderList() {
      const root = document.getElementById('list');
      const rows = visibleEntries();
      if (!rows.length) {
        root.innerHTML = '<p class="empty">没有匹配的文件或文件夹</p>';
        updateBar();
        return;
      }
      root.innerHTML = rows.map(entry => {
        const checked = state.selected.has(entry.relativePath) ? 'checked' : '';
        const href = entry.kind === 'dir'
          ? withToken('/?path=' + encodeURIComponent(entry.relativePath))
          : withToken('/file?path=' + encodeURIComponent(entry.relativePath));
        const icon = entry.kind === 'dir' ? '📁' : '📄';
        return '<div class="row">' +
          '<input type="checkbox" data-path="' + escapeHtml(entry.relativePath) + '" data-kind="' + entry.kind + '" ' + checked + ' />' +
          '<a class="name" href="' + href + '">' + icon + ' ' + escapeHtml(entry.name) +
          (entry.kind === 'dir' ? '<span class="kind">文件夹</span>' : '') + '</a>' +
          (entry.kind === 'file'
            ? '<a class="btn" href="' + href + '" download>打开</a>'
            : '<span></span>') +
          '</div>';
      }).join('');
      root.querySelectorAll('input[type=checkbox]').forEach(el => {
        el.addEventListener('click', e => e.stopPropagation());
        el.addEventListener('change', () => {
          const p = el.getAttribute('data-path');
          if (!p) return;
          if (el.checked) state.selected.add(p);
          else state.selected.delete(p);
          updateBar();
        });
      });
      updateBar();
    }

    function updateBar() {
      const n = state.selected.size;
      setStatus('已选 ' + n);
      document.getElementById('download').disabled = n === 0;
    }

    async function load() {
      renderCrumbs();
      const url = withToken('/api/list?path=' + encodeURIComponent(state.path));
      const res = await fetch(url);
      if (res.status === 401) {
        document.getElementById('list').innerHTML = '<p class="err">口令无效或共享已关闭</p>';
        return;
      }
      if (!res.ok) {
        document.getElementById('list').innerHTML = '<p class="err">加载失败</p>';
        return;
      }
      const data = await res.json();
      state.entries = data.entries || [];
      renderList();
    }

    document.getElementById('filter').addEventListener('input', e => {
      state.filter = e.target.value || '';
      renderList();
    });
    document.getElementById('selectVisible').addEventListener('click', () => {
      visibleEntries().forEach(e => {
        state.selected.add(e.relativePath);
      });
      renderList();
    });
    document.getElementById('clearSelected').addEventListener('click', () => {
      state.selected.clear();
      renderList();
    });
    document.getElementById('download').addEventListener('click', async () => {
      const paths = Array.from(state.selected);
      if (!paths.length) return;
      const btn = document.getElementById('download');
      btn.disabled = true;
      btn.textContent = '打包中…';
      try {
        const res = await fetch(withToken('/api/export'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths }),
        });
        if (!res.ok) {
          const text = await res.text();
          alert(text || '导出失败');
          return;
        }
        const blob = await res.blob();
        const disp = res.headers.get('Content-Disposition') || '';
        const match = /filename\\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i.exec(disp);
        const filename = decodeURIComponent((match && (match[1] || match[2])) || 'pixuli-transfer.zip');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 0);
      } catch (err) {
        alert(err && err.message ? err.message : '导出失败');
      } finally {
        btn.textContent = '下载转移包';
        updateBar();
      }
    });

    if (!token) {
      document.getElementById('list').innerHTML = '<p class="err">缺少访问口令，请使用桌面端复制的完整链接</p>';
    } else {
      load();
    }
  </script>
</body>
</html>`;
}
