/** Inspector「发送到压缩/转换」预填的文件；面板挂载时 take 一次 */

let pendingFiles: File[] = [];

export function setUtilityToolSeedFiles(files: File[]): void {
  pendingFiles = files;
}

export function takeUtilityToolSeedFiles(): File[] {
  const files = pendingFiles;
  pendingFiles = [];
  return files;
}
