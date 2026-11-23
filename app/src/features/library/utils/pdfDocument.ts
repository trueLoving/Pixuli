import { loadPdfjs, openPdfDocument } from '@pixuli/kind-pdf';
import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';

export { loadPdfjs };

/**
 * 本机优先读盘；注入 workspace 适配器。
 * 引擎实现见 `@pixuli/kind-pdf`。
 */
export async function loadPdfDocument(
  localPath: string | null | undefined,
  src: string | null,
): Promise<Awaited<ReturnType<typeof openPdfDocument>>> {
  return openPdfDocument({
    localPath,
    src,
    readFile: path => getWorkspaceAdapter().readFile(path),
    isLocalAvailable: isWorkspaceAvailable,
  });
}
