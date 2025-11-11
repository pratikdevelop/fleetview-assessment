'use client';

import { useEffect, useState } from 'react';
import { useSimulation } from '@/hooks/use-simulation';
import { fleetData } from '@/lib/fleet-data';
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
  } = useSimulation(trips);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Logo />
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
          <AlertSummary alerts={alerts} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6 overflow-hidden">
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
        <aside className="flex w-full flex-col gap-4 md:w-1/4 md:gap-6 overflow-y-auto">
          <FleetOverview metrics={fleetMetrics} simulationTime={simulationTime} alerts={alerts} />
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
        
        // Try to load from API first (assessment data)
        const response = await fetch('/api/fleet-data', { 
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.trips && Array.isArray(data.trips) && data.trips.length > 0) {
            console.log(`[Dashboard] Loaded ${data.trips.length} trips from assessment data`);
            setTrips(data.trips);
            setError(null);
          } else {
            // Fallback to generated data
            console.log('[Dashboard] No assessment data available, using generated data');
            setTrips(fleetData);
            setError(null);
          }
        } else {
          // Fallback to generated data
          console.log('[Dashboard] API failed, using generated data');
          setTrips(fleetData);
          setError(null);
        }
      } catch (err) {
        console.error('[Dashboard] Error loading fleet data:', err);
        // Always fallback to generated data on error
        setTrips(fleetData);
        setError(null);
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

  if (!trips || trips.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Card className="max-w-md p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold">No Fleet Data Available</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Unable to load fleet data. Please ensure assessment data files are available.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <DashboardContent trips={trips} />;
}
