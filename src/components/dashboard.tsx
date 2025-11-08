'use client';

import { useSimulation } from '@/hooks/use-simulation';
import { fleetData } from '@/lib/fleet-data';
import { MapView } from '@/components/map-view';
import { SimulationControls } from '@/components/simulation-controls';
import { FleetOverview } from '@/components/fleet-overview';
import { TripDetails } from '@/components/trip-details';
import { AlertSummary } from '@/components/alert-summary';
import { Logo } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
  const {
    vehicleStates,
    fleetMetrics,
    simulationTime,
    isRunning,
    speed,
    play,
    pause,
    setSpeed,
    alerts,
  } = useSimulation(fleetData);

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
            setSpeed={setSpeed}
          />
          <AlertSummary alerts={alerts} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
        <div className="flex flex-col gap-4 md:w-3/4 md:gap-6">
          <Card className="relative flex-1 overflow-hidden">
            <MapView vehicles={Object.values(vehicleStates)} />
          </Card>
          <div className="shrink-0">
            <h2 className="mb-2 text-lg font-semibold">All Trips</h2>
            <ScrollArea>
              <div className="flex space-x-4 pb-4">
                {fleetData.map((trip) => {
                  const state = vehicleStates[trip.id];
                  return state ? <TripDetails key={trip.id} trip={trip} state={state} /> : null;
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
        <aside className="flex w-full flex-col gap-4 md:w-1/4 md:gap-6">
          <FleetOverview metrics={fleetMetrics} simulationTime={simulationTime} />
        </aside>
      </main>
    </div>
  );
}
