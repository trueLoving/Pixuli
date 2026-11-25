import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import { matchMarkdownKind } from '../match';
import type { DocumentReadFile } from '../documentText';
import { MarkdownDocumentView } from './MarkdownDocumentView';

export type ContributeMarkdownUiOptions = {
  readFile?: DocumentReadFile;
  isLocalAvailable?: () => boolean;
};

function matchMarkdownUiInput(input: {
  name: string;
  mimeType?: string;
  kind?: string;
}): boolean {
  if (input.kind === 'markdown') return true;
  return matchMarkdownKind({ name: input.name, mimeType: input.mimeType });
}

export function contributeMarkdownUi(
  ui: PluginUiHost,
  options: ContributeMarkdownUiOptions = {},
): void {
  const { readFile, isLocalAvailable } = options;

  ui.registerPreview({
    id: 'kind.markdown',
    priority: 10,
    match: matchMarkdownUiInput,
    component: function MarkdownKindPreviewSlot({
      src,
      localPath,
      variant,
      t,
    }: {
      asset: { name: string };
      src: string | null;
      localPath?: string | null;
      variant: 'inspector' | 'modal';
      t: (key: string) => string;
    }) {
      return (
        <MarkdownDocumentView
          src={src}
          localPath={localPath}
          variant={variant}
          readFile={readFile}
          isLocalAvailable={isLocalAvailable}
          loadingLabel={t('image.markdown.loading')}
          errorLabel={t('image.markdown.loadFailed')}
        />
      );
    },
  });
}

export function unregisterMarkdownUi(ui: PluginUiHost): void {
  ui.unregisterPreview('kind.markdown');
}
