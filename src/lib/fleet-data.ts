import { add, formatISO } from 'date-fns';
import type { Trip, FleetEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate a unique ID, since we can't add uuid package
const generateId = () => Math.random().toString(36).substring(2, 15);


// Base time for simulation
const simStartTime = new Date();

type TripParams = {
  id: string;
  tripName: string;
  driverName: string;
  vehicleModel: string;
  startLocationName: string;
  endLocationName: string;
  events: FleetEvent[];
};

const tripsData: TripParams[] = [
  {
    id: 'trip-1',
    tripName: 'Cross-Country Long Haul',
    driverName: 'John Doe',
    vehicleModel: 'Freightliner Cascadia',
    startLocationName: 'Los Angeles, CA',
    endLocationName: 'New York, NY',
    events: ((): FleetEvent[] => {
      let events: FleetEvent[] = [];
      let currentTime = simStartTime;
      let fuel = 100;
      const totalDistance = 4500;
      let distance = 0;

      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripStart', data: { location: { latitude: 34.0522, longitude: -118.2437 } } });

      for (let i = 0; i < 100; i++) {
        currentTime = add(currentTime, { minutes: 30 });
        distance += 45;
        fuel -= 2;
        events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'LocationUpdate', data: { location: { latitude: 34.0522 + (i * 0.05), longitude: -118.2437 + (i * 0.5) }, speed: 90, fuelLevel: fuel, distanceCovered: distance, totalDistance } });

        if (i === 50) {
          events.push({ id: generateId(), timestamp: formatISO(add(currentTime, { seconds: 10})), eventType: 'Speeding', data: { speed: 110, severity: 'medium' } });
        }
      }
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripEnd', data: { location: { latitude: 40.7128, longitude: -74.0060 } } });

      return events;
    })(),
  },
  {
    id: 'trip-2',
    tripName: 'Urban Dense Delivery',
    driverName: 'Jane Smith',
    vehicleModel: 'Ford Transit',
    startLocationName: 'Downtown, SF',
    endLocationName: 'Suburbs, SF',
    events: ((): FleetEvent[] => {
      let events: FleetEvent[] = [];
      let currentTime = add(simStartTime, {minutes: 5});
      const totalDistance = 50;
      
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripStart', data: { location: { latitude: 37.7749, longitude: -122.4194 } } });
      for (let i = 0; i < 20; i++) {
        currentTime = add(currentTime, { minutes: 5 });
        events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'LocationUpdate', data: { location: { latitude: 37.7749 - (i * 0.005), longitude: -122.4194 + (i * 0.01) }, speed: 40, fuelLevel: 95 - i, distanceCovered: i * 2.5, totalDistance } });
        if(i % 5 === 0) events.push({ id: generateId(), timestamp: formatISO(add(currentTime, { seconds: 10})), eventType: 'HardBraking', data: { severity: 'low' } });
      }
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripEnd', data: { location: { latitude: 37.7, longitude: -122.2 } } });
      return events;
    })(),
  },
  {
    id: 'trip-3',
    tripName: 'Mountain Route',
    driverName: 'Alex Johnson',
    vehicleModel: 'Jeep Wrangler',
    startLocationName: 'Denver, CO',
    endLocationName: 'Aspen, CO',
    events: ((): FleetEvent[] => {
      let events: FleetEvent[] = [];
      let currentTime = add(simStartTime, {minutes: 10});
      const totalDistance = 320;
      
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripStart', data: { location: { latitude: 39.7392, longitude: -104.9903 } } });
      for (let i = 0; i < 5; i++) {
        currentTime = add(currentTime, { minutes: 15 });
        events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'LocationUpdate', data: { location: { latitude: 39.7392 - (i * 0.01), longitude: -104.9903 - (i * 0.05) }, speed: 70, fuelLevel: 98 - i, distanceCovered: i * 18, totalDistance } });
      }
      currentTime = add(currentTime, { minutes: 15 });
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripCancelled', data: { reason: 'Bad weather', severity: 'high' } });
      return events;
    })(),
  },
  {
    id: 'trip-4',
    tripName: 'Southern Technical Issues',
    driverName: 'Maria Garcia',
    vehicleModel: 'Peterbilt 579',
    startLocationName: 'Dallas, TX',
    endLocationName: 'Houston, TX',
    events: ((): FleetEvent[] => {
      let events: FleetEvent[] = [];
      let currentTime = add(simStartTime, {minutes: 2});
      const totalDistance = 385;
      
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripStart', data: { location: { latitude: 32.7767, longitude: -96.7970 } } });
      for (let i = 0; i < 30; i++) {
        currentTime = add(currentTime, { minutes: 10 });
        if(i > 10 && i < 15) {
            if(i === 11) events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'DeviceOffline', data: { severity: 'high' } });
            continue; // Simulate offline period
        }
        events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'LocationUpdate', data: { location: { latitude: 32.7767 - (i * 0.1), longitude: -96.7970 + (i * 0.05) }, speed: 95, fuelLevel: 90 - (i*2), distanceCovered: i * 15, totalDistance } });
      }
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripEnd', data: { location: { latitude: 29.7604, longitude: -95.3698 } } });
      return events;
    })(),
  },
  {
    id: 'trip-5',
    tripName: 'Regional Logistics',
    driverName: 'Sam Wilson',
    vehicleModel: 'Volvo VNL',
    startLocationName: 'Atlanta, GA',
    endLocationName: 'Nashville, TN',
    events: ((): FleetEvent[] => {
      let events: FleetEvent[] = [];
      let currentTime = add(simStartTime, {minutes: 8});
      let fuel = 40;
      const totalDistance = 400;

      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripStart', data: { location: { latitude: 33.7490, longitude: -84.3880 } } });
      
      for (let i = 0; i < 40; i++) {
        currentTime = add(currentTime, { minutes: 10 });
        fuel -= 3;
        if (fuel < 15 && i < 25) {
          events.push({ id: generateId(), timestamp: formatISO(add(currentTime, { seconds: 10})), eventType: 'LowFuel', data: { fuelLevel: fuel, severity: 'medium' } });
          currentTime = add(currentTime, { minutes: 20 }); // Refueling stop
          fuel = 100;
          events.push({ id: generateId(), timestamp: formatISO(add(currentTime, { seconds: 10})), eventType: 'Refueling', data: {} });
        }
        events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'LocationUpdate', data: { location: { latitude: 33.7490 + (i * 0.06), longitude: -84.3880 - (i * 0.06) }, speed: 100, fuelLevel: fuel, distanceCovered: i * 10, totalDistance } });
      }
      
      events.push({ id: generateId(), timestamp: formatISO(currentTime), eventType: 'TripEnd', data: { location: { latitude: 36.1627, longitude: -86.7816 } } });
      return events;
    })(),
  },
];

export const fleetData: Trip[] = tripsData;
