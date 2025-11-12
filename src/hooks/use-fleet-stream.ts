import { useEffect, useRef } from 'react';
import type { FleetEvent } from '@/lib/types';

export interface UseFleetStreamOptions {
  speed?: number;
  token?: string;
  onError?: (err: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

/**
 * Hook to connect to the fleet SSE stream and forward events to a callback.
 * Handles reconnect with exponential backoff.
 */
export function useFleetStream(
  ingestEvent: (event: FleetEvent & { tripId?: string }) => void,
  options: UseFleetStreamOptions = {}
) {
  const { speed, token, onError, onOpen, onClose, enabled = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let url = '/api/fleet-stream';
    const params: Record<string, string> = {};
    if (speed) params.speed = String(speed);
    if (token) params.token = token;
    const qs = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    if (qs) url += `?${qs}`;

    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        reconnectAttemptsRef.current = 0;
        if (onOpen) onOpen();
      };
      es.onerror = (err) => {
        if (onError) onError(new Error('SSE connection error'));
        es.close();
        eventSourceRef.current = null;
        // Reconnect with exponential backoff
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
      es.onmessage = (msg) => {
        // Only handle 'fleetEvent' events
        if (msg.data) {
          try {
            const parsed = JSON.parse(msg.data);
            if (parsed && parsed.id && parsed.tripId) {
              ingestEvent(parsed);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      };
      es.addEventListener('fleetEvent', (evt: MessageEvent) => {
        if (evt.data) {
          try {
            const parsed = JSON.parse(evt.data);
            if (parsed && parsed.id && parsed.tripId) {
              ingestEvent(parsed);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      });
    }

    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, token]);
}
