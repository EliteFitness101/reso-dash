import { useCallback, useEffect, useRef } from 'react';

export interface StreamBufferOptions {
  onFlush: (chunk: string) => void;
}

/**
 * Frame-buffered UI delivery for streaming responses.
 *
 * Network chunks can arrive faster than React should render them. This hook
 * accumulates every received chunk and flushes the complete pending buffer at
 * most once per animation frame. Chunks are concatenated losslessly; the hook
 * never drops data when several network reads arrive inside one frame.
 */
export function useStreamBuffer({ onFlush }: StreamBufferOptions) {
  const bufferRef = useRef('');
  const frameRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    frameRef.current = null;

    const buffered = bufferRef.current;
    if (!buffered) return;

    bufferRef.current = '';
    onFlush(buffered);
  }, [onFlush]);

  const scheduleFlush = useCallback(() => {
    if (frameRef.current !== null) return;

    if (typeof window === 'undefined') {
      flush();
      return;
    }

    frameRef.current = window.requestAnimationFrame(flush);
  }, [flush]);

  const push = useCallback(
    (chunk: string) => {
      if (!chunk) return;
      bufferRef.current += chunk;
      scheduleFlush();
    },
    [scheduleFlush]
  );

  const flushNow = useCallback(() => {
    if (frameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    flush();
  }, [flush]);

  const clear = useCallback(() => {
    if (frameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    bufferRef.current = '';
  }, []);

  useEffect(() => clear, [clear]);

  return { push, flushNow, clear };
}
