// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSimulation } from '@/hooks/use-simulation';
import type { Trip } from '@/lib/types';
import { MapView } from '@/components/map-view';
import { SimulationControls } from '@/components/simulation-controls';
import { FleetOverview } from '@/components/fleet-overview';
import { DriverPerformance } from '@/components/driver-performance';
import { TripDetails } from '@/components/trip-details';
import { AlertSummary } from '@/components/alert-summary';
import { Logo } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useFleetStream } from '@/hooks/use-fleet-stream';
import { useAbly } from '@/hooks/use-ably';
import { useFleetWs } from '@/hooks/use-fleet-ws';

function DashboardContent({ trips }: { trips: Trip[] }) {
  const {
    vehicleStates,
    fleetMetrics,
    simulationTime,
    isRunning,
    speed,
    play,
    pause,
    reset,
    setSpeed,
    alerts,
    ingestEvent,
  } = useSimulation(trips);

  const [provider, setProvider] = useState<'sse' | 'ably' | 'ws'>('ably');

  // Wire up real-time clients
  useFleetStream(ingestEvent, { speed, enabled: provider === 'sse' });
  useAbly(ingestEvent, { channel: 'fleet-events', enabled: provider === 'ably' });
  useFleetWs(ingestEvent, { enabled: provider === 'ws' });

  // Seed dummy alerts for demo
  const seededAlertsRef = useRef(false);
  useEffect(() => {
    if (seededAlertsRef.current) return;
    if (!trips || trips.length === 0) return;
    if (alerts && alerts.length > 0) return;

    const now = new Date().toISOString();
    const samples = [];

    for (let i = 0; i < Math.min(3, trips.length); i++) {
      const trip = trips[i];
      const firstLoc = trip.events?.[0]?.data?.location || { latitude: 0, longitude: 0 };

      const evt = {
        id: `dummy-${trip.id}-alert-${i}`,
        timestamp: now,
        eventType: i === 0 ? 'Speeding' : i === 1 ? 'LowFuel' : 'HardBraking',
        data: i === 0 
          ? { location: firstLoc, speed: 115, severity: 'high', message: 'Sample speeding event' }
          : i === 1 
          ? { location: firstLoc, fuelLevel: 8, severity: 'medium', message: 'Sample low fuel' }
          : { location: firstLoc, severity: 'low', message: 'Sample hard braking' },
        tripId: trip.id,
      };

      samples.push(evt);
    }

    samples.forEach(s => ingestEvent(s as any));
    seededAlertsRef.current = true;
  }, [trips, alerts, ingestEvent]);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8" />
          <h1 className="text-lg font-semibold tracking-tight">FleetView</h1>
        </div>
        <div className="flex items-center gap-4">
          <SimulationControls
            isRunning={isRunning}
            speed={speed}
            play={play}
            pause={pause}
            reset={reset}
            setSpeed={setSpeed}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                className={`px-2 py-1 rounded text-sm ${
                  provider === 'sse' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground border'
                }`}
                onClick={() => setProvider('sse')}
                type="button"
              >
                SSE
              </button>
              <button
                className={`px-2 py-1 rounded text-sm ${
                  provider === 'ably' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground border'
                }`}
                onClick={() => setProvider('ably')}
                type="button"
              >
                Ably
              </button>
              <button
                className={`px-2 py-1 rounded text-sm ${
                  provider === 'ws' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground border'
                }`}
                onClick={() => setProvider('ws')}
                type="button"
              >
                WS
              </button>
            </div>
            <AlertSummary alerts={alerts} />
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6 overflow-hidden">
        {/* Main Content - Map & Active Trips */}
        <div className="flex flex-col gap-4 md:w-3/4 md:gap-6 overflow-hidden">
          <Card className="relative flex-1 overflow-hidden">
            <MapView vehicles={Object.values(vehicleStates)} />
          </Card>
          <div className="shrink-0">
            <h2 className="mb-3 text-lg font-semibold">Active Trips</h2>
            <ScrollArea className="w-full">
              <div className="flex space-x-4 pb-4 pr-4">
                {trips.map((trip) => {
                  const state = vehicleStates[trip.id];
                  return state ? <TripDetails key={trip.id} trip={trip} state={state} /> : null;
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Sidebar - Metrics & Performance */}
        <aside className="flex w-full flex-col gap-4 md:w-1/4 md:gap-6 overflow-y-auto">
          <FleetOverview 
            metrics={fleetMetrics} 
            simulationTime={simulationTime} 
            alerts={alerts} 
          />
          <DriverPerformance vehicles={Object.values(vehicleStates)} />
        </aside>
      </main>
    </div>
  );
}

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFleetData() {
      try {
        setLoading(true);
        const response = await fetch('/api/fleet-data');
        
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
          setError(null);
        } else {
          throw new Error(`Failed to load: ${response.status}`);
        }
      } catch (err) {
        console.error('Error loading fleet data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadFleetData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading fleet data...</p>
        </div>
      </div>
    );
  }

  if (error || !trips || trips.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Card className="max-w-md p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold">No Fleet Data Available</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {error || 'Unable to load fleet data. Please try again later.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <DashboardContent trips={trips} />;
}