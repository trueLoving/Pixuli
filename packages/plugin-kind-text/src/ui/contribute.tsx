import type { PluginUiHost } from '@pixuli/core/plugin-runtime';
import { matchTextKind } from '../match';
import type { DocumentReadFile } from '../documentText';
import { TextDocumentView } from './TextDocumentView';

export type ContributeTextUiOptions = {
  readFile?: DocumentReadFile;
  isLocalAvailable?: () => boolean;
};

function matchTextUiInput(input: {
  name: string;
  mimeType?: string;
  kind?: string;
}): boolean {
  if (input.kind === 'text') return true;
  return matchTextKind({ name: input.name, mimeType: input.mimeType });
}

export function contributeTextUi(
  ui: PluginUiHost,
  options: ContributeTextUiOptions = {},
): void {
  const { readFile, isLocalAvailable } = options;

  ui.registerPreview({
    id: 'kind.text',
    priority: 10,
    match: matchTextUiInput,
    component: function TextKindPreviewSlot({
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
        <TextDocumentView
          src={src}
          localPath={localPath}
          variant={variant}
          readFile={readFile}
          isLocalAvailable={isLocalAvailable}
          loadingLabel={t('image.text.loading')}
          errorLabel={t('image.text.loadFailed')}
        />
      );
    },
  });
}

export function unregisterTextUi(ui: PluginUiHost): void {
  ui.unregisterPreview('kind.text');
}
