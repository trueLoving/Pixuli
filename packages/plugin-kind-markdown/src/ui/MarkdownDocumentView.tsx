import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { loadDocumentText, type DocumentReadFile } from '../documentText';
import './MarkdownDocumentView.css';

export type MarkdownDocumentViewProps = {
  src: string | null;
  localPath?: string | null;
  readFile?: DocumentReadFile;
  isLocalAvailable?: () => boolean;
  className?: string;
  variant?: 'modal' | 'inspector';
  emptyLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
};

export function MarkdownDocumentView({
  src,
  localPath = null,
  readFile,
  isLocalAvailable,
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

    void loadDocumentText(localPath, src, { readFile, isLocalAvailable })
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
  }, [hasSource, localPath, src, readFile, isLocalAvailable]);

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
