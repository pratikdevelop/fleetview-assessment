'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { FleetMetrics } from '@/hooks/use-simulation';
import type { FleetEvent } from '@/lib/types';
import { Users, CheckCircle, Truck, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Bar, BarChart, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns';

interface FleetOverviewProps {
  metrics: FleetMetrics;
  simulationTime: Date | null;
  alerts: FleetEvent[];
}

const chartConfig = {
  Speeding: { label: 'Speeding', color: 'hsl(var(--chart-1))' },
  HardBraking: { label: 'Hard Braking', color: 'hsl(var(--chart-2))' },
  LowFuel: { label: 'Low Fuel', color: 'hsl(var(--chart-3))' },
  DeviceOffline: { label: 'Offline', color: 'hsl(var(--chart-4))' },
};

export function FleetOverview({ metrics, simulationTime, alerts }: FleetOverviewProps) {
  const alertChartData = useMemo(() => {
    if (!simulationTime || alerts.length === 0) return [];

    const interval = 60 * 5; // 5 minutes in seconds
    const startTime = parseISO(alerts[0].timestamp).getTime();
    const endTime = simulationTime.getTime();

    const timeSlots = new Map<number, { time: number; Speeding: number; HardBraking: number; LowFuel: number; DeviceOffline: number }>();

    alerts.forEach(alert => {
      const alertTime = parseISO(alert.timestamp).getTime();
      const slot = Math.floor((alertTime - startTime) / (interval * 1000)) * (interval * 1000) + startTime;

      if (!timeSlots.has(slot)) {
        timeSlots.set(slot, { time: slot, Speeding: 0, HardBraking: 0, LowFuel: 0, DeviceOffline: 0 });
      }

      const timeSlot = timeSlots.get(slot)!;
      if (alert.eventType in timeSlot) {
        // @ts-ignore
        timeSlot[alert.eventType]++;
      }
    });

    return Array.from(timeSlots.values()).sort((a, b) => a.time - b.time);
  }, [alerts, simulationTime]);

  const severityChartData = useMemo(() => {
    return [
      { name: 'Low', value: metrics.alertsBySeverity.low },
      { name: 'Medium', value: metrics.alertsBySeverity.medium },
      { name: 'High', value: metrics.alertsBySeverity.high },
    ];
  }, [metrics.alertsBySeverity]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            {simulationTime ? format(simulationTime, 'MMM dd, yyyy HH:mm:ss') : 'Simulation not started'}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center rounded-lg border p-3">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-xs text-muted-foreground">Total Trips</span>
                <span className="font-semibold">{metrics.totalTrips}</span>
              </div>
            </div>
            <div className="flex items-center rounded-lg border p-3">
              <Truck className="mr-2 h-4 w-4 text-blue-500" />
              <div className="flex flex-1 flex-col">
                <span className="text-xs text-muted-foreground">Active</span>
                <span className="font-semibold">{metrics.activeTrips}</span>
              </div>
            </div>
            <div className="flex items-center rounded-lg border p-3">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <div className="flex flex-1 flex-col">
                <span className="text-xs text-muted-foreground">Completed</span>
                <span className="font-semibold">{metrics.completedTrips}</span>
              </div>
            </div>
            <div className="flex items-center rounded-lg border p-3">
              <XCircle className="mr-2 h-4 w-4 text-orange-500" />
              <div className="flex flex-1 flex-col">
                <span className="text-xs text-muted-foreground">Cancelled</span>
                <span className="font-semibold">{metrics.cancelledTrips}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Average Trip Completion</p>
            <Progress value={metrics.averageCompletion} />
            <p className="mt-1 text-right text-sm text-muted-foreground">
              {Math.round(metrics.averageCompletion)}%
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">Total Alerts: {metrics.totalAlerts}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {severityChartData.some(d => d.value > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerts by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full">
              <ChartContainer config={chartConfig as any} className="h-full w-full">
                <BarChart data={severityChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {alertChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerts Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ChartContainer config={chartConfig as any} className="h-full w-full">
                <AreaChart
                  data={alertChartData}
                  margin={{
                    top: 5,
                    right: 20,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(tick) => format(new Date(tick), 'HH:mm')}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => format(new Date(label), 'eee, HH:mm')}
                        indicator="dot"
                        hideLabel
                      />
                    }
                  />
                  <defs>
                    <linearGradient id="fillSpeeding" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillHardBraking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillLowFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillDeviceOffline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="Speeding"
                    stackId="1"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#fillSpeeding)"
                  />
                  <Area
                    type="monotone"
                    dataKey="HardBraking"
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fill="url(#fillHardBraking)"
                  />
                  <Area
                    type="monotone"
                    dataKey="LowFuel"
                    stackId="1"
                    stroke="hsl(var(--chart-3))"
                    fill="url(#fillLowFuel)"
                  />
                  <Area
                    type="monotone"
                    dataKey="DeviceOffline"
                    stackId="1"
                    stroke="hsl(var(--chart-4))"
                    fill="url(#fillDeviceOffline)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
