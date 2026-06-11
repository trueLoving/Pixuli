import { useEffect, useState } from 'react';

/** 与 Sidebar.css 断点一致 */
export const MOBILE_BREAKPOINT_PX = 768;

export function useMobileViewport(): boolean {
  const query = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}
