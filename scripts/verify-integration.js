#!/usr/bin/env node
// scripts/verify-integration.js
// Verify all 15 trips are properly integrated and ready for streaming

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   FleetView Integration Verification (15 Trips)           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const assessmentDir = path.join(__dirname, '..', 'src', 'assessment-2025-11-08-17-25-55');
const configPath = path.join(assessmentDir, 'trip-config.json');

// 1. Check trip-config.json exists and is valid
console.log('1️⃣  Checking trip-config.json...');
if (!fs.existsSync(configPath)) {
  console.log('   ❌ trip-config.json not found\n');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
console.log(`   ✓ Found ${config.length} trips in config\n`);

// 2. Verify all JSON files exist
console.log('2️⃣  Verifying trip JSON files...');
let missingFiles = [];
let totalEvents = 0;

config.forEach((trip, idx) => {
  const filePath = path.join(assessmentDir, trip.fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ ${trip.fileName} not found`);
    missingFiles.push(trip.fileName);
  } else {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const events = JSON.parse(content);
      totalEvents += events.length;
      console.log(`   ✓ ${trip.fileName} (${events.length} events)`);
    } catch (err) {
      console.log(`   ❌ ${trip.fileName} (invalid JSON)`);
      missingFiles.push(trip.fileName);
    }
  }
});

if (missingFiles.length > 0) {
  console.log(`\n   ⚠️  Missing ${missingFiles.length} files. Some trips may not load.\n`);
} else {
  console.log(`   ✓ All files present!\n`);
}

// 3. Verify .env.local has ABLY_API_KEY
console.log('3️⃣  Checking environment variables...');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('   ⚠️  .env.local not found (will use defaults)\n');
} else {
  const env = fs.readFileSync(envPath, 'utf-8');
  if (env.includes('ABLY_API_KEY')) {
    console.log('   ✓ ABLY_API_KEY configured\n');
  } else {
    console.log('   ⚠️  ABLY_API_KEY not set (streaming may not work)\n');
  }
}

// 4. Check API route files exist
console.log('4️⃣  Checking API routes...');
const routes = [
  'src/app/api/fleet-data/route.ts',
  'src/app/api/ably-token/route.ts',
  'src/app/api/fleet-stream/route.ts',
];
routes.forEach(route => {
  const routePath = path.join(__dirname, '..', route);
  if (fs.existsSync(routePath)) {
    console.log(`   ✓ ${route}`);
  } else {
    console.log(`   ❌ ${route} not found`);
  }
});
console.log();

// 5. Check client hooks exist
console.log('5️⃣  Checking client hooks...');
const hooks = [
  'src/hooks/use-fleet-stream.ts',
  'src/hooks/use-ably.ts',
  'src/hooks/use-fleet-ws.ts',
];
hooks.forEach(hook => {
  const hookPath = path.join(__dirname, '..', hook);
  if (fs.existsSync(hookPath)) {
    console.log(`   ✓ ${hook}`);
  } else {
    console.log(`   ❌ ${hook} not found`);
  }
});
console.log();

// Summary
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                       SUMMARY                              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`  Total Trips Configured: ${config.length}`);
console.log(`  Total Events Available: ${totalEvents.toLocaleString()}`);
console.log(`  Missing Files: ${missingFiles.length}`);
console.log(`  Status: ${missingFiles.length === 0 ? '✅ READY TO DEPLOY' : '⚠️  INCOMPLETE'}\n`);

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                   QUICK START COMMANDS                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log('Terminal 1: Start dev server');
console.log('  npm run dev\n');
console.log('Terminal 2: Publish events to Ably');
console.log('  $env:ABLY_API_KEY = "<your-key>"');
console.log('  node .\\scripts\\publish-ably.js\n');
console.log('Terminal 3: Open dashboard');
console.log('  http://localhost:9002\n');
console.log('Then select "Ably" provider in the header to see real-time events!\n');
