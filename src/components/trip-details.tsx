'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Trip, VehicleState } from '@/lib/types';
import { Gauge, Droplets, Route } from 'lucide-react';

interface TripDetailsProps {
  trip: Trip;
  state: VehicleState;
}

export function TripDetails({ trip, state }: TripDetailsProps) {
  const getStatusVariant = (status: string) => {
    if (status === 'Completed') return 'default';
    if (status === 'Cancelled' || status === 'Device Offline') return 'destructive';
    if (status.includes('Alert')) return 'destructive';
    if (status === 'On Route') return 'secondary';
    return 'outline';
  };
  
  const getStatusText = (status: string) => {
    if (status.includes('Alert:')) return status.split(':')[1].trim();
    return status;
  }

  return (
    <Card className="w-full max-w-sm shrink-0 md:w-80">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle className="text-base">{trip.tripName}</CardTitle>
                <CardDescription>{trip.driverName} - {trip.vehicleModel}</CardDescription>
            </div>
            <Badge variant={getStatusVariant(state.status)}>{getStatusText(state.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="flex items-center text-muted-foreground"><Route className="mr-1.5 h-4 w-4"/>Progress</span>
            <span>{state.progress.toFixed(1)}%</span>
          </div>
          <Progress value={state.progress} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="flex items-center text-muted-foreground"><Gauge className="mr-1.5 h-4 w-4" />Speed</span>
          <span className="font-mono">{state.speed} km/h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="flex items-center text-muted-foreground"><Droplets className="mr-1.5 h-4 w-4" />Fuel</span>
          <span className="font-mono">{state.fuelLevel.toFixed(0)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
