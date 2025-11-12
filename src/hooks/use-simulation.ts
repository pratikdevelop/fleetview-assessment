'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { add, differenceInSeconds } from 'date-fns';
import type { Trip, FleetEvent, VehicleState, Location } from '@/lib/types';

export interface FleetMetrics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalAlerts: number;
  averageCompletion: number;
  alertsBySeverity: {
    low: number;
    medium: number;
    high: number;
  };
}

const getInitialVehicleStates = (trips: Trip[]): Record<string, VehicleState> => {
  const states: Record<string, VehicleState> = {};
  trips.forEach((trip) => {
    const startEvent = trip.events.find(e => e.eventType === 'TripStart');
    states[trip.id] = {
      id: trip.id,
      tripName: trip.tripName,
      driverName: trip.driverName,
      vehicleModel: trip.vehicleModel,
      location: startEvent?.data.location ?? { latitude: 0, longitude: 0 },
      status: 'Pending',
      speed: 0,
      fuelLevel: 100,
      progress: 0,
      alerts: [],
    };
  });
  return states;
};

export const useSimulation = (trips: Trip[]) => {
  const [simulationTime, setSimulationTime] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [vehicleStates, setVehicleStates] = useState<Record<string, VehicleState>>(() => getInitialVehicleStates(trips));
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics>({
    totalTrips: trips.length,
    activeTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalAlerts: 0,
    averageCompletion: 0,
    alertsBySeverity: { low: 0, medium: 0, high: 0 },
  });
  const [alerts, setAlerts] = useState<FleetEvent[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  
  // Memoize event sorting for performance
  const sortedEvents = useMemo(() => {
    return trips
      .flatMap(trip => trip.events.map(e => ({ ...e, tripId: trip.id } as FleetEvent & { tripId: string })))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [trips]);

  const processEvent = useCallback((event: FleetEvent & { tripId: string }, currentState: VehicleState): VehicleState => {
    const newState = { ...currentState };

    switch (event.eventType) {
      case 'TripStart':
        newState.status = 'On Route';
        newState.progress = 0;
        if (event.data.location) newState.location = event.data.location;
        break;
      case 'LocationUpdate':
        if (event.data.location) newState.location = event.data.location;
        if (event.data.speed !== undefined) newState.speed = Math.round(event.data.speed);
        if (event.data.fuelLevel !== undefined) newState.fuelLevel = Math.round(event.data.fuelLevel * 10) / 10;
        if (event.data.distanceCovered !== undefined && event.data.totalDistance) {
          newState.progress = Math.round((event.data.distanceCovered / event.data.totalDistance) * 1000) / 10;
        }
        break;
      case 'Speeding':
      case 'HardBraking':
      case 'LowFuel':
      case 'DeviceOffline':
        const lastAlert = newState.alerts[newState.alerts.length - 1];
        const isDifferentAlert = !lastAlert || lastAlert.eventType !== event.eventType || 
          differenceInSeconds(new Date(event.timestamp), new Date(lastAlert.timestamp)) > 60;
        
        if (isDifferentAlert) {
          newState.status = `Alert: ${event.eventType}`;
          newState.alerts = [...newState.alerts, event];
          setAlerts(prev => [...prev, event]);
        }
        break;
      case 'Refueling':
        newState.fuelLevel = 100;
        break;
      case 'TripCancelled':
        newState.status = 'Cancelled';
        newState.progress = 100;
        break;
      case 'TripEnd':
        newState.status = 'Completed';
        newState.progress = 100;
        break;
    }
    return newState;
  }, []);

  // Allow external ingestion of single events (for SSE or websocket clients)
  const ingestEvent = useCallback((event: FleetEvent & { tripId?: string }) => {
    if (!event || !event.id) return;
    const tripId = (event as any).tripId;
    if (!tripId) return; // we require tripId to map to a vehicle
    if (processedEventIdsRef.current.has(event.id)) return; // already handled

    setVehicleStates(currentStates => {
      const newStates = { ...currentStates };
      const currentState = newStates[tripId] ?? getInitialVehicleStates(trips)[tripId];
      if (!currentState) return newStates;

      // Cast to include tripId for processEvent
      // @ts-ignore
      newStates[tripId] = processEvent({ ...(event as FleetEvent), tripId }, currentState);
      processedEventIdsRef.current.add(event.id);
      return newStates;
    });
  }, [processEvent, trips]);

  const runSimulation = useCallback(() => {
    if (!lastTickTimeRef.current) {
      lastTickTimeRef.current = Date.now();
    }

    const currentTickTime = Date.now();
    const elapsedRealTime = (currentTickTime - lastTickTimeRef.current) / 1000;
    lastTickTimeRef.current = currentTickTime;

    setSimulationTime(prevTime => {
      if (!prevTime) return prevTime;
      
      const newSimTime = add(prevTime, { seconds: elapsedRealTime * speed });
      const timeWindowStart = prevTime;

      // Use binary search for better performance with large event lists
      const startIdx = sortedEvents.findIndex(e => new Date(e.timestamp) > timeWindowStart);
      const endIdx = sortedEvents.findIndex(e => new Date(e.timestamp) > newSimTime);
      
      const eventsToProcess = sortedEvents.slice(
        startIdx === -1 ? 0 : startIdx,
        endIdx === -1 ? sortedEvents.length : endIdx
      ).filter(event => !processedEventIdsRef.current.has(event.id));

      if (eventsToProcess.length > 0) {
        setVehicleStates(currentStates => {
          const newStates = { ...currentStates };
          eventsToProcess.forEach(event => {
            // @ts-ignore
            newStates[event.tripId] = processEvent(event, newStates[event.tripId]);
            processedEventIdsRef.current.add(event.id);
          });
          return newStates;
        });
      }

      return newSimTime;
    });
  }, [speed, processEvent, sortedEvents]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runSimulation, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastTickTimeRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, runSimulation]);

  // Update metrics
  useEffect(() => {
    const states = Object.values(vehicleStates);
    const activeTrips = states.filter(s => s.status === 'On Route' || s.status.startsWith('Alert')).length;
    const completedTrips = states.filter(s => s.status === 'Completed').length;
    const cancelledTrips = states.filter(s => s.status === 'Cancelled').length;
    const totalAlerts = alerts.length;
    const totalProgress = states.reduce((sum, s) => sum + s.progress, 0);
    const averageCompletion = states.length > 0 ? totalProgress / states.length : 0;
    
    const alertsBySeverity = alerts.reduce(
      (acc, alert) => {
        const severity = alert.data.severity as 'low' | 'medium' | 'high' | undefined;
        if (severity && severity in acc) {
          acc[severity]++;
        }
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    );

    setFleetMetrics({
      totalTrips: trips.length,
      activeTrips,
      completedTrips,
      cancelledTrips,
      totalAlerts,
      averageCompletion,
      alertsBySeverity,
    });
  }, [vehicleStates, alerts.length, trips.length]);

  const play = () => {
    if (!simulationTime && sortedEvents.length > 0) {
      setSimulationTime(new Date(sortedEvents[0].timestamp));
    }
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setSimulationTime(null);
    setVehicleStates(getInitialVehicleStates(trips));
    setAlerts([]);
    processedEventIdsRef.current.clear();
    lastTickTimeRef.current = null;
  };

  const setSimulationSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  return {
    vehicleStates,
    fleetMetrics,
    simulationTime,
    isRunning,
    speed,
    play,
    pause,
    reset,
    setSpeed: setSimulationSpeed,
    alerts,
    ingestEvent,
  };
};
