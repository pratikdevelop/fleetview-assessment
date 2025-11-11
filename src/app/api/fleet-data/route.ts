import { NextResponse } from 'next/server';
import type { Trip, FleetEvent } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { getTripConfigs, TripConfig } from '@/lib/trip-config';

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

function convertGeneratedEvent(rawEvent: RawAssessmentEvent, tripId: string): FleetEvent {
  const eventType = rawEvent.event_type;
  let convertedType: FleetEvent['eventType'] = 'LocationUpdate';

  if (eventType === 'trip_started') convertedType = 'TripStart';
  else if (eventType === 'trip_ended') convertedType = 'TripEnd';
  else if (eventType === 'trip_cancelled') convertedType = 'TripCancelled';
  else if (eventType === 'location_ping') convertedType = 'LocationUpdate';
  else if (eventType === 'overspeed_event' || rawEvent.overspeed) convertedType = 'Speeding';
  else if (eventType === 'hard_braking_event') convertedType = 'HardBraking';
  else if (eventType === 'fuel_low') convertedType = 'LowFuel';
  else if (eventType === 'refueling') convertedType = 'Refueling';
  else if (eventType === 'device_offline') convertedType = 'DeviceOffline';

  return {
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
      severity: (rawEvent.severity as 'low' | 'medium' | 'high' | undefined) || undefined,
      message: rawEvent.event_description || eventType,
      reason: rawEvent.cancellation_reason,
    },
  };
}

// Trip configs are loaded dynamically from `src/assessment-2025-11-08-17-25-55/trip-config.json`
// or remotely via the FLEET_TRIP_CONFIG_URL environment variable using `src/lib/trip-config.ts`.

let cachedTrips: Trip[] | null = null;
const CACHE_DIR = join(process.cwd(), '.cache');
const CACHE_FILE = join(CACHE_DIR, 'fleet-data-cache.json');
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

async function readPersistentCache(): Promise<Trip[] | null> {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const text = await readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(text);
    if (!parsed || !parsed.timestamp || !parsed.trips) return null;
    const age = Date.now() - parsed.timestamp;
    if (age > (parsed.ttl || CACHE_TTL_MS)) return null;
    return parsed.trips as Trip[];
  } catch (err) {
    console.warn('[Fleet Data API] Persistent cache read failed:', err);
    return null;
  }
}

async function writePersistentCache(trips: Trip[]) {
  try {
    try { mkdirSync(CACHE_DIR, { recursive: true }); } catch {}
    await writeFile(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), ttl: CACHE_TTL_MS, trips }), 'utf-8');
  } catch (err) {
    console.warn('[Fleet Data API] Could not write persistent cache:', err);
  }
}

export async function GET(request: Request) {
  try {
    // Allow forcing a refresh via ?refresh=1
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === '1';

    if (cachedTrips && !refresh) {
      console.log('[Fleet Data API] Returning cached trips');
      return NextResponse.json({ trips: cachedTrips, count: cachedTrips.length });
    }

    // Try persistent cache first (survives cold starts in container deployments)
    if (!refresh) {
      const persistent = await readPersistentCache();
      if (persistent) {
        cachedTrips = persistent;
        console.log('[Fleet Data API] Returning persistent cached trips');
        return NextResponse.json({ trips: cachedTrips, count: cachedTrips.length });
      }
    }

    const trips: Trip[] = [];
    const assessmentPath = join(process.cwd(), 'src', 'assessment-2025-11-08-17-25-55');

    // Load dynamic trip configs (remote via FLEET_TRIP_CONFIG_URL or local trip-config.json)
    const configs: TripConfig[] = (await getTripConfigs()) as TripConfig[];
    if (!configs || configs.length === 0) {
      console.warn('[Fleet Data API] No trip configs found; nothing to load');
    }

  // Stream-parse each file and take up to config.maxEvents per file
  for (const config of configs.length ? configs : []) {
      try {
        const filePath = join(assessmentPath, config.fileName);
        if (!existsSync(filePath)) {
          console.warn(`[Fleet Data API] File not found: ${filePath}`);
          continue;
        }

        // Attempt to require stream-json at runtime without letting Next.js bundle resolve it statically.
        // This uses eval('require') so the bundler doesn't analyze the require call.
        let streamJson: any = null;
        try {
          // eslint-disable-next-line no-eval
          const req: NodeRequire = eval('require');
          streamJson = req('stream-json/streamers/StreamArray');
        } catch (err) {
          streamJson = null;
        }

        if (!streamJson) {
          // Fallback to full file read if stream-json isn't installed
          const fileContent = await readFile(filePath, 'utf-8');
          const rawEvents = JSON.parse(fileContent) as RawAssessmentEvent[];
          if (Array.isArray(rawEvents) && rawEvents.length > 0) {
            const events = rawEvents.slice(0, config.maxEvents).map((e) => convertGeneratedEvent(e, config.id));
            trips.push({ id: config.id, tripName: config.tripName, driverName: config.driverName || 'Unknown', vehicleModel: config.vehicleModel || '', startLocationName: config.startLocationName || '', endLocationName: config.endLocationName || '', events });
            console.log(`[Fleet Data API] (fallback) Loaded ${events.length} events for ${config.tripName}`);
          }
          continue;
        }

        const StreamArray = streamJson.default || streamJson;
        const stream = createReadStream(filePath, { encoding: 'utf8' });

        // @ts-ignore - instantiate streamer
        const parser = StreamArray.withParser();

        const events: FleetEvent[] = [];

        await new Promise<void>((resolve, reject) => {
          stream.on('error', (err) => reject(err));
          parser.on('data', ({ value }: any) => {
            if (events.length < config.maxEvents) {
              try {
                const ev = convertGeneratedEvent(value as RawAssessmentEvent, config.id);
                events.push(ev);
              } catch (err) {
                // ignore malformed event
              }
            }
            if (events.length >= config.maxEvents) {
              // we've collected enough events - destroy streams
              stream.destroy();
              try { parser.destroy(); } catch (_) {}
              resolve();
            }
          });
          parser.on('end', () => resolve());
          parser.on('error', (err: any) => reject(err));
          stream.pipe(parser.input);
        });

        if (events.length > 0) {
          trips.push({ id: config.id, tripName: config.tripName, driverName: config.driverName || 'Unknown', vehicleModel: config.vehicleModel || '', startLocationName: config.startLocationName || '', endLocationName: config.endLocationName || '', events });
          console.log(`[Fleet Data API] Streamed ${events.length} events for ${config.tripName}`);
        }
      } catch (error) {
        console.warn(`[Fleet Data API] Could not load ${config.fileName}:`, error);
      }
    }

    if (trips.length === 0) {
      console.warn('[Fleet Data API] No assessment data loaded, returning empty trips');
    }
    // Cache the loaded trips in memory for subsequent requests
    cachedTrips = trips;
    // Also write to persistent cache asynchronously
    try {
      await writePersistentCache(trips);
    } catch (err) {
      console.warn('[Fleet Data API] Failed to write persistent cache:', err);
    }

    return NextResponse.json({ trips, count: trips.length });
  } catch (error) {
    console.error('[Fleet Data API] Error loading fleet data:', error);
    return NextResponse.json({ trips: [], count: 0, error: 'Failed to load fleet data' }, { status: 500 });
  }
}
