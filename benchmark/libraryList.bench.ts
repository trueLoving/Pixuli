import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'path';
import {
  WORKSPACE_PATHS,
  WORKSPACE_SCHEMA_VERSION,
  MemoryWorkspaceAdapter,
  createIndexEntry,
  createLocalVault,
  encodeJson,
} from '@pixuli/core/vault';
import { LIBRARY_ROOT_LIST_CAP } from '@/features/library/utils/libraryScale';
import {
  LIBRARY_ROW_HEIGHT,
  getVirtualWindow,
} from '@/features/library/utils/virtualWindow';
import { describe, expect, it } from 'vitest';
import {
  formatBenchmarkReport,
  median,
  time,
  type BenchmarkRow,
} from './metrics';
import { renderBenchmarkHtml } from './renderReport';

const COUNT = Number(process.env.BENCHMARK_COUNT || 1000);
const FOLDERS = 10;
/** 宽松上限：只拦住数量级退化，不把本机抖动当成失败。 */
const OPEN_BUDGET_MS = 1500;
const LIST_BUDGET_MS = 250;
const WINDOW_BUDGET_MS = 50;

function folderName(index: number): string {
  return `f${String(index % FOLDERS).padStart(2, '0')}`;
}

describe('library list benchmark', () => {
  it(`measures a ${COUNT}-entry in-memory vault`, async () => {
    const adapter = new MemoryWorkspaceAdapter();
    await adapter.pickRoot();

    const entries = Array.from({ length: COUNT }, (_, index) => {
      const relativePath = `images/${folderName(index)}/img-${String(index).padStart(5, '0')}.jpg`;
      return createIndexEntry(relativePath, 2048, {
        tags: ['bench'],
        description: 'benchmark fixture',
        updatedAt: new Date(Date.UTC(2026, 0, 1) + index * 1000).toISOString(),
      });
    });

    const indexBytes = encodeJson({
      schemaVersion: WORKSPACE_SCHEMA_VERSION,
      entries,
    });
    await adapter.writeFile(WORKSPACE_PATHS.index, indexBytes);

    const heapBefore = process.memoryUsage().heapUsed;
    const vault = createLocalVault(adapter);
    const opened = await time(() => vault.open());

    const listSamples: number[] = [];
    for (let i = 0; i < 11; i += 1) {
      const sample = await time(() => vault.list());
      if (i > 0) listSamples.push(sample.ms);
      if (i === 0) {
        expect(sample.value).toHaveLength(COUNT);
      }
    }

    const shallowSamples: number[] = [];
    const prefix = `images/${folderName(0)}`;
    let shallowCount = 0;
    for (let i = 0; i < 11; i += 1) {
      const sample = await time(() =>
        vault.list({ pathPrefix: prefix, shallow: true }),
      );
      if (i === 0) shallowCount = sample.value.length;
      if (i > 0) shallowSamples.push(sample.ms);
    }

    const page = await time(() =>
      vault.listPage({ limit: LIBRARY_ROOT_LIST_CAP }),
    );

    const windowSteps = 200;
    const windowSamples: number[] = [];
    const viewport = 640;
    let windowSize = 0;
    for (let run = 0; run < 11; run += 1) {
      const sample = time(() => {
        let size = 0;
        for (let step = 0; step < windowSteps; step += 1) {
          const window = getVirtualWindow({
            total: COUNT,
            scrollTop: step * LIBRARY_ROW_HEIGHT * 4,
            viewportHeight: viewport,
            rowHeight: LIBRARY_ROW_HEIGHT,
          });
          size = window.end - window.start;
        }
        return size;
      });
      const resolved = await sample;
      windowSize = resolved.value;
      if (run > 0) windowSamples.push(resolved.ms);
    }

    const heapAfter = process.memoryUsage().heapUsed;
    const rows: BenchmarkRow[] = [
      {
        name: 'open-index',
        value: opened.ms,
        unit: 'ms',
        detail: `entries=${COUNT} indexBytes=${indexBytes.byteLength}`,
      },
      {
        name: 'list-all-median',
        value: median(listSamples),
        unit: 'ms',
        detail: `runs=${listSamples.length}`,
      },
      {
        name: 'list-shallow-median',
        value: median(shallowSamples),
        unit: 'ms',
        detail: `prefix=${prefix} count=${shallowCount}`,
      },
      {
        name: 'list-page-cap',
        value: page.ms,
        unit: 'ms',
        detail: `returned=${page.value.entries.length} total=${page.value.total} cap=${LIBRARY_ROOT_LIST_CAP}`,
      },
      {
        name: 'virtual-window-200',
        value: median(windowSamples),
        unit: 'ms',
        detail: `median of ${windowSteps} scroll steps, window=${windowSize}`,
      },
      {
        name: 'heap-delta',
        value: (heapAfter - heapBefore) / (1024 * 1024),
        unit: 'MiB',
        detail: 'heapUsed after list minus before open',
      },
    ];

    const report = formatBenchmarkReport(
      `Pixuli library list benchmark (n=${COUNT}, in-memory vault)`,
      rows,
    );
    console.log(`\n${report}\n`);

    const outDir = path.resolve(__dirname, 'results');
    mkdirSync(outDir, { recursive: true });
    const payload = {
      at: new Date().toISOString(),
      count: COUNT,
      rows,
    };
    writeFileSync(
      path.join(outDir, 'latest.json'),
      JSON.stringify(payload, null, 2),
    );
    const reportPath = path.join(outDir, 'report.html');
    writeFileSync(reportPath, renderBenchmarkHtml(payload));
    console.log(`benchmark report: ${reportPath}`);

    expect(opened.ms).toBeLessThan(OPEN_BUDGET_MS);
    expect(median(listSamples)).toBeLessThan(LIST_BUDGET_MS);
    expect(median(shallowSamples)).toBeLessThan(LIST_BUDGET_MS);
    expect(median(windowSamples)).toBeLessThan(WINDOW_BUDGET_MS);
    expect(shallowCount).toBe(COUNT / FOLDERS);
    expect(page.value.total).toBe(COUNT);
    expect(page.value.entries.length).toBe(
      Math.min(COUNT, LIBRARY_ROOT_LIST_CAP),
    );
  });
});
