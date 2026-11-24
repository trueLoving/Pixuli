import { contributePdfUi } from '@pixuli/kind-pdf/ui';
import { contributeGiteeUi } from '@pixuli/provider-gitee/ui';
import { contributeGitHubUi } from '@pixuli/provider-github/ui';
import { PdfDocumentView } from '@/features/inspector/PdfDocumentView';
import { contributeBuiltinKindUi } from './contributeBuiltinKindUi';
import { uiRegistry } from './uiRegistry';

let contributed = false;

/** Runtime 启动后注册全部 Builtin UI 贡献（幂等） */
export function contributeAllPluginUi(): void {
  if (contributed) return;
  contributeBuiltinKindUi(uiRegistry);
  contributePdfUi(uiRegistry, { PreviewComponent: PdfDocumentView });
  contributeGitHubUi(uiRegistry);
  contributeGiteeUi(uiRegistry);
  contributed = true;
}
