import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MAP_BOUNDS = {
  minLat: 24.396308,
  maxLat: 49.384358,
  minLng: -125.0,
  maxLng: -66.93457,
};

export function convertLatLngToPercent(
  lat: number,
  lng: number
): { x: number; y: number } {
  const x =
    ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
  const y =
    ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;

  return { x, y };
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hDisplay = h > 0 ? h + 'h ' : '';
  const mDisplay = m > 0 ? m + 'm ' : '';
  const sDisplay = s > 0 ? s + 's' : '';
  
  if (h > 0) return hDisplay + mDisplay;
  if (m > 0) return mDisplay + sDisplay;
  return sDisplay || '0s';
}
