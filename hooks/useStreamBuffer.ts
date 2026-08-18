import { useRef, useCallback, useEffect } from 'react';

export function useStreamBuffer(
  onFlush: (bufferedChunk: string) => void,
  frameIntervalMs = 16.6
) {
  const bufferRef = useRef<string>('');
  const frameIdRef = useRef<number | null>(null);
  const lastFlushTimeRef = useRef<number>(0);

  const flush = useCallback((timestamp: number) => {
    if (timestamp - lastFlushTimeRef.current >= frameIntervalMs) {
      if (bufferRef.current.length > 0) {
        onFlush(bufferRef.current);
        bufferRef.current = '';
      }
      lastFlushTimeRef.current = timestamp;
    }

    if (bufferRef.current.length > 0) {
      frameIdRef.current = requestAnimationFrame(flush);
    } else {
      frameIdRef.current = null;
    }
  }, [onFlush, frameIntervalMs]);

  const pushChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk;
    if (frameIdRef.current === null) {
      frameIdRef.current = requestAnimationFrame(flush);
    }
  }, [flush]);

  const clearBuffer = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    if (bufferRef.current.length > 0) {
      onFlush(bufferRef.current);
      bufferRef.current = '';
    }
  }, [onFlush]);

  useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []);

  return { pushChunk, clearBuffer };
}
