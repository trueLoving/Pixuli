/**
 * 切换文件夹范围时是否应重置多选 / 已生效查询（SSOT P1-3）。
 * 首次进入（prev 未知）不重置，避免挂载误清。
 */
export function shouldResetOnFolderChange(
  previousPath: string | null,
  nextPath: string,
): boolean {
  if (previousPath === null) return false;
  return previousPath !== nextPath;
}
