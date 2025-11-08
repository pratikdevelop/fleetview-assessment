'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { FleetMetrics } from '@/hooks/use-simulation';
import type { FleetEvent } from '@/lib/types';
import { Users, CheckCircle, Truck, AlertTriangle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

    return Array.from(timeSlots.values()).sort((a,b) => a.time - b.time);
  }, [alerts, simulationTime]);

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

        <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">Alerts Over Time</h3>
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
                    content={<ChartTooltipContent
                        labelFormatter={(label) => format(new Date(label), 'eee, HH:mm')}
                        indicator="dot"
                        hideLabel
                    />}
                />
                <defs>
                    <linearGradient id="fillSpeeding" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fillHardBraking" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fillLowFuel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fillDeviceOffline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0.1}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Speeding" stackId="1" stroke="hsl(var(--chart-1))" fill="url(#fillSpeeding)" />
                <Area type="monotone" dataKey="HardBraking" stackId="1" stroke="hsl(var(--chart-2))" fill="url(#fillHardBraking)" />
                <Area type="monotone" dataKey="LowFuel" stackId="1" stroke="hsl(var(--chart-3))" fill="url(#fillLowFuel)" />
                <Area type="monotone" dataKey="DeviceOffline" stackId="1" stroke="hsl(var(--chart-4))" fill="url(#fillDeviceOffline)" />
                </AreaChart>
            </ChartContainer>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
