export type BenchmarkRow = {
  name: string;
  value: number;
  unit: string;
  detail: string;
};

export async function time<T>(
  fn: () => Promise<T> | T,
): Promise<{ ms: number; value: T }> {
  const start = performance.now();
  const value = await fn();
  return { ms: performance.now() - start, value };
}

export function median(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function formatBenchmarkReport(
  title: string,
  rows: BenchmarkRow[],
): string {
  const nameWidth = Math.max(12, ...rows.map(row => row.name.length));
  const lines = [
    title,
    `${'name'.padEnd(nameWidth)}  ${'value'.padStart(10)}  unit  detail`,
    ...rows.map(
      row =>
        `${row.name.padEnd(nameWidth)}  ${row.value.toFixed(2).padStart(10)}  ${row.unit.padEnd(4)}  ${row.detail}`,
    ),
  ];
  return lines.join('\n');
}
