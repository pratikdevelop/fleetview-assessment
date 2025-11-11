import { add, formatISO } from 'date-fns';
import type { Trip, FleetEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate a unique ID
const generateId = uuidv4;

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

// Route coordinates mapping for realistic tracking
const routes = {
  'la-ny': [
    { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    { lat: 34.1050, lng: -117.7282 }, // San Bernardino
    { lat: 34.4208, lng: -116.9273 }, // Victorville
    { lat: 35.3733, lng: -116.8662 }, // Needles
    { lat: 35.0857, lng: -114.5654 }, // Laughlin
    { lat: 35.3395, lng: -114.9843 }, // Kingman
    { lat: 35.5251, lng: -113.9965 }, // Flagstaff
    { lat: 34.4480, lng: -112.0742 }, // Phoenix
    { lat: 33.3844, lng: -111.9309 }, // Mesa
    { lat: 32.2217, lng: -110.9265 }, // Tucson
    { lat: 31.7683, lng: -106.4270 }, // El Paso
    { lat: 30.3864, lng: -104.0203 }, // Van Horn
    { lat: 29.5630, lng: -102.8975 }, // Marathon
    { lat: 29.2619, lng: -100.4534 }, // Brackettville
    { lat: 29.4241, lng: -98.4936 }, // San Antonio
    { lat: 30.3072, lng: -97.7431 }, // Austin
    { lat: 31.2304, lng: -92.4426 }, // Nacogdoches
    { lat: 32.2313, lng: -93.7461 }, // Longview
    { lat: 33.1960, lng: -93.7298 }, // Texarkana
    { lat: 35.1355, lng: -93.2304 }, // Fort Smith
    { lat: 35.3395, lng: -91.8749 }, // Little Rock
    { lat: 35.7478, lng: -90.6270 }, // Memphis
    { lat: 36.7783, lng: -119.4179 }, // Chattanooga (approx)
    { lat: 40.7128, lng: -74.0060 }, // New York
  ],
  'sf-suburbs': [
    { lat: 37.7749, lng: -122.4194 }, // SF Downtown
    { lat: 37.7614, lng: -122.2658 }, // SOMA
    { lat: 37.7294, lng: -122.2861 }, // Mission
    { lat: 37.6688, lng: -122.0808 }, // Daly City
    { lat: 37.6213, lng: -122.3795 }, // San Bruno
    { lat: 37.5585, lng: -122.2710 }, // South SF
    { lat: 37.4852, lng: -122.1430 }, // Palo Alto
    { lat: 37.3382, lng: -121.8863 }, // San Jose
  ],
  'denver-aspen': [
    { lat: 39.7392, lng: -104.9903 }, // Denver
    { lat: 39.6837, lng: -104.9674 }, // Downtown Denver
    { lat: 39.8561, lng: -105.2705 }, // Morrison
    { lat: 39.9375, lng: -105.5201 }, // Idaho Springs
    { lat: 39.6639, lng: -106.1348 }, // Vail
    { lat: 39.1911, lng: -106.8175 }, // Aspen
  ],
  'dallas-houston': [
    { lat: 32.7767, lng: -96.7970 }, // Dallas
    { lat: 32.6759, lng: -96.6504 }, // Downtown Dallas
    { lat: 32.5149, lng: -96.6639 }, // Arlington
    { lat: 30.2669, lng: -97.7428 }, // Austin
    { lat: 30.1895, lng: -95.5921 }, // Bryan
    { lat: 29.9789, lng: -95.6789 }, // College Station
    { lat: 29.7604, lng: -95.3698 }, // Houston
  ],
  'atlanta-nashville': [
    { lat: 33.7490, lng: -84.3880 }, // Atlanta
    { lat: 33.7537, lng: -84.3862 }, // Downtown Atlanta
    { lat: 33.8547, lng: -84.2735 }, // Stone Mountain
    { lat: 34.5004, lng: -85.0094 }, // Chattanooga
    { lat: 35.0078, lng: -86.2042 }, // Nashville
  ],
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
      const routePoints = routes['la-ny'];

      events.push({ 
        id: generateId(), 
        timestamp: formatISO(currentTime), 
        eventType: 'TripStart', 
        data: { 
          location: { latitude: routePoints[0].lat, longitude: routePoints[0].lng },
          message: 'Trip started from Los Angeles Distribution Center'
        } 
      });

      // Generate ~10,000 events over the journey
      for (let i = 0; i < 10000; i++) {
        currentTime = add(currentTime, { minutes: 1 });
        
        // Progress along the route
        const progress = (i / 10000) * (routePoints.length - 1);
        const routeIdx = Math.floor(progress);
        const routeNextIdx = Math.min(routeIdx + 1, routePoints.length - 1);
        const blend = progress - routeIdx;
        
        const lat = routePoints[routeIdx].lat + (routePoints[routeNextIdx].lat - routePoints[routeIdx].lat) * blend;
        const lng = routePoints[routeIdx].lng + (routePoints[routeNextIdx].lng - routePoints[routeIdx].lng) * blend;
        
        distance = (i / 10000) * totalDistance;
        fuel = 100 - ((i / 10000) * 85); // Uses 85% fuel over journey
        
        const speed = 75 + (Math.random() - 0.5) * 20; // Speed variation 65-85 km/h
        
        // Regular location updates
        if (i % 5 === 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'LocationUpdate',
            data: {
              location: { latitude: lat, longitude: lng },
              speed: speed,
              fuelLevel: Math.max(0, fuel),
              distanceCovered: distance,
              totalDistance,
            }
          });
        }

        // Random speeding events
        if (i % 1500 === 0 && i > 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(add(currentTime, { seconds: Math.random() * 30 })),
            eventType: 'Speeding',
            data: { speed: 95 + Math.random() * 20, severity: 'medium', message: 'Excessive speed detected' }
          });
        }

        // Random hard braking events
        if (i % 2000 === 0 && i > 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(add(currentTime, { seconds: Math.random() * 30 })),
            eventType: 'HardBraking',
            data: { severity: 'low', message: 'Hard braking event recorded' }
          });
        }

        // Fuel refill event
        if (fuel < 20 && i > 1000) {
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'LowFuel',
            data: { fuelLevel: fuel, severity: 'high', message: 'Fuel level critical' }
          });
          
          // Refueling event 20 minutes later
          currentTime = add(currentTime, { minutes: 20 });
          fuel = 100;
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'Refueling',
            data: { message: 'Vehicle refueled at station' }
          });
        }
      }

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripEnd',
        data: {
          location: { latitude: routePoints[routePoints.length - 1].lat, longitude: routePoints[routePoints.length - 1].lng },
          message: 'Trip completed successfully in New York'
        }
      });

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
      let currentTime = add(simStartTime, { minutes: 5 });
      const totalDistance = 50;
      let distance = 0;
      const routePoints = routes['sf-suburbs'];

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripStart',
        data: {
          location: { latitude: routePoints[0].lat, longitude: routePoints[0].lng },
          message: 'Urban delivery route started'
        }
      });

      // Generate ~500 events for dense urban delivery
      for (let i = 0; i < 500; i++) {
        currentTime = add(currentTime, { minutes: 2 });

        const progress = (i / 500) * (routePoints.length - 1);
        const routeIdx = Math.floor(progress);
        const routeNextIdx = Math.min(routeIdx + 1, routePoints.length - 1);
        const blend = progress - routeIdx;

        const lat = routePoints[routeIdx].lat + (routePoints[routeNextIdx].lat - routePoints[routeIdx].lat) * blend;
        const lng = routePoints[routeIdx].lng + (routePoints[routeNextIdx].lng - routePoints[routeIdx].lng) * blend;

        distance = (i / 500) * totalDistance;

        if (i % 3 === 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'LocationUpdate',
            data: {
              location: { latitude: lat, longitude: lng },
              speed: 20 + Math.random() * 25, // 20-45 km/h for urban
              fuelLevel: 95 - (i / 500) * 20,
              distanceCovered: distance,
              totalDistance,
            }
          });
        }

        // Frequent hard braking in urban areas
        if (i % 80 === 0 && i > 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(add(currentTime, { seconds: Math.random() * 30 })),
            eventType: 'HardBraking',
            data: { severity: 'low', message: 'Urban driving - hard stop' }
          });
        }
      }

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripEnd',
        data: {
          location: { latitude: routePoints[routePoints.length - 1].lat, longitude: routePoints[routePoints.length - 1].lng },
          message: 'All deliveries completed'
        }
      });

      return events;
    })(),
  },
  {
    id: 'trip-3',
    tripName: 'Mountain Route Cancelled',
    driverName: 'Alex Johnson',
    vehicleModel: 'Jeep Wrangler',
    startLocationName: 'Denver, CO',
    endLocationName: 'Aspen, CO',
    events: ((): FleetEvent[] => {
      let events: FleetEvent[] = [];
      let currentTime = add(simStartTime, { minutes: 10 });
      const totalDistance = 320;
      let distance = 0;
      const routePoints = routes['denver-aspen'];

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripStart',
        data: {
          location: { latitude: routePoints[0].lat, longitude: routePoints[0].lng },
          message: 'Mountain route trip started'
        }
      });

      // Generate ~100 events before cancellation
      for (let i = 0; i < 100; i++) {
        currentTime = add(currentTime, { minutes: 5 });

        const progress = Math.min(i / 100, 0.4); // Only go 40% before weather cancellation
        const routeIdx = Math.floor(progress * (routePoints.length - 1));
        const routeNextIdx = Math.min(routeIdx + 1, routePoints.length - 1);
        const blend = (progress * (routePoints.length - 1)) - routeIdx;

        const lat = routePoints[routeIdx].lat + (routePoints[routeNextIdx].lat - routePoints[routeIdx].lat) * blend;
        const lng = routePoints[routeIdx].lng + (routePoints[routeNextIdx].lng - routePoints[routeIdx].lng) * blend;

        distance = progress * totalDistance;

        events.push({
          id: generateId(),
          timestamp: formatISO(currentTime),
          eventType: 'LocationUpdate',
          data: {
            location: { latitude: lat, longitude: lng },
            speed: 60 + Math.random() * 15,
            fuelLevel: 95 - (progress * 20),
            distanceCovered: distance,
            totalDistance,
          }
        });
      }

      // Weather-related cancellation
      currentTime = add(currentTime, { minutes: 5 });
      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripCancelled',
        data: {
          reason: 'Severe weather warning - blizzard conditions in mountain passes',
          severity: 'high',
          message: 'Trip cancelled due to weather conditions'
        }
      });

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
      let currentTime = add(simStartTime, { minutes: 2 });
      const totalDistance = 385;
      let distance = 0;
      const routePoints = routes['dallas-houston'];

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripStart',
        data: {
          location: { latitude: routePoints[0].lat, longitude: routePoints[0].lng },
          message: 'Logistics route started'
        }
      });

      // Generate ~1000 events with technical issues
      for (let i = 0; i < 1000; i++) {
        currentTime = add(currentTime, { minutes: 1.5 });

        const progress = (i / 1000) * (routePoints.length - 1);
        const routeIdx = Math.floor(progress);
        const routeNextIdx = Math.min(routeIdx + 1, routePoints.length - 1);
        const blend = progress - routeIdx;

        const lat = routePoints[routeIdx].lat + (routePoints[routeNextIdx].lat - routePoints[routeIdx].lat) * blend;
        const lng = routePoints[routeIdx].lng + (routePoints[routeNextIdx].lng - routePoints[routeIdx].lng) * blend;

        distance = (i / 1000) * totalDistance;

        // Skip device offline period (400-600)
        if (i > 400 && i < 600) {
          if (i === 401) {
            events.push({
              id: generateId(),
              timestamp: formatISO(currentTime),
              eventType: 'DeviceOffline',
              data: { severity: 'high', message: 'GPS device went offline' }
            });
          }
          continue;
        }

        if (i % 4 === 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'LocationUpdate',
            data: {
              location: { latitude: lat, longitude: lng },
              speed: 85 + (Math.random() - 0.5) * 30,
              fuelLevel: 85 - (i / 1000) * 60,
              distanceCovered: distance,
              totalDistance,
            }
          });
        }

        // Speeding incidents
        if (i % 300 === 0 && i > 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(add(currentTime, { seconds: Math.random() * 30 })),
            eventType: 'Speeding',
            data: { speed: 105 + Math.random() * 15, severity: 'medium' }
          });
        }
      }

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripEnd',
        data: {
          location: { latitude: routePoints[routePoints.length - 1].lat, longitude: routePoints[routePoints.length - 1].lng },
          message: 'Trip completed successfully in Houston'
        }
      });

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
      let currentTime = add(simStartTime, { minutes: 8 });
      let fuel = 40;
      const totalDistance = 400;
      let distance = 0;
      const routePoints = routes['atlanta-nashville'];

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripStart',
        data: {
          location: { latitude: routePoints[0].lat, longitude: routePoints[0].lng },
          message: 'Regional logistics trip started'
        }
      });

      // Generate ~2000 events with fuel management
      for (let i = 0; i < 2000; i++) {
        currentTime = add(currentTime, { minutes: 1 });

        const progress = (i / 2000) * (routePoints.length - 1);
        const routeIdx = Math.floor(progress);
        const routeNextIdx = Math.min(routeIdx + 1, routePoints.length - 1);
        const blend = progress - routeIdx;

        const lat = routePoints[routeIdx].lat + (routePoints[routeNextIdx].lat - routePoints[routeIdx].lat) * blend;
        const lng = routePoints[routeIdx].lng + (routePoints[routeNextIdx].lng - routePoints[routeIdx].lng) * blend;

        distance = (i / 2000) * totalDistance;
        fuel -= 0.04; // Gradual fuel consumption

        if (i % 3 === 0) {
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'LocationUpdate',
            data: {
              location: { latitude: lat, longitude: lng },
              speed: 90 + (Math.random() - 0.5) * 20,
              fuelLevel: Math.max(0, fuel),
              distanceCovered: distance,
              totalDistance,
            }
          });
        }

        // Fuel events
        if (fuel < 15 && fuel > 12) {
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'LowFuel',
            data: { fuelLevel: fuel, severity: 'medium', message: 'Fuel running low' }
          });
        }

        if (fuel < 12) {
          // Refuel event
          currentTime = add(currentTime, { minutes: 25 });
          fuel = 95;
          events.push({
            id: generateId(),
            timestamp: formatISO(currentTime),
            eventType: 'Refueling',
            data: { message: 'Vehicle refueled' }
          });
        }
      }

      events.push({
        id: generateId(),
        timestamp: formatISO(currentTime),
        eventType: 'TripEnd',
        data: {
          location: { latitude: routePoints[routePoints.length - 1].lat, longitude: routePoints[routePoints.length - 1].lng },
          message: 'Regional logistics trip completed'
        }
      });

      return events;
    })(),
  },
];

// Export generated data as fallback
// In production, the dashboard will try to load from /api/fleet-data first
export const fleetData: Trip[] = tripsData;

// Helper function to check if assessment data is available
export function isAssessmentDataAvailable(): boolean {
  // This will be set to true if assessment JSON files are present
  // Can be used to show loading state or fallback indicator in UI
  return false; // Set to true after verifying files exist
}
