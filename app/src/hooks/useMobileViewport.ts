import { useEffect, useState } from 'react';

/** 与 Sidebar.css / REF-601 断点一致 */
export const MOBILE_BREAKPOINT_PX = 768;
export const WIDE_BREAKPOINT_PX = 1024;

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useMobileViewport(): boolean {
  return useMatchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
}

export function useWideViewport(): boolean {
  return useMatchMedia(`(min-width: ${WIDE_BREAKPOINT_PX}px)`);
}
