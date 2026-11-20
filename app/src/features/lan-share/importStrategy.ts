/** 局域网转移包导入策略 */

export type TransferImportStrategy = 'skip' | 'overwrite' | 'replace';

export const TRANSFER_IMPORT_STRATEGIES: TransferImportStrategy[] = [
  'skip',
  'overwrite',
  'replace',
];

export function isTransferImportStrategy(
  value: string,
): value is TransferImportStrategy {
  return (TRANSFER_IMPORT_STRATEGIES as string[]).includes(value);
}

/** skip：已有活跃条目则跳过；overwrite/replace：不跳过（replace 会先清空目标树） */
export function shouldSkipExistingEntry(
  strategy: TransferImportStrategy,
  hasActiveEntry: boolean,
): boolean {
  return strategy === 'skip' && hasActiveEntry;
}
