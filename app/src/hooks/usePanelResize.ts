import { useCallback, useEffect, useRef } from 'react';
import {
  clampPanelWidth,
  EXPLORER_WIDTH_DEFAULT,
  EXPLORER_WIDTH_MAX,
  EXPLORER_WIDTH_MIN,
  INSPECTOR_WIDTH_DEFAULT,
  INSPECTOR_WIDTH_MAX,
  INSPECTOR_WIDTH_MIN,
} from '@/constants/panelWidth';

export {
  clampPanelWidth,
  EXPLORER_WIDTH_DEFAULT,
  EXPLORER_WIDTH_MAX,
  EXPLORER_WIDTH_MIN,
  INSPECTOR_WIDTH_DEFAULT,
  INSPECTOR_WIDTH_MAX,
  INSPECTOR_WIDTH_MIN,
};

interface UsePanelResizeOptions {
  width: number;
  min: number;
  max: number;
  /** 拖动右缘向右增大；拖动左缘向左增大 */
  edge: 'left' | 'right';
  onWidthChange: (width: number) => void;
}

/**
 * 水平面板拖拽改宽：在 pointerdown 后挂到 window，避免手柄过窄丢事件。
 */
export function usePanelResize({
  width,
  min,
  max,
  edge,
  onWidthChange,
}: UsePanelResizeOptions) {
  const widthRef = useRef(width);
  const edgeRef = useRef(edge);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const onWidthChangeRef = useRef(onWidthChange);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);
  useEffect(() => {
    edgeRef.current = edge;
  }, [edge]);
  useEffect(() => {
    minRef.current = min;
    maxRef.current = max;
  }, [min, max]);
  useEffect(() => {
    onWidthChangeRef.current = onWidthChange;
  }, [onWidthChange]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = widthRef.current;
      const pointerId = event.pointerId;

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        const delta = ev.clientX - startX;
        const next =
          edgeRef.current === 'right' ? startWidth + delta : startWidth - delta;
        onWidthChangeRef.current(
          clampPanelWidth(next, minRef.current, maxRef.current),
        );
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [],
  );

  return { onPointerDown };
}
