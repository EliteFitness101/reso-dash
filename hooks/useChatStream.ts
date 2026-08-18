import { useEffect, useRef, useCallback } from 'react';
import { useStreamBuffer } from './useStreamBuffer';

interface StreamOptions {
  url: string;
  token: string;
  onChunk: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
}

export function useChatStream() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleBufferedChunk = useCallback((chunk: string) => {
    currentOnChunkRef.current?.(chunk);
  }, []);

  const { pushChunk, clearBuffer } = useStreamBuffer(handleBufferedChunk);
  const currentOnChunkRef = useRef<StreamOptions['onChunk'] | null>(null);
  const currentOnCompleteRef = useRef<StreamOptions['onComplete'] | null>(null);
  const currentOnErrorRef = useRef<StreamOptions['onError'] | null>(null);

  const startStream = useCallback(async ({ url, token, onChunk, onComplete, onError }: StreamOptions) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    currentOnChunkRef.current = onChunk;
    currentOnCompleteRef.current = onComplete;
    currentOnErrorRef.current = onError;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        pushChunk(chunkText);
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        pushChunk(finalChunk);
      }

      clearBuffer();
      currentOnCompleteRef.current?.();
    } catch (err: any) {
      clearBuffer();
      if (err.name !== 'AbortError') {
        currentOnErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      currentOnChunkRef.current = null;
      currentOnCompleteRef.current = null;
      currentOnErrorRef.current = null;
    }
  }, [clearBuffer, pushChunk]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearBuffer();
    currentOnChunkRef.current = null;
    currentOnCompleteRef.current = null;
    currentOnErrorRef.current = null;
  }, [clearBuffer]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return { startStream, stopStream };
}
