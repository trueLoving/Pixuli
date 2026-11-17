import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { loadPdfDocument } from '@/features/library/utils/pdfDocument';
import './PdfDocumentView.css';

export type PdfDocumentViewProps = {
  src: string | null;
  localPath?: string | null;
  className?: string;
  variant?: 'modal' | 'inspector';
  emptyLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
  pageLabel?: (page: number, total: number) => string;
};

function PdfPageCanvas({
  page,
  maxWidth,
}: {
  page: PDFPageProxy;
  maxWidth: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maxWidth <= 0) return;

    let renderTask: { cancel: () => void } | null = null;

    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(maxWidth / base.width, 2.5);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    renderTask = page.render({
      canvasContext: context,
      viewport,
    });

    void renderTask.promise.catch(() => {
      /* cancelled or transient */
    });

    return () => {
      try {
        renderTask?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [page, maxWidth]);

  return <canvas ref={canvasRef} className="pdf-document-view-canvas" />;
}

export function PdfDocumentView({
  src,
  localPath = null,
  className,
  variant = 'modal',
  emptyLabel = '—',
  loadingLabel = '…',
  errorLabel = '—',
  pageLabel = (page, total) => `${page} / ${total}`,
}: PdfDocumentViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [maxWidth, setMaxWidth] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );

  const hasSource = Boolean(localPath?.trim() || src);

  useEffect(() => {
    if (!hasSource) {
      setDoc(null);
      setPage(null);
      setNumPages(0);
      setPageNumber(1);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    setStatus('loading');
    setDoc(null);
    setPage(null);
    setNumPages(0);
    setPageNumber(1);

    void loadPdfDocument(localPath, src)
      .then(async next => {
        if (cancelled) {
          await next.destroy();
          return;
        }
        loaded = next;
        setDoc(next);
        setNumPages(next.numPages);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setDoc(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      void loaded?.destroy();
    };
  }, [hasSource, localPath, src]);

  useEffect(() => {
    if (!doc || status !== 'ready') {
      setPage(null);
      return;
    }
    const safePage = Math.min(Math.max(pageNumber, 1), doc.numPages || 1);
    let cancelled = false;

    void doc
      .getPage(safePage)
      .then(nextPage => {
        if (cancelled) return;
        setPage(nextPage);
      })
      .catch(() => {
        if (cancelled) return;
        setPage(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, status]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const width = root.clientWidth;
      if (width > 0) setMaxWidth(width);
    };
    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [status, variant]);

  const rootClass = [
    'pdf-document-view',
    `pdf-document-view--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!hasSource || status === 'idle') {
    return (
      <div className={rootClass} aria-hidden>
        <p className="pdf-document-view-status">{emptyLabel}</p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={rootClass} role="status">
        <p className="pdf-document-view-status">{loadingLabel}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={rootClass} role="alert">
        <p className="pdf-document-view-status">{errorLabel}</p>
      </div>
    );
  }

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < numPages;
  const showPager = variant === 'modal' && numPages > 1;

  return (
    <div ref={rootRef} className={rootClass}>
      {showPager ? (
        <div className="pdf-document-view-toolbar">
          <button
            type="button"
            className="pdf-document-view-nav"
            disabled={!canPrev}
            aria-label="Previous page"
            onClick={() => setPageNumber(n => Math.max(1, n - 1))}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <span className="pdf-document-view-page-label">
            {pageLabel(pageNumber, numPages)}
          </span>
          <button
            type="button"
            className="pdf-document-view-nav"
            disabled={!canNext}
            aria-label="Next page"
            onClick={() => setPageNumber(n => Math.min(numPages, n + 1))}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      ) : null}
      <div className="pdf-document-view-stage">
        {page ? (
          <PdfPageCanvas
            page={page}
            maxWidth={Math.max(maxWidth - (variant === 'modal' ? 8 : 0), 120)}
          />
        ) : (
          <p className="pdf-document-view-status" role="status">
            {loadingLabel}
          </p>
        )}
      </div>
      {variant === 'inspector' && numPages > 1 ? (
        <p className="pdf-document-view-meta">{pageLabel(1, numPages)}</p>
      ) : null}
    </div>
  );
}
