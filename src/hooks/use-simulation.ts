'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { add, differenceInSeconds } from 'date-fns';
import type { Trip, FleetEvent, VehicleState, Location } from '@/lib/types';

export interface FleetMetrics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalAlerts: number;
  averageCompletion: number;
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
    totalAlerts: 0,
    averageCompletion: 0,
  });
  const [alerts, setAlerts] = useState<FleetEvent[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const allEventsRef = useRef<FleetEvent[]>(trips.flatMap(trip => trip.events.map(e => ({...e, tripId: trip.id}))).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));

  const processEvent = useCallback((event: FleetEvent & { tripId: string }, currentState: VehicleState): VehicleState => {
    const newState = { ...currentState };
    newState.status = 'On Route';

    switch (event.eventType) {
      case 'TripStart':
        newState.status = 'On Route';
        newState.progress = 0;
        if(event.data.location) newState.location = event.data.location;
        break;
      case 'LocationUpdate':
        if (event.data.location) newState.location = event.data.location;
        if (event.data.speed !== undefined) newState.speed = event.data.speed;
        if (event.data.fuelLevel !== undefined) newState.fuelLevel = event.data.fuelLevel;
        if (event.data.distanceCovered !== undefined && event.data.totalDistance) {
          newState.progress = (event.data.distanceCovered / event.data.totalDistance) * 100;
        }
        break;
      case 'Speeding':
      case 'HardBraking':
      case 'LowFuel':
      case 'DeviceOffline':
        newState.status = `Alert: ${event.eventType}`;
        newState.alerts = [...newState.alerts, event];
        setAlerts(prev => [...prev, event]);
        break;
      case 'Refueling':
        newState.fuelLevel = 100;
        break;
      case 'TripCancelled':
        newState.status = 'Cancelled';
        newState.progress = 100; // Consider it 'finished' for progress calculations
        break;
      case 'TripEnd':
        newState.status = 'Completed';
        newState.progress = 100;
        break;
    }
    return newState;
  }, []);

  const runSimulation = useCallback(() => {
    if (!lastTickTimeRef.current) {
        lastTickTimeRef.current = Date.now();
    }

    const currentTickTime = Date.now();
    const elapsedRealTime = (currentTickTime - lastTickTimeRef.current) / 1000;
    lastTickTimeRef.current = currentTickTime;
    
    setSimulationTime(prevTime => {
      const newSimTime = add(prevTime!, { seconds: elapsedRealTime * speed });
      const timeWindowStart = prevTime!;
      
      const eventsToProcess = allEventsRef.current.filter(event => {
        const eventTime = new Date(event.timestamp);
        return eventTime > timeWindowStart && eventTime <= newSimTime && !processedEventIdsRef.current.has(event.id);
      });
      
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

  }, [speed, processEvent]);

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

  useEffect(() => {
    const states = Object.values(vehicleStates);
    const activeTrips = states.filter(s => s.status === 'On Route' || s.status.startsWith('Alert')).length;
    const completedTrips = states.filter(s => s.status === 'Completed' || s.status === 'Cancelled').length;
    const totalAlerts = alerts.length;
    const totalProgress = states.reduce((sum, s) => sum + s.progress, 0);
    const averageCompletion = states.length > 0 ? totalProgress / states.length : 0;
    
    setFleetMetrics({
      totalTrips: trips.length,
      activeTrips,
      completedTrips,
      totalAlerts,
      averageCompletion,
    });
  }, [vehicleStates, alerts.length, trips.length]);

  const play = () => {
    if (!simulationTime && allEventsRef.current.length > 0) {
      setSimulationTime(new Date(allEventsRef.current[0].timestamp));
    }
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };
  
  const setSimulationSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  return { vehicleStates, fleetMetrics, simulationTime, isRunning, speed, play, pause, setSpeed: setSimulationSpeed, alerts };
};
