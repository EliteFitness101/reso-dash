import { useCallback, useEffect, useRef } from 'react';
import { useStreamBuffer } from './useStreamBuffer';

export interface StreamOptions {
  url: string;
  token: string;
  body?: unknown;
  onChunk: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Client-side ChatB2K™ stream transport.
 *
 * Network transport remains separate from business logic. Incoming bytes are
 * decoded losslessly and handed to useStreamBuffer so React receives at most
 * one UI update per animation frame instead of one update per network chunk.
 * The server remains authoritative for authentication, orchestration,
 * persistence, XP and commerce/payment state.
 */
export function useChatStream() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const onChunkRef = useRef<StreamOptions['onChunk']>(() => undefined);

  const { push, flushNow, clear } = useStreamBuffer({
    onFlush: (chunk) => onChunkRef.current(chunk),
  });

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    onChunkRef.current = () => undefined;
    clear();
  }, [clear]);

  const startStream = useCallback(async ({
    url,
    token,
    body,
    onChunk,
    onComplete,
    onError,
  }: StreamOptions) => {
    stopStream();
    onChunkRef.current = onChunk;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream, text/plain, application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = `Chat stream request failed (${response.status})`;
        try {
          const detail = await response.text();
          if (detail.trim()) message = `${message}: ${detail.slice(0, 300)}`;
        } catch {
          // Preserve the HTTP status error when the response body is unreadable.
        }
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('Chat stream response body is unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          if (chunk) push(chunk);
        }

        const finalChunk = decoder.decode();
        if (finalChunk) push(finalChunk);
        flushNow();
      } finally {
        reader.releaseLock();
      }

      if (!controller.signal.aborted) {
        onComplete?.();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof Error) {
        onError?.(error);
      } else {
        onError?.(new Error('Unknown chat stream error'));
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        onChunkRef.current = () => undefined;
      }
    }
  }, [flushNow, push, stopStream]);

  useEffect(() => stopStream, [stopStream]);

  return { startStream, stopStream };
}
