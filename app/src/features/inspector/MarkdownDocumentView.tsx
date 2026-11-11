import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  getWorkspaceAdapter,
  isWorkspaceAvailable,
} from '@/platforms/workspacePlatform';
import './MarkdownDocumentView.css';

type MarkdownDocumentViewProps = {
  src: string | null;
  /** 本机工作区路径：优先直接读盘，避免 fetch(blob:) 触发 CSP connect-src */
  localPath?: string | null;
  className?: string;
  /** inspector 侧栏用紧凑高度；全屏预览用大画布 */
  variant?: 'modal' | 'inspector';
  emptyLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
};

async function loadMarkdownText(
  localPath: string | null | undefined,
  src: string | null,
): Promise<string> {
  const path = localPath?.trim();
  if (path && isWorkspaceAvailable()) {
    const bytes = await getWorkspaceAdapter().readFile(path);
    return new TextDecoder('utf-8').decode(bytes);
  }

  if (!src) {
    throw new Error('no markdown source');
  }

  // blob: 在部分 CSP 下 connect-src 不含 blob，尽量不用 fetch
  if (src.startsWith('blob:')) {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  }

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

export function MarkdownDocumentView({
  src,
  localPath = null,
  className,
  variant = 'modal',
  emptyLabel = '—',
  loadingLabel = '…',
  errorLabel = '—',
}: MarkdownDocumentViewProps) {
  const [text, setText] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );

  const hasSource = Boolean(localPath?.trim() || src);

  useEffect(() => {
    if (!hasSource) {
      setText(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setText(null);

    void loadMarkdownText(localPath, src)
      .then(body => {
        if (cancelled) return;
        setText(body);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setText(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [hasSource, localPath, src]);

  const rootClass = [
    'markdown-document-view',
    `markdown-document-view--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!hasSource || status === 'idle') {
    return (
      <div className={rootClass} aria-hidden>
        <p className="markdown-document-view-status">{emptyLabel}</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={rootClass} role="status">
        <p className="markdown-document-view-status">{loadingLabel}</p>
      </div>
    );
  }

  if (status === 'error' || text === null) {
    return (
      <div className={rootClass} role="alert">
        <p className="markdown-document-view-status">{errorLabel}</p>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <article className="markdown-document-view-body">
        <ReactMarkdown>{text}</ReactMarkdown>
      </article>
    </div>
  );
}
