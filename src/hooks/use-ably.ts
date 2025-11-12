'use client';

import { useEffect, useRef } from 'react';
import type { FleetEvent } from '@/lib/types';

export interface UseAblyOptions {
  channel?: string;
  onError?: (err: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

/**
 * Client hook that connects to Ably Realtime using a tokenRequest obtained from the server.
 * It subscribes to a channel and forwards messages to ingestEvent.
 */
export function useAbly(
  ingestEvent: (event: FleetEvent & { tripId?: string }) => void,
  options: UseAblyOptions = {}
) {
  const { channel = 'fleet-events', onError, onOpen, onClose, enabled = true } = options;
  const ablyRef = useRef<any | null>(null);
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    async function connect() {
      try {
        const res = await fetch('/api/ably-token', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to obtain Ably token request');
        const tokenRequest = await res.json();

        // Load ably at runtime
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Ably = require('ably');
        const re = new Ably.Realtime({ token: tokenRequest });
        ablyRef.current = re;
        // Debug logs to help confirm connection during development
        try {
          // eslint-disable-next-line no-console
          console.info('[useAbly] tokenRequest received', tokenRequest);
        } catch (e) {}

        re.connection.on('connected', () => {
          if (!mounted) return;
          // eslint-disable-next-line no-console
          console.info('[useAbly] connected to Ably');
          if (onOpen) onOpen();
        });
        re.connection.on('failed', (state: any) => {
          if (onError) onError(new Error('Ably connection failed'));
        });

        const ch = re.channels.get(channel);
        channelRef.current = ch;
        ch.subscribe('fleetEvent', (msg: any) => {
          try {
            const data = msg.data;
            // eslint-disable-next-line no-console
            console.debug('[useAbly] received message', msg);
            if (data && data.id && data.tripId) {
              ingestEvent(data);
            }
          } catch (e) {
            // ignore
          }
        });
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    }

    connect();

    return () => {
      mounted = false;
      try {
        if (channelRef.current) channelRef.current.unsubscribe();
        if (ablyRef.current) ablyRef.current.close();
      } catch (e) {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);
}
