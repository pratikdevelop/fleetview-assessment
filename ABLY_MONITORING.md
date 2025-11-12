# How to View Real-Time Data in Ably Dashboard

## Step 1: Go to Ably Dashboard
Open: https://dashboard.ably.com

## Step 2: Sign In
- Use your Ably account credentials
- If you just created the account, you'll be logged in automatically

## Step 3: Select Your App
- Click on your app (you created "FleetView" or similar)
- You should see it in the app list

## Step 4: Go to "Channels" Tab
In the left sidebar, click **Channels**

## Step 5: Find "fleet-events" Channel
- You'll see a list of channels
- Look for **`fleet-events`** (this is the channel we're publishing to)
- If no channels show up yet, that's normal — they appear after the first message is published

## Step 6: Click on "fleet-events" Channel
This will open real-time monitoring for that channel

## Step 7: View Live Messages
You should now see:
- **Live event stream** showing each message as it arrives
- **Message data** (JSON payload with vehicle telemetry)
- **Message count** (total messages published)
- **Throughput** (messages per second)

### Example Message You'll See:
```json
{
  "event_id": "evt_trip-1_0_1699858500000",
  "event_type": "trip_started",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "vehicle_id": "trip-1",
  "trip_id": "trip-1",
  "location": {
    "lat": 29.76,
    "lng": -95.37
  },
  "speed_kmh": 0,
  "fuel_level": 85,
  "event_description": "trip started"
}
```

## Step 8: Monitor Key Metrics

### In the Channels list:
- 🟢 **Green dot** = Active channel (receiving messages)
- **Message count** = Total events published to this channel
- **Subscribers** = How many clients are connected

### For "fleet-events" specifically:
- Shows all 74,261 events from your 15 trips streaming through
- Shows connection count (usually 1 = your browser dashboard)

---

## Real-Time Dashboard Features

### 1. **Live Event Feed**
- Automatically updates as events are published
- Shows newest messages first
- Each message shows timestamp and size

### 2. **Throughput Graph**
- Shows **messages/sec** over time
- Peak should be around 200-1000 msg/sec when you run the publisher

### 3. **Presence (Optional)**
- Shows how many clients are connected
- Useful for monitoring dashboard viewers

### 4. **History**
- Ably stores messages briefly (check your retention settings)
- Can replay recent events for new subscribers

---

## Testing Workflow

### Terminal 1: Start Dev Server
```powershell
npm run dev
```

### Terminal 2: Publish Events to Ably
```powershell
$env:ABLY_API_KEY = "_XTIEA.jVt_cw:..."
node .\scripts\publish-ably.js
```

### Terminal 3: Watch in Ably Dashboard
1. Go to https://dashboard.ably.com
2. Click **Channels** → **fleet-events**
3. Watch the **live message stream** update in real-time
4. You'll see:
   - Trip start events
   - Location updates (thousands of them)
   - Fuel alerts
   - Trip end events

### Terminal 4: Open FleetView Dashboard
```
http://localhost:9002
```
- Select "Ably" provider in header
- Vehicles will update on map as events stream in from Ably

---

## Key Metrics to Monitor in Ably UI

| Metric | Expected Value | What It Means |
|--------|-----------------|--------------|
| **Total Messages** | 74,261 | All events from 15 trips |
| **Msg/sec (Peak)** | 500-1000 | Publishing rate |
| **Subscribers** | 1+ | Browser dashboards connected |
| **Channel Status** | 🟢 Active | Events flowing normally |

---

## Advanced: Ably Console Features

### 1. **Message Inspector**
- Click any message to see full JSON
- Copy message for debugging

### 2. **Pub/Sub Patterns**
- Filter messages by pattern (e.g., `trip-*` to see only specific trips)
- Useful for testing channel wildcards

### 3. **Connection History**
- See who connected/disconnected
- View connection duration

### 4. **Rate Limiting**
- Shows if you've hit any rate limits
- Useful for scaling testing

---

## Troubleshooting

### Problem: No messages appearing in Ably dashboard
**Solution:**
1. Verify API key is correct (set in `.env.local`)
2. Check publisher script ran without errors
3. Refresh the Ably dashboard page
4. Check if channel name matches exactly: `fleet-events`

### Problem: Messages appear in Ably but not in FleetView dashboard
**Solution:**
1. Check browser console (F12) for errors
2. Verify "Ably" provider is selected in dashboard header
3. Check `/api/ably-token` returns valid tokenRequest (test in DevTools Network tab)
4. Clear browser cache and hard refresh

### Problem: High message latency
**Solution:**
1. Check your internet connection
2. Verify Ably account isn't rate-limited
3. Reduce `maxEvents` in trip-config.json to publish fewer messages

---

## Next Steps in Ably UI

Once you see the data flowing:
1. **Monitor dashboard:** Watch vehicles update on the map in real-time
2. **Check metrics:** See throughput and subscriber count in Ably
3. **Test scaling:** Publish to multiple channels or increase message rate
4. **Set up analytics:** Ably provides usage dashboard for tracking costs

---

## Links
- Ably Dashboard: https://dashboard.ably.com
- Ably Docs: https://www.ably.com/documentation
- Channel Features: https://www.ably.com/documentation/realtime/channels
