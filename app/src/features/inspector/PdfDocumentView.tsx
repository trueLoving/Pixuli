import React, { useCallback } from 'react';
import {
  PdfDocumentView as KindPdfDocumentView,
  type PdfDocumentViewProps as KindPdfDocumentViewProps,
} from '@pixuli/kind-pdf/ui';
import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';

export type PdfDocumentViewProps = Omit<
  KindPdfDocumentViewProps,
  'readFile' | 'isLocalAvailable'
>;

/** 注入 workspace 读盘；UI/引擎在 `@pixuli/kind-pdf`。 */
export function PdfDocumentView(props: PdfDocumentViewProps) {
  const readFile = useCallback(
    (path: string) => getWorkspaceAdapter().readFile(path),
    [],
  );

  return (
    <KindPdfDocumentView
      {...props}
      readFile={readFile}
      isLocalAvailable={isWorkspaceAvailable}
    />
  );
}
