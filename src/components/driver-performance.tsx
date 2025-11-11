'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VehicleState } from '@/lib/types';
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface DriverPerformanceProps {
  vehicles: VehicleState[];
}

export function DriverPerformance({ vehicles }: DriverPerformanceProps) {
  const performanceMetrics = useMemo(() => {
    return vehicles.map(vehicle => {
      const alertCount = vehicle.alerts.length;
      const avgSpeed = vehicle.speed; // Last recorded speed
      
      let performanceScore = 100;
      
      // Deduct points for speeding events
      const speedingAlerts = vehicle.alerts.filter(a => a.eventType === 'Speeding').length;
      performanceScore -= speedingAlerts * 5;
      
      // Deduct points for hard braking
      const brakingAlerts = vehicle.alerts.filter(a => a.eventType === 'HardBraking').length;
      performanceScore -= brakingAlerts * 2;
      
      // Deduct for device issues
      const deviceAlerts = vehicle.alerts.filter(a => a.eventType === 'DeviceOffline').length;
      performanceScore -= deviceAlerts * 10;
      
      performanceScore = Math.max(0, Math.min(100, performanceScore));
      
      return {
        driverName: vehicle.driverName,
        performanceScore,
        alertCount,
        avgSpeed,
        status: vehicle.status,
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);
  }, [vehicles]);

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (score >= 75) return { label: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    if (score >= 60) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {performanceMetrics.map((metric) => {
            const badge = getScoreBadge(metric.performanceScore);
            return (
              <div key={metric.driverName} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{metric.driverName}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    {metric.alertCount > 0 && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {metric.alertCount} alerts
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {Math.round(metric.avgSpeed)} km/h
                    </span>
                  </div>
                </div>
                <Badge className={`${badge.color} whitespace-nowrap ml-2`}>
                  {metric.performanceScore}%
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
