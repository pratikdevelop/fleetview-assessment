'use client';

import { useEffect, useRef } from 'react';
import type { FleetEvent } from '@/lib/types';

export interface UseFleetWsOptions {
  speed?: number;
  token?: string;
  onError?: (err: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onControl?: (msg: { action: 'pause' | 'resume'; speed?: number }) => void;
  enabled?: boolean;
}

/**
 * WebSocket client hook for fleet streaming.
 * Skeleton implementation - mirrors use-fleet-stream but for WS.
 * Note: Full WS support requires backend socket upgrade and ws library.
 */
export function useFleetWs(
  ingestEvent: (event: FleetEvent & { tripId?: string }) => void,
  options: UseFleetWsOptions = {}
) {
  const { speed, token, onError, onOpen, onClose, onControl, enabled = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let url = `${protocol}//${window.location.host}/api/ws`;
    const params: Record<string, string> = {};
    if (speed) params.speed = String(speed);
    if (token) params.token = token;
    const qs = Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    if (qs) url += `?${qs}`;

    function connect() {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptsRef.current = 0;
          if (onOpen) onOpen();
        };

        ws.onerror = (evt) => {
          if (onError) onError(new Error('WebSocket error'));
          ws.close();
          wsRef.current = null;
          // Reconnect with exponential backoff
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === 'fleetEvent' && msg.data && msg.data.id && msg.data.tripId) {
              ingestEvent(msg.data);
            } else if (msg.type === 'control' && onControl) {
              onControl(msg.data);
            }
          } catch (e) {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          if (onClose) onClose();
        };
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error('WebSocket init error'));
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    }

    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, token]);

  // Return control sender for pause/resume
  const sendControl = (action: 'pause' | 'resume', speedOverride?: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'control', action, speed: speedOverride }));
    }
  };

  return { sendControl };
}
