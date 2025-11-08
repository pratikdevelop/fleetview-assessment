'use client';

import Image from 'next/image';
import type { VehicleState } from '@/lib/types';
import { convertLatLngToPercent } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { VehicleIcon } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MapViewProps {
  vehicles: VehicleState[];
}

export function MapView({ vehicles }: MapViewProps) {
  const mapImage = PlaceHolderImages.find(img => img.id === 'usa-map');

  return (
    <TooltipProvider>
      <div className="relative h-full w-full">
        {mapImage && (
          <Image
            src={mapImage.imageUrl}
            alt={mapImage.description}
            data-ai-hint={mapImage.imageHint}
            fill
            className="object-cover"
            priority
          />
        )}
        {vehicles.map((vehicle) => {
          if (!vehicle.location) return null;
          const { x, y } = convertLatLngToPercent(vehicle.location.latitude, vehicle.location.longitude);

          if (x < 0 || x > 100 || y < 0 || y > 100) return null;

          return (
            <Tooltip key={vehicle.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 transform transition-all duration-500 ease-linear"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <VehicleIcon status={vehicle.status} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-bold">{vehicle.driverName}</p>
                  <p>{vehicle.tripName}</p>
                  <p>Status: {vehicle.status}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
