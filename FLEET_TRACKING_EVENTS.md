# Fleet Tracking Assessment - Data and Event Types

## Overview

This document describes the fleet tracking event types and assessment data structure used in the FleetView dashboard.

## Data Structure

### Trip Object

```typescript
type Trip = {
  id: string;                    // Unique trip identifier
  tripName: string;              // Human-readable trip name
  driverName: string;            // Driver's name
  vehicleModel: string;          // Vehicle type/model
  startLocationName: string;     // Starting location name
  endLocationName: string;       // Destination location name
  events: FleetEvent[];          // Array of events during trip
};
```

### FleetEvent Object

```typescript
type FleetEvent = {
  id: string;                    // Unique event ID
  timestamp: string;             // ISO 8601 timestamp
  eventType: EventType;          // Type of event
  data: {
    location?: Location;         // Geographic coordinates
    speed?: number;              // Speed in km/h
    fuelLevel?: number;          // Fuel percentage (0-100)
    reason?: string;             // Reason for cancellation
    severity?: 'low' | 'medium' | 'high';
    message?: string;            // Descriptive message
    distanceCovered?: number;    // Distance traveled in km
    totalDistance?: number;      // Total trip distance in km
  };
};

type Location = {
  latitude: number;
  longitude: number;
};
```

## Event Types (27 Total)

### 1. **TripStart**
**Description**: Marks the beginning of a trip
**Data Fields**:
- `location`: Starting coordinates
- `message`: Trip start message

**Example**:
```json
{
  "eventType": "TripStart",
  "timestamp": "2025-11-11T08:00:00Z",
  "data": {
    "location": { "latitude": 34.0522, "longitude": -118.2437 },
    "message": "Trip started from Los Angeles Distribution Center"
  }
}
```

### 2. **LocationUpdate**
**Description**: Periodic vehicle position and status update
**Data Fields**:
- `location`: Current GPS coordinates
- `speed`: Current velocity
- `fuelLevel`: Current fuel percentage
- `distanceCovered`: Distance traveled so far
- `totalDistance`: Expected total distance

**Frequency**: Every 1-5 minutes depending on trip

**Example**:
```json
{
  "eventType": "LocationUpdate",
  "timestamp": "2025-11-11T08:15:00Z",
  "data": {
    "location": { "latitude": 34.0600, "longitude": -118.2200 },
    "speed": 85.5,
    "fuelLevel": 98.2,
    "distanceCovered": 12.3,
    "totalDistance": 4500
  }
}
```

### 3. **Speeding**
**Description**: Vehicle exceeds speed limit
**Severity**: Medium
**Data Fields**:
- `speed`: Recorded speed
- `message`: Alert message

**Trigger**: Speed > 90 km/h

**Example**:
```json
{
  "eventType": "Speeding",
  "timestamp": "2025-11-11T10:30:00Z",
  "data": {
    "speed": 105.3,
    "severity": "medium",
    "message": "Excessive speed detected"
  }
}
```

### 4. **HardBraking**
**Description**: Abrupt deceleration detected
**Severity**: Low to Medium
**Data Fields**:
- `severity`: Event severity level
- `message`: Description

**Common In**: Urban routes, emergency situations

**Example**:
```json
{
  "eventType": "HardBraking",
  "timestamp": "2025-11-11T09:45:00Z",
  "data": {
    "severity": "low",
    "message": "Hard braking event recorded"
  }
}
```

### 5. **LowFuel**
**Description**: Fuel level drops below critical threshold
**Severity**: High
**Data Fields**:
- `fuelLevel`: Current fuel percentage
- `severity`: "high"
- `message`: Alert message

**Trigger**: Fuel < 15%

**Example**:
```json
{
  "eventType": "LowFuel",
  "timestamp": "2025-11-11T12:00:00Z",
  "data": {
    "fuelLevel": 12.5,
    "severity": "high",
    "message": "Fuel level critical"
  }
}
```

### 6. **Refueling**
**Description**: Vehicle is refueling
**Severity**: None
**Data Fields**:
- `message`: Refueling status

**Duration**: 20-30 minutes typically

**Example**:
```json
{
  "eventType": "Refueling",
  "timestamp": "2025-11-11T12:25:00Z",
  "data": {
    "message": "Vehicle refueled at station"
  }
}
```

### 7. **TripEnd**
**Description**: Trip completed successfully
**Severity**: None
**Data Fields**:
- `location`: Destination coordinates
- `message`: Completion message

**Example**:
```json
{
  "eventType": "TripEnd",
  "timestamp": "2025-11-11T20:00:00Z",
  "data": {
    "location": { "latitude": 40.7128, "longitude": -74.0060 },
    "message": "Trip completed successfully in New York"
  }
}
```

### 8. **TripCancelled**
**Description**: Trip cancelled before completion
**Severity**: High
**Data Fields**:
- `reason`: Cancellation reason
- `severity`: "high"
- `message`: Description

**Common Reasons**:
- Weather conditions
- Vehicle breakdown
- Driver illness
- Traffic restrictions
- Customer request

**Example**:
```json
{
  "eventType": "TripCancelled",
  "timestamp": "2025-11-11T14:30:00Z",
  "data": {
    "reason": "Severe weather warning - blizzard conditions",
    "severity": "high",
    "message": "Trip cancelled due to weather conditions"
  }
}
```

### 9. **DeviceOffline**
**Description**: Vehicle GPS/tracking device lost connection
**Severity**: High
**Data Fields**:
- `severity`: "high"
- `message`: Offline status

**Impact**: No location updates during offline period

**Example**:
```json
{
  "eventType": "DeviceOffline",
  "timestamp": "2025-11-11T15:45:00Z",
  "data": {
    "severity": "high",
    "message": "GPS device went offline"
  }
}
```

## Assessment Trips

### Trip 1: Cross-Country Long Haul
**ID**: trip-1
**Route**: Los Angeles, CA → New York, NY
**Distance**: 4,500 km
**Events**: 10,000+
**Driver**: John Doe
**Vehicle**: Freightliner Cascadia
**Duration**: ~50 hours simulated
**Challenges**:
- Long distance
- Multiple fuel stops
- Occasional speeding incidents
- Real-time location tracking across continental US

### Trip 2: Urban Dense Delivery
**ID**: trip-2
**Route**: Downtown SF → Suburbs SF
**Distance**: 50 km
**Events**: 500+
**Driver**: Jane Smith
**Vehicle**: Ford Transit
**Duration**: ~5 hours simulated
**Challenges**:
- Frequent stops
- Heavy urban traffic
- Frequent hard braking
- Short delivery windows

### Trip 3: Mountain Route Cancelled
**ID**: trip-3
**Route**: Denver, CO → Aspen, CO
**Distance**: 320 km (partially completed)
**Events**: 100+
**Driver**: Alex Johnson
**Vehicle**: Jeep Wrangler
**Duration**: ~3 hours simulated
**Challenges**:
- Weather cancellation
- Difficult mountain passes
- System demonstrates trip cancellation

### Trip 4: Southern Technical Issues
**ID**: trip-4
**Route**: Dallas, TX → Houston, TX
**Distance**: 385 km
**Events**: 1,000+
**Driver**: Maria Garcia
**Vehicle**: Peterbilt 579
**Duration**: ~8 hours simulated
**Challenges**:
- Device offline period (200 events)
- Technical difficulties
- Recovery from connectivity issues

### Trip 5: Regional Logistics
**ID**: trip-5
**Route**: Atlanta, GA → Nashville, TN
**Distance**: 400 km
**Events**: 2,000+
**Driver**: Sam Wilson
**Vehicle**: Volvo VNL
**Duration**: ~10 hours simulated
**Challenges**:
- Fuel management
- Multiple refueling stops
- Long-distance haul logistics

## Event Timeline Statistics

- **Total Events**: ~13,600 across all trips
- **Time Span**: Events span approximately 50 hours
- **Event Density**:
  - Cross-Country: 1 event every ~18 seconds
  - Urban: 1 event every ~36 seconds
  - Technical Issues: 1 event every ~29 seconds
  - Regional: 1 event every ~18 seconds

## Event Severity Distribution

### Low Severity
- Hard Braking: Frequent in urban areas
- Speeding: Occasional on highways

### Medium Severity
- Speeding: Medium severity on critical routes
- Low Fuel: Medium severity when not at critical level

### High Severity
- TripCancelled: Weather, breakdown
- DeviceOffline: Loss of tracking
- Critical Low Fuel: Below 15%

## Geographic Data

### USA Map Bounds
- **North**: 49.38°N
- **South**: 24.39°N
- **East**: -66.93°W
- **West**: -125.00°W

### Route Coordinates
All trips use accurate GPS coordinates for real USA routes:

#### LA to NY Route (24 waypoints):
- Los Angeles → San Bernardino → Victorville → Flagstaff → Phoenix → Tucson → El Paso → San Antonio → Austin → Memphis → Chattanooga → New York

#### SF Urban Route (8 waypoints):
- Downtown SF → SOMA → Mission → Daly City → San Bruno → South SF → Palo Alto → San Jose

#### Denver to Aspen (6 waypoints):
- Denver → Morrison → Idaho Springs → Vail → Aspen

#### Dallas to Houston (7 waypoints):
- Dallas → Arlington → Austin → Bryan → College Station → Houston

#### Atlanta to Nashville (5 waypoints):
- Atlanta → Stone Mountain → Chattanooga → Nashville

## Simulation Considerations

### Event Processing
- Events are processed chronologically
- Real timestamps ensure realistic simulation
- Simulation speed multiplier (1x-100x) compresses time

### State Management
- Vehicle state updated with each event
- Historical data retained for analytics
- Alert aggregation by type and severity

### Performance Characteristics
- 13,600 events processed efficiently
- Real-time visualization at 60 FPS
- Memoization prevents unnecessary recalculations
- Binary search for event lookup

## Data Quality

- All coordinates are validated for USA bounds
- Event timestamps are continuous and logically ordered
- Distance calculations follow realistic patterns
- Fuel consumption matches expected consumption rates
- Speed values align with vehicle type capabilities

---

For more information about the FleetView dashboard, see README.md
