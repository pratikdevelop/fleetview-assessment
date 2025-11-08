export type Location = {
  latitude: number;
  longitude: number;
};

export type FleetEvent = {
  id: string;
  timestamp: string; // ISO 8601 format
  eventType: 'TripStart' | 'TripEnd' | 'LocationUpdate' | 'HardBraking' | 'Speeding' | 'LowFuel' | 'TripCancelled' | 'DeviceOffline' | 'Refueling';
  data: {
    location?: Location;
    speed?: number; // km/h
    fuelLevel?: number; // percentage
    reason?: string; // for cancellation
    severity?: 'low' | 'medium' | 'high';
    message?: string;
    distanceCovered?: number; // km
    totalDistance?: number; // km
  };
};

export type Trip = {
  id: string;
  tripName: string;
  driverName: string;
  vehicleModel: string;
  startLocationName: string;
  endLocationName: string;
  events: FleetEvent[];
};

export type VehicleState = {
  id: string; // trip id
  tripName: string;
  driverName: string;
  vehicleModel: string;
  location: Location;
  status: string;
  speed: number;
  fuelLevel: number;
  progress: number;
  alerts: FleetEvent[];
};
