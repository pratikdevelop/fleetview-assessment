import { readFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

// TripConfig schema and Type
export const TripConfigSchema = z.object({
  id: z.string(),
  tripName: z.string(),
  driverName: z.string().optional(),
  vehicleModel: z.string().optional(),
  startLocationName: z.string().optional(),
  endLocationName: z.string().optional(),
  maxEvents: z.number().int().nonnegative(),
  fileName: z.string(),
});

export const TripConfigsSchema = z.array(TripConfigSchema);
export type TripConfig = z.infer<typeof TripConfigSchema>;

const LOCAL_CONFIG_PATH = join(process.cwd(), 'src', 'assessment-2025-11-08-17-25-55', 'trip-config.json');

/**
 * Load trip configs from remote URL (env FLEET_TRIP_CONFIG_URL) or local fallback file.
 * Validates shape with Zod. Returns an array of TripConfig.
 */
export async function getTripConfigs(): Promise<TripConfig[]> {
  // 1) Try remote URL from env var
  const url = process.env.FLEET_TRIP_CONFIG_URL;
  if (url) {
    try {
      // Use global fetch available in Next.js server runtime
      const res = await fetch(url, { cache: 'no-store' } as any);
      if (res.ok) {
        const json = await res.json();
        const parsed = TripConfigsSchema.safeParse(json);
        if (parsed.success) return parsed.data;
        console.warn('[TripConfig] Remote config validation failed:', parsed.error.format());
      } else {
        console.warn('[TripConfig] Failed to fetch remote config:', res.status);
      }
    } catch (err) {
      console.warn('[TripConfig] Error fetching remote config:', err);
    }
  }

  // 2) Fallback to local file
  try {
    const text = await readFile(LOCAL_CONFIG_PATH, 'utf-8');
    const json = JSON.parse(text);
    const parsed = TripConfigsSchema.safeParse(json);
    if (parsed.success) return parsed.data;
    console.warn('[TripConfig] Local config validation failed:', parsed.error.format());
  } catch (err) {
    console.warn('[TripConfig] Could not read local trip-config.json:', err);
  }

  // 3) Final fallback: empty array
  return [];
}
