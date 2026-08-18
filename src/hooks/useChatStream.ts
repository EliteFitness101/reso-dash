import { useCallback, useEffect, useRef } from 'react';

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
 * Responsibilities are deliberately limited to transport concerns:
 * - cancels an active request before starting a new one
 * - streams response bytes through TextDecoder
 * - flushes the decoder at EOF
 * - suppresses expected AbortError callbacks
 * - cleans the controller on completion/unmount
 *
 * The server remains authoritative for authentication, orchestration,
 * persistence, XP and any commerce/payment state.
 */
export function useChatStream() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const startStream = useCallback(async ({
    url,
    token,
    body,
    onChunk,
    onComplete,
    onError,
  }: StreamOptions) => {
    stopStream();

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
          if (chunk) onChunk(chunk);
        }

        const finalChunk = decoder.decode();
        if (finalChunk) onChunk(finalChunk);
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
      }
    }
  }, [stopStream]);

  useEffect(() => stopStream, [stopStream]);

  return { startStream, stopStream };
}
