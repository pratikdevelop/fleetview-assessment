// Simple script to publish assessment events to Ably channel 'fleet-events'
// Usage: node scripts/publish-ably.js

const fs = require('fs');
const path = require('path');
const Ably = require('ably');

const ABLY_API_KEY = process.env.ABLY_API_KEY ||  "_XTIEA.jVt_cw:KguD-oF0jmujb2xVTo6Ei8TNY1LMy97LUsjwWk_wU-E";
if (!ABLY_API_KEY) {
  console.error('Please set ABLY_API_KEY in env');
  process.exit(1);
}

const rest = new Ably.Rest({ key: ABLY_API_KEY });
const channel = rest.channels.get('fleet-events');

(async function publishAll() {
  try {
    const dataDir = path.join(__dirname, '..', 'src', 'assessment-2025-11-08-17-25-55');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
      const arr = JSON.parse(content);
      console.log(`Publishing ${arr.length} events from ${file}`);

      for (const evt of arr) {
        // Convert to FleetEvent-ish shape if necessary; here we forward raw event
        await new Promise((res, rej) => {
          channel.publish('fleetEvent', evt, (err) => {
            if (err) return rej(err);
            res();
          });
        });
      }
    }
    console.log('Done');
  } catch (err) {
    console.error('Publish error', err);
  }
})();
