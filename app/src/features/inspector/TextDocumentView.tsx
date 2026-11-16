import React, { useEffect, useState } from 'react';
import { loadDocumentText } from './loadDocumentText';
import './TextDocumentView.css';

type TextDocumentViewProps = {
  src: string | null;
  localPath?: string | null;
  className?: string;
  variant?: 'modal' | 'inspector';
  emptyLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
};

export function TextDocumentView({
  src,
  localPath = null,
  className,
  variant = 'modal',
  emptyLabel = '—',
  loadingLabel = '…',
  errorLabel = '—',
}: TextDocumentViewProps) {
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

    void loadDocumentText(localPath, src)
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
    'text-document-view',
    `text-document-view--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!hasSource || status === 'idle') {
    return (
      <div className={rootClass} aria-hidden>
        <p className="text-document-view-status">{emptyLabel}</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={rootClass} role="status">
        <p className="text-document-view-status">{loadingLabel}</p>
      </div>
    );
  }

  if (status === 'error' || text === null) {
    return (
      <div className={rootClass} role="alert">
        <p className="text-document-view-status">{errorLabel}</p>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <pre className="text-document-view-body">{text}</pre>
    </div>
  );
}
