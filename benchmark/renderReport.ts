export type BenchmarkReportData = {
  at: string;
  count: number;
  rows: Array<{
    name: string;
    value: number;
    unit: string;
    detail: string;
  }>;
};

const LABELS: Record<string, string> = {
  'open-index': '打开索引',
  'list-all-median': '全量 list',
  'list-shallow-median': '文件夹浅列表',
  'list-page-cap': '根视图分页上限',
  'virtual-window-200': '虚拟窗口 200 步',
  'heap-delta': '堆增量',
};

export function renderBenchmarkHtml(data: BenchmarkReportData): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pixuli 性能基准</title>
  <style>
    :root { color-scheme: light; --ink: #1c1917; --muted: #57534e; --line: #e7e5e4; --paper: #fafaf9; --bar: #0f766e; --row: #f5f5f4; --mounted: #ccfbf1; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 15px/1.5 "Iowan Old Style", Palatino, "Songti SC", serif; color: var(--ink); background: var(--paper); }
    main { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }
    h1 { font-size: 28px; font-weight: 600; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 36px 0 12px; }
    p.meta { color: var(--muted); margin: 0; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 20px; }
    .card { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: white; }
    .card b { display: block; font-size: 22px; font-variant-numeric: tabular-nums; }
    .card span { color: var(--muted); font-size: 13px; }
    .bars { display: grid; gap: 10px; }
    .bar-row { display: grid; grid-template-columns: 140px 1fr 72px; gap: 10px; align-items: center; }
    .track { height: 10px; background: var(--row); border-radius: 99px; overflow: hidden; }
    .fill { height: 100%; background: var(--bar); border-radius: 99px; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .stage { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; }
    .viewport { height: 352px; overflow: auto; border: 1px solid var(--line); border-radius: 12px; background: white; }
    .row { height: 44px; display: flex; align-items: center; padding: 0 12px; border-bottom: 1px solid var(--line); background: var(--mounted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    .readout { border: 1px solid var(--line); border-radius: 12px; padding: 16px; background: white; }
    .readout dt { color: var(--muted); font-size: 13px; }
    .readout dd { margin: 0 0 12px; font-variant-numeric: tabular-nums; font-size: 20px; }
    button { font: inherit; border: 1px solid var(--line); background: white; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
    @media (max-width: 720px) { .stage, .bar-row { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <h1>列表热路径基准</h1>
    <p class="meta" id="meta"></p>
    <section class="cards" id="cards"></section>
    <h2>耗时</h2>
    <div class="bars" id="bars"></div>
    <h2>虚拟窗口</h2>
    <p class="meta">下面只挂载可见行和少量 overscan，滚动时 DOM 行数保持在窗口内。</p>
    <div class="stage">
      <div class="viewport" id="viewport"></div>
      <div>
        <dl class="readout">
          <dt>挂载行</dt><dd id="mounted">—</dd>
          <dt>窗口</dt><dd id="range">—</dd>
          <dt>滚动</dt><dd id="scroll">—</dd>
        </dl>
        <button type="button" id="toggle">暂停</button>
      </div>
    </div>
  </main>
  <script id="benchmark-data" type="application/json">${json}</script>
  <script>
    const data = JSON.parse(document.getElementById('benchmark-data').textContent);
    const labels = ${JSON.stringify(LABELS)};
    const when = new Date(data.at);
    document.getElementById('meta').textContent =
      when.toLocaleString('zh-CN') + ' · ' + data.count + ' 条内存索引';

    const cards = document.getElementById('cards');
    for (const row of data.rows) {
      const card = document.createElement('article');
      card.className = 'card';
      const value = document.createElement('b');
      value.textContent = row.value.toFixed(2) + ' ' + row.unit;
      const label = document.createElement('span');
      label.textContent = labels[row.name] || row.name;
      card.append(value, label);
      cards.append(card);
    }

    const timed = data.rows.filter(row => row.unit === 'ms');
    const max = Math.max(...timed.map(row => row.value), 0.001);
    const bars = document.getElementById('bars');
    for (const row of timed) {
      const line = document.createElement('div');
      line.className = 'bar-row';
      const name = document.createElement('div');
      name.textContent = labels[row.name] || row.name;
      const track = document.createElement('div');
      track.className = 'track';
      const fill = document.createElement('div');
      fill.className = 'fill';
      fill.style.width = Math.max(2, (row.value / max) * 100) + '%';
      track.append(fill);
      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = row.value.toFixed(2) + ' ms';
      line.append(name, track, num);
      bars.append(line);
    }

    const ROW = 44;
    const OVERSCAN = 8;
    const total = data.count;
    const viewport = document.getElementById('viewport');
    const spacer = document.createElement('div');
    const list = document.createElement('div');
    viewport.append(spacer, list);

    function windowFor(scrollTop, height) {
      const visible = Math.max(1, Math.ceil(Math.max(1, height) / ROW));
      const start = Math.max(0, Math.floor(Math.max(0, scrollTop) / ROW) - OVERSCAN);
      const end = Math.min(total, start + visible + OVERSCAN * 2);
      return { start, end, offsetTop: start * ROW, offsetBottom: Math.max(0, (total - end) * ROW) };
    }

    function paint() {
      const frame = windowFor(viewport.scrollTop, viewport.clientHeight);
      spacer.style.height = frame.offsetTop + 'px';
      list.style.marginBottom = frame.offsetBottom + 'px';
      list.replaceChildren();
      for (let i = frame.start; i < frame.end; i++) {
        const folder = String(i % 10).padStart(2, '0');
        const row = document.createElement('div');
        row.className = 'row';
        row.textContent = 'images/f' + folder + '/img-' + String(i).padStart(5, '0') + '.jpg';
        list.append(row);
      }
      document.getElementById('mounted').textContent = String(frame.end - frame.start);
      document.getElementById('range').textContent = frame.start + ' – ' + frame.end;
      document.getElementById('scroll').textContent = Math.round(viewport.scrollTop) + ' px';
    }

    let playing = true;
    let last = 0;
    function tick(now) {
      if (playing) {
        const dt = last ? now - last : 16;
        last = now;
        const maxScroll = Math.max(0, total * ROW - viewport.clientHeight);
        let next = viewport.scrollTop + dt * 0.35;
        if (next >= maxScroll) next = 0;
        viewport.scrollTop = next;
        paint();
      }
      requestAnimationFrame(tick);
    }
    viewport.addEventListener('scroll', () => { if (!playing) paint(); });
    document.getElementById('toggle').addEventListener('click', (event) => {
      playing = !playing;
      last = 0;
      event.currentTarget.textContent = playing ? '暂停' : '继续';
    });
    paint();
    requestAnimationFrame(tick);
  </script>
</body>
</html>
`;
}
