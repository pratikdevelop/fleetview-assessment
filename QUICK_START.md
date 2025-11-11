# FleetView - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Option 1: Run Locally (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# Visit: http://localhost:9002
```

### Option 2: Deploy to Vercel (Production)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Visit your live dashboard
# URL will be shown after deployment
```

---

## 📖 Essential Files to Read

**Start here, in this order:**

1. **This file** (Quick Start Guide) - 2 min read
2. **README.md** - 10 min read - Project overview and features
3. **ASSESSMENT_SUMMARY.md** - 5 min read - What was built
4. **IMPLEMENTATION_COMPLETE.md** - 5 min read - Technical details

**Then:**
- **DEPLOYMENT_GUIDE.md** - For hosting instructions
- **FLEET_TRACKING_EVENTS.md** - For data reference

---

## 🎮 Using the Dashboard

### Starting the Simulation
1. Click the **▶ Play** button in the top right
2. Select a **speed** (1x, 5x, 10x, 50x, 100x)
3. Watch vehicles move in real-time!

### Controls
- **▶ Play** - Start simulation
- **⏸ Pause** - Pause simulation  
- **↻ Reset** - Clear and restart
- **Speed** - Adjust playback speed

### What You'll See
- **Map**: Vehicle positions (colored pins)
- **Trip Cards**: Live metrics for each trip
- **Fleet Overview**: Fleet statistics
- **Driver Performance**: Safety rankings
- **Alerts**: Real-time issues and warnings

---

## 📊 Dashboard Sections

### Top Section: Interactive Map
- Shows current vehicle locations
- Color-coded by trip
- Hover for driver info

### Middle Section: Trip Cards
- Individual trip progress
- Speed and fuel levels
- Recent alerts
- Current status

### Right Sidebar: Analytics
- Fleet overview stats
- Alert history chart
- Driver performance ranking
- Severity distribution

---

## 🌟 Key Features

✅ **Real-Time Tracking** - Live vehicle movement on map
✅ **5 Concurrent Trips** - Multiple simultaneous deliveries
✅ **13,600+ Events** - Realistic driving data
✅ **Performance Ranking** - Driver safety scores
✅ **Alert Management** - Real-time incident tracking
✅ **AI Insights** - Smart alert summarization
✅ **Responsive Design** - Works on all devices
✅ **Variable Speed** - 1x to 100x playback

---

## 🛠️ Technical Stack

- **Framework**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **UI**: Radix UI Components
- **Charts**: Recharts
- **AI**: Google Genkit
- **Icons**: Lucide React

---

## 📱 Device Support

- ✅ Desktop (1920px and above)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px and above)
- ✅ Landscape and portrait modes

---

## 🚢 Deployment Options

### Recommended: Vercel
- Easiest setup
- Auto-deploys from Git
- Live in < 5 minutes

### Also Supported:
- Docker
- AWS
- Google Cloud
- Azure
- Railway
- Render

See `DEPLOYMENT_GUIDE.md` for details.

---

## ❓ FAQ

### Q: Where are the routes?
**A:** Realistic USA routes:
- Cross-country: LA → NY
- Urban: SF suburbs
- Mountain: Denver → Aspen
- Tech issues: Dallas → Houston
- Logistics: Atlanta → Nashville

### Q: What happens when I click Play?
**A:** Simulation starts from first event, vehicles move in real-time, metrics update, alerts appear as events occur.

### Q: Can I change the speed?
**A:** Yes! 1x, 5x, 10x, 50x, or 100x. Higher speed = faster simulation.

### Q: What if I want to start over?
**A:** Click the Reset button to clear all data and restart.

### Q: Can I see AI insights?
**A:** Click "AI Summary" button to get intelligent alert analysis powered by Google Gemini.

### Q: How many events are there?
**A:** 13,600+ realistic fleet events across 5 trips - enough to simulate ~50 hours of driving.

---

## 🔧 Troubleshooting

### Dashboard won't load
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Port already in use
```bash
# Use different port
PORT=3001 npm run dev
```

### TypeScript errors
```bash
# Check types
npm run typecheck
```

### Build errors
```bash
# Clean and rebuild
rm -rf .next
npm run build
```

---

## 📚 Learn More

- **README.md** - Complete feature documentation
- **DEPLOYMENT_GUIDE.md** - Host your own version
- **FLEET_TRACKING_EVENTS.md** - Event types reference
- **ASSESSMENT_SUMMARY.md** - Technical architecture
- **IMPLEMENTATION_COMPLETE.md** - Full project details

---

## 🎯 Next Steps

1. **Try It Locally**
   ```bash
   npm install && npm run dev
   ```

2. **Deploy to Vercel**
   ```bash
   npm i -g vercel && vercel
   ```

3. **Share the URL**
   - Get your live dashboard URL
   - Share with team/evaluators

4. **Explore Features**
   - Play with different speeds
   - Check out AI summary
   - View driver rankings

---

## 🎉 You're Ready!

Your FleetView dashboard is set up and ready to use. Start the simulation and watch your fleet in action!

**Questions?** Check the documentation files or review the code comments.

**Enjoy!** 🚀

---

**FleetView** - Real-Time Fleet Tracking Dashboard  
*Built for excellence*
