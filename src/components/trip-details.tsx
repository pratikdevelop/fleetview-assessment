'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Trip, VehicleState } from '@/lib/types';
import { Gauge, Droplets, Route, MapPin, AlertCircle } from 'lucide-react';

interface TripDetailsProps {
  trip: Trip;
  state: VehicleState;
}

export function TripDetails({ trip, state }: TripDetailsProps) {
  const getStatusVariant = (status: string) => {
    if (status === 'Completed') return 'default';
    if (status === 'Cancelled' || status === 'Device Offline') return 'destructive';
    if (status.includes('Alert')) return 'secondary';
    if (status === 'On Route') return 'secondary';
    if (status === 'Pending') return 'outline';
    return 'outline';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status === 'Cancelled') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (status.includes('Alert')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (status === 'On Route') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getStatusText = (status: string) => {
    if (status.includes('Alert:')) return status.split(':')[1].trim();
    return status;
  };

  const recentAlerts = state.alerts.slice(-2).reverse();

  return (
    <Card className="w-full max-w-sm shrink-0 md:w-80 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{trip.tripName}</CardTitle>
            <CardDescription className="truncate">{trip.driverName}</CardDescription>
            <p className="text-xs text-muted-foreground mt-1">{trip.vehicleModel}</p>
          </div>
          <Badge className={`${getStatusColor(state.status)} whitespace-nowrap`}>
            {getStatusText(state.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="flex items-center text-muted-foreground">
              <Route className="mr-1.5 h-4 w-4" />
              Progress
            </span>
            <span className="font-mono text-xs">{state.progress.toFixed(1)}%</span>
          </div>
          <Progress value={state.progress} className="h-2" />
        </div>

        {/* Route Info */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="text-xs truncate">{trip.startLocationName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="text-xs truncate">{trip.endLocationName}</span>
          </div>
        </div>

        {/* Speed and Fuel */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground text-xs">
              <Gauge className="mr-1 h-3 w-3" />
              Speed
            </div>
            <p className="font-mono text-sm font-semibold">{Math.round(state.speed)} km/h</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground text-xs">
              <Droplets className="mr-1 h-3 w-3" />
              Fuel
            </div>
            <p className="font-mono text-sm font-semibold">{state.fuelLevel.toFixed(1)}%</p>
          </div>
        </div>

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
              <AlertCircle className="h-3 w-3" />
              Recent Alerts
            </div>
            <div className="space-y-1">
              {recentAlerts.map((alert, idx) => (
                <div key={idx} className="text-xs bg-orange-50 dark:bg-orange-950 p-2 rounded border border-orange-200 dark:border-orange-800">
                  <p className="font-medium">{alert.eventType}</p>
                  {alert.data.message && <p className="text-muted-foreground text-xs">{alert.data.message}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
