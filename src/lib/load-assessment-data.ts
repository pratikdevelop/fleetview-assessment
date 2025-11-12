import type { Trip, FleetEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for raw assessment data
interface RawAssessmentEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  vehicle_id?: string;
  trip_id?: string;
  device_id?: string;
  location?: { lat: number; lng: number };
  movement?: { speed_kmh: number; heading_degrees: number; moving: boolean };
  planned_distance_km?: number;
  estimated_duration_hours?: number;
  fuel_level?: number;
  distance_travelled_km?: number;
  severity?: string;
  event_description?: string;
  cancellation_reason?: string;
  device?: { battery_level: number; charging: boolean };
  overspeed?: boolean;
}

// Helper to convert generated event format to our format
function convertGeneratedEvent(rawEvent: RawAssessmentEvent, tripId: string): FleetEvent {
  const eventType = rawEvent.event_type;
  let convertedType: FleetEvent['eventType'] = 'LocationUpdate';

  // Map event types from assessment format to our format
  if (eventType === 'trip_started') convertedType = 'TripStart';
  else if (eventType === 'trip_ended') convertedType = 'TripEnd';
  else if (eventType === 'trip_cancelled') convertedType = 'TripCancelled';
  else if (eventType === 'location_ping') convertedType = 'LocationUpdate';
  else if (eventType === 'overspeed_event' || rawEvent.overspeed) convertedType = 'Speeding';
  else if (eventType === 'hard_braking_event') convertedType = 'HardBraking';
  else if (eventType === 'fuel_low') convertedType = 'LowFuel';
  else if (eventType === 'refueling') convertedType = 'Refueling';
  else if (eventType === 'device_offline') convertedType = 'DeviceOffline';

  const event: FleetEvent = {
    id: rawEvent.event_id || uuidv4(),
    timestamp: rawEvent.timestamp,
    eventType: convertedType,
    data: {
      location: rawEvent.location
        ? {
            latitude: rawEvent.location.lat || rawEvent.location.lat,
            longitude: rawEvent.location.lng || rawEvent.location.lng,
          }
        : undefined,
      speed: rawEvent.movement?.speed_kmh,
      fuelLevel: rawEvent.fuel_level,
      distanceCovered: rawEvent.distance_travelled_km,
      totalDistance: rawEvent.planned_distance_km,
      severity: (rawEvent.severity as 'low' | 'medium' | 'high' | undefined) || (eventType.includes('hard') ? 'low' : eventType.includes('overspeed') ? 'medium' : undefined),
      message: rawEvent.event_description || `${eventType}`,
      reason: rawEvent.cancellation_reason,
    },
  };

  return event;
}

// Trip configuration mapping
interface TripConfig {
  id: string;
  tripName: string;
  driverName: string;
  vehicleModel: string;
  startLocationName: string;
  endLocationName: string;
  maxEvents?: number;
}

const tripConfigs: TripConfig[] = [
  {
    id: 'trip-1',
    tripName: 'Cross-Country Long Haul',
    driverName: 'John Doe',
    vehicleModel: 'Freightliner Cascadia',
    startLocationName: 'Houston, TX',
    endLocationName: 'New York, NY',
    maxEvents: 10000,
  },
  {
    id: 'trip-2',
    tripName: 'Urban Dense Delivery',
    driverName: 'Jane Smith',
    vehicleModel: 'Ford Transit',
    startLocationName: 'Downtown Chicago',
    endLocationName: 'Suburbs Chicago',
    maxEvents: 500,
  },
  {
    id: 'trip-3',
    tripName: 'Mountain Route Cancelled',
    driverName: 'Alex Johnson',
    vehicleModel: 'Jeep Wrangler',
    startLocationName: 'Denver, CO',
    endLocationName: 'Aspen, CO',
    maxEvents: 100,
  },
  {
    id: 'trip-4',
    tripName: 'Southern Technical Issues',
    driverName: 'Maria Garcia',
    vehicleModel: 'Peterbilt 579',
    startLocationName: 'Dallas, TX',
    endLocationName: 'Houston, TX',
    maxEvents: 1000,
  },
  {
    id: 'trip-5',
    tripName: 'Regional Logistics',
    driverName: 'Sam Wilson',
    vehicleModel: 'Volvo VNL',
    startLocationName: 'Atlanta, GA',
    endLocationName: 'Nashville, TN',
    maxEvents: 2000,
  },
];

/**
 * Load and convert assessment data from JSON files
 * This function is called at module load time to prepare trip data
 */
export async function loadAssessmentData(): Promise<Trip[]> {
  const trips: Trip[] = [];

  try {
    // Attempt to load each trip data file
    const dataMap: Record<string, RawAssessmentEvent[]> = {};

    // Try to load from JSON files - these paths may need adjustment based on actual import setup
    try {
      const trip1 = await import('@/../src/assessment-2025-11-08-17-25-55/trip_1_cross_country.json').catch(() => null);
      if (trip1?.default) dataMap['trip-1'] = trip1.default as RawAssessmentEvent[];
    } catch {}

    try {
      const trip2 = await import('@/../src/assessment-2025-11-08-17-25-55/trip_2_urban_dense.json').catch(() => null);
      if (trip2?.default) dataMap['trip-2'] = trip2.default as RawAssessmentEvent[];
    } catch {}

    try {
      const trip3 = await import('@/../src/assessment-2025-11-08-17-25-55/trip_3_mountain_cancelled.json').catch(() => null);
      if (trip3?.default) dataMap['trip-3'] = trip3.default as RawAssessmentEvent[];
    } catch {}

    try {
      const trip4 = await import('@/../src/assessment-2025-11-08-17-25-55/trip_4_southern_technical.json').catch(() => null);
      if (trip4?.default) dataMap['trip-4'] = trip4.default as RawAssessmentEvent[];
    } catch {}

    try {
      const trip5 = await import('@/../src/assessment-2025-11-08-17-25-55/trip_5_regional_logistics.json').catch(() => null);
      if (trip5?.default) dataMap['trip-5'] = trip5.default as RawAssessmentEvent[];
    } catch {}

    // Convert loaded data to Trip format
    for (const config of tripConfigs) {
      const rawEvents = dataMap[config.id];
      if (rawEvents && Array.isArray(rawEvents) && rawEvents.length > 0) {
        const events = rawEvents
          .slice(0, config.maxEvents || rawEvents.length)
          .map((e) => convertGeneratedEvent(e, config.id));

        trips.push({
          id: config.id,
          tripName: config.tripName,
          driverName: config.driverName,
          vehicleModel: config.vehicleModel,
          startLocationName: config.startLocationName,
          endLocationName: config.endLocationName,
          events,
        });

        console.log(`[Fleet Data] Loaded ${events.length} events for ${config.tripName}`);
      }
    }

    return trips;
  } catch (error) {
    console.error('[Fleet Data] Error loading assessment data:', error);
    return [];
  }
}

/**
 * Load assessment data synchronously for server-side usage
 * Falls back to empty trips if data cannot be loaded
 */
export function loadAssessmentDataSync(): Trip[] {
  // This will be populated during server initialization
  // For now, return empty array - will be populated by async loader
  return [];
}
