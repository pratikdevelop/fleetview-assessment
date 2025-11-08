'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { FleetMetrics } from '@/hooks/use-simulation';
import { Users, CheckCircle, Truck, AlertTriangle } from 'lucide-react';

interface FleetOverviewProps {
  metrics: FleetMetrics;
  simulationTime: Date | null;
}

export function FleetOverview({ metrics, simulationTime }: FleetOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          {simulationTime ? simulationTime.toLocaleString() : 'Simulation not started'}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center">
          <Users className="mr-3 h-5 w-5 text-muted-foreground" />
          <span>Total Trips</span>
          <span className="ml-auto font-semibold">{metrics.totalTrips}</span>
        </div>
        <div className="flex items-center">
          <Truck className="mr-3 h-5 w-5 text-primary" />
          <span>Active Trips</span>
          <span className="ml-auto font-semibold">{metrics.activeTrips}</span>
        </div>
        <div className="flex items-center">
          <CheckCircle className="mr-3 h-5 w-5 text-success" />
          <span>Completed Trips</span>
          <span className="ml-auto font-semibold">{metrics.completedTrips}</span>
        </div>
        <div className="flex items-center">
          <AlertTriangle className="mr-3 h-5 w-5 text-destructive" />
          <span>Total Alerts</span>
          <span className="ml-auto font-semibold">{metrics.totalAlerts}</span>
        </div>
        <div>
          <p className="mb-2 text-sm">Average Trip Completion</p>
          <Progress value={metrics.averageCompletion} />
          <p className="mt-1 text-right text-sm text-muted-foreground">
            {Math.round(metrics.averageCompletion)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
