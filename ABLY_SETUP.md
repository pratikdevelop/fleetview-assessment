# Ably Integration Setup Guide

## Overview
This guide walks you through integrating Ably (managed pub/sub) into FleetView for real-time telemetry streaming.

## Prerequisites
- Ably account with API key (you have: `_XTIEA.jVt_cw:...`)
- Node.js 18+ and npm
- Next.js dev environment running

## Step 1: Environment Setup
Your API key is already added to `.env.local`:
```bash
ABLY_API_KEY=_XTIEA.jVt_cw:KguD-oF0jmujb2xVTo6Ei8TNY1LMy97LUsjwWk_wU-E
```

## Step 2: Install Dependencies
```bash
npm install
```

This installs the `ably` package which provides both REST and Realtime SDKs.

## Step 3: Start the Next.js Development Server
```bash
npm run dev
```

You should see:
```
✓ Ready in 2.1s
- Local:        http://localhost:9002
```

## Step 4: Test the Ably Token Endpoint
In a separate PowerShell window, test the token endpoint:

```powershell
# Request a token from the server
curl -X POST http://localhost:9002/api/ably-token `
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "keyName": "...",
  "key": "...",
  "ttl": 3600000,
  "timestamp": 1699858500000,
  ...
}
```

This is a **tokenRequest** — the client will use this to authenticate with Ably.

## Step 5: Publish Test Events to Ably
In another PowerShell window, run the publisher script:

```powershell
# Set the API key for this session (already in .env.local, but explicit for clarity)
$env:ABLY_API_KEY = "_XTIEA.jVt_cw:KguD-oF0jmujb2xVTo6Ei8TNY1LMy97LUsjwWk_wU-E"

# Run the publisher
node .\scripts\publish-ably.js
```

You should see output like:
```
Publishing 716409 events from trip_1_cross_country.json
...
Done
```

**Note:** This publishes all assessment events to Ably's `fleet-events` channel. If the volume is too large, you can modify `scripts/publish-ably.js` to sample events (e.g., every Nth event).

## Step 6: View Real-Time Events in Dashboard
1. Open browser to http://localhost:9002
2. Navigate to the dashboard component
3. The `useAbly` hook will automatically:
   - Fetch a tokenRequest from `/api/ably-token`
   - Connect to Ably Realtime
   - Subscribe to the `fleet-events` channel
   - Forward incoming messages to `useSimulation` via `ingestEvent`
4. You should see vehicles updating in real-time as events arrive from Ably

## Architecture

```
┌─────────────────────────────────────────────┐
│  Publisher (Node.js script)                 │
│  scripts/publish-ably.js                    │
│  (uses REST API to publish events)           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Ably Cloud       │
        │  (fleet-events     │
        │   channel)         │
        └────────┬───────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────────┐   ┌──────────────────────┐
   │   Server    │   │    Browser Client    │
   │ /api/ably   │   │  (Dashboard)         │
   │ -token      │   │  - useAbly hook      │
   │ (issues     │   │  - useSimulation     │
   │  tokens)    │   │  - Map View          │
   └─────────────┘   └──────────────────────┘
```

## Workflow

1. **Server (Next.js):**
   - Endpoint `/api/ably-token` uses `ABLY_API_KEY` to create a tokenRequest
   - Returns token to client for secure authentication

2. **Client (React):**
   - `useAbly(ingestEvent)` hook fetches tokenRequest from server
   - Connects to Ably Realtime with token (no server key exposed)
   - Subscribes to `fleet-events` channel
   - Each incoming message is passed to `useSimulation` via `ingestEvent`

3. **Publisher (Node.js):**
   - `scripts/publish-ably.js` uses REST API to publish events
   - Reads assessment JSON files and publishes each event to Ably

## Troubleshooting

### "ABLY_API_KEY not configured"
- Ensure `.env.local` has `ABLY_API_KEY=...`
- Restart Next.js dev server after adding env vars
- Check: `npm run dev` shows ✓ Ready

### "Failed to create token request"
- Verify Ably API key is correct (check Ably dashboard)
- Check server logs for detailed error message
- Try creating a fresh API key in Ably dashboard

### Events not appearing in dashboard
1. Check browser console (F12) for errors
2. Verify publisher script is running: `node .\scripts\publish-ably.js`
3. Check Ably dashboard — should show activity in `fleet-events` channel
4. In browser DevTools → Network tab, verify `/api/ably-token` returns 200 status

### Publisher hangs or slow
- If publishing thousands of events is slow, modify `scripts/publish-ably.js` to batch publish:
  ```javascript
  // Publish in batches to avoid overwhelming the channel
  const batch = arr.slice(i, i + 100);
  await Promise.all(batch.map(evt => publish(evt)));
  ```

## Configuration Options

### Adjust Channel Name
Edit `src/hooks/use-ably.ts`:
```typescript
export function useAbly(
  ingestEvent,
  options: UseAblyOptions = {}
) {
  const { channel = 'fleet-events', ... } = options;
  // ...
}
```

### Adjust Message Type
Edit `scripts/publish-ably.js` to transform events:
```javascript
// Convert raw event to FleetEvent shape if needed
const fleetEvent = {
  id: evt.event_id,
  tripId: evt.trip_id,
  timestamp: evt.timestamp,
  eventType: mapEventType(evt.event_type),
  data: { /* ... */ }
};
channel.publish('fleetEvent', fleetEvent);
```

## Next Steps

### Option A: Add Provider Toggle UI
Wire in a runtime provider switcher so you can pick between SSE, Ably, and WebSocket. I can add this to the dashboard controls.

### Option B: Production Deployment
- Move Ably API key to secrets manager (don't commit to Git)
- Deploy to Vercel / Cloud Run with env vars
- Update `.env.example` (without actual key)

### Option C: Scaling & Optimization
- Batch publish events (reduce API calls)
- Add client-side event filtering (only subscribe to relevant channels)
- Implement presence tracking (see who's connected to dashboard)

### Option D: Testing & Monitoring
- Add Ably analytics to dashboard (display event throughput, latency)
- Create Jest integration tests for Ably token endpoint
- Load test with synthetic client connections

## Reference Links

- Ably Pub/Sub docs: https://www.ably.com/documentation/general/features
- Token authentication: https://www.ably.com/documentation/realtime/authentication
- JavaScript SDK: https://www.ably.com/documentation/client-libraries/javascript
- REST API: https://www.ably.com/documentation/rest-api

## Support

If you hit issues:
1. Check browser console (F12) for client errors
2. Check Next.js server logs for backend errors
3. Visit Ably dashboard https://dashboard.ably.com to verify channel activity
4. File an issue in the FleetView repo with error message and steps to reproduce

---

Happy streaming! 🚀
