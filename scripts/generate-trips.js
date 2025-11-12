// scripts/generate-trips.js
// Generate mock telemetry data for new trips (6-15) in trip-config.json
const fs = require('fs');
const path = require('path');

// Load trip config
const configPath = path.join(__dirname, '..', 'src', 'assessment-2025-11-08-17-25-55', 'trip-config.json');
const tripConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Filter to only new trips (6-15) that don't have files yet
const assessmentDir = path.join(__dirname, '..', 'src', 'assessment-2025-11-08-17-25-55');
const newTrips = tripConfig.slice(5); // trips 6-15 (index 5 onwards)

console.log(`Generating ${newTrips.length} new trip files...\n`);

newTrips.forEach((trip) => {
  const events = [];
  
  // Trip start: 24 hours ago
  const startTime = Date.now() - 24 * 60 * 60 * 1000;
  
  // Random trip duration between 6-18 hours
  const durationHours = Math.random() * 12 + 6;
  const durationMs = durationHours * 60 * 60 * 1000;
  
  // Number of events to generate (respects maxEvents from config)
  const eventCount = Math.min(trip.maxEvents || 5000, 10000);
  
  console.log(`  Generating ${eventCount} events for "${trip.tripName}"...`);
  
  for (let i = 0; i < eventCount; i++) {
    const progress = eventCount > 1 ? i / (eventCount - 1) : 0;
    const timestamp = new Date(startTime + progress * durationMs).toISOString();
    
    // Simulate realistic route progression (rough lat/lng based on trip name)
    let baseLat, baseLng, latRange, lngRange;
    
    switch (trip.id) {
      case 'trip-6': // Vancouver to Halifax (Canada trans-continental)
        baseLat = 53.5; baseLng = -120; latRange = 6; lngRange = 40;
        break;
      case 'trip-7': // San Diego to Monterrey (Mexico border)
        baseLat = 28; baseLng = -112; latRange = 4; lngRange = 8;
        break;
      case 'trip-8': // Anchorage to Prudhoe Bay (Alaska)
        baseLat = 66; baseLng = -153; latRange = 8; lngRange = 15;
        break;
      case 'trip-9': // Honolulu to Kahului (Hawaii)
        baseLat = 20.8; baseLng = -156.5; latRange = 0.5; lngRange = 2;
        break;
      case 'trip-10': // Seattle to Portland (Pacific NW)
        baseLat = 47; baseLng = -122; latRange = 3; lngRange = 2;
        break;
      case 'trip-11': // Miami to Naples (Florida)
        baseLat = 25.5; baseLng = -81; latRange = 1; lngRange = 2;
        break;
      case 'trip-12': // Detroit to Milwaukee (Great Lakes)
        baseLat = 42.5; baseLng = -84; latRange = 4; lngRange = 6;
        break;
      case 'trip-13': // Salt Lake City to Calgary (Rocky Mountains)
        baseLat = 49; baseLng = -110; latRange = 8; lngRange = 12;
        break;
      case 'trip-14': // Phoenix to Albuquerque (Southwest Desert)
        baseLat = 33; baseLng = -112; latRange = 4; lngRange = 4;
        break;
      case 'trip-15': // Boston to Washington DC (Northeast)
        baseLat = 40; baseLng = -76; latRange = 2; lngRange = 2;
        break;
      default:
        baseLat = 40; baseLng = -95; latRange = 10; lngRange = 20;
    }
    
    const lat = baseLat + progress * latRange + (Math.random() - 0.5) * 1;
    const lng = baseLng + progress * lngRange + (Math.random() - 0.5) * 2;
    
    // Simulate realistic telemetry data
    const baseSpeed = 55 + Math.random() * 25; // 55-80 mph
    const speedVariation = Math.sin(progress * Math.PI * 4) * 10; // periodic speed variation
    const speed = Math.max(0, baseSpeed + speedVariation);
    
    // Fuel level decreases over trip, with occasional refueling
    const baseFuel = 85 - progress * 60;
    const isRefueling = Math.random() < 0.001; // ~0.1% chance
    const fuel = isRefueling ? 95 : baseFuel;
    
    // Distance covered (approximate based on time and speed)
    const distanceCovered = (progress * durationHours * 65); // avg ~65 mph
    
    // Determine event type
    let eventType = 'location_ping';
    if (i === 0) eventType = 'trip_started';
    else if (i === eventCount - 1) eventType = 'trip_ended';
    else if (isRefueling) eventType = 'refueling';
    else if (Math.random() < 0.001) eventType = 'overspeed_event'; // ~0.1% chance
    else if (Math.random() < 0.0005) eventType = 'hard_braking_event'; // ~0.05% chance
    else if (Math.random() < 0.0003) eventType = 'fuel_low'; // ~0.03% chance
    else if (Math.random() < 0.0001) eventType = 'device_offline'; // ~0.01% chance
    
    const event = {
      event_id: `evt_${trip.id}_${i}_${Date.now()}`,
      event_type: eventType,
      timestamp,
      vehicle_id: trip.id,
      trip_id: trip.id,
      device_id: `DEVICE_${trip.id}`,
      location: { lat, lng },
      planned_distance_km: trip.maxEvents > 5000 ? 3000 : 1200,
      estimated_duration_hours: durationHours,
      movement: {
        speed_kmh: speed * 1.60934, // convert mph to kmh
        heading_degrees: Math.random() * 360,
        moving: speed > 5,
      },
      device: {
        battery_level: 85 + Math.random() * 15,
        charging: false,
      },
      fuel_level: fuel,
      distance_travelled_km: distanceCovered * 1.60934,
      severity: eventType === 'overspeed_event' ? 'high' : eventType === 'hard_braking_event' ? 'medium' : 'low',
      event_description: `${eventType.replace(/_/g, ' ')} at ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      cancellation_reason: eventType === 'trip_cancelled' ? 'Weather delay' : null,
      overspeed: eventType === 'overspeed_event',
    };
    
    events.push(event);
  }
  
  // Write file
  const filePath = path.join(assessmentDir, trip.fileName);
  fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
  console.log(`  ✓ Created ${trip.fileName} (${eventCount} events)\n`);
});

console.log('✅ All trip files generated successfully!');
