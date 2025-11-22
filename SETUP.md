# Mealprep Agent - Setup & Running Instructions

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/mel/Documents/mealprep-agent/mealprep-agent
npm install
cd ui && npm install && cd ..
```

### 2. Seed the Database (First Time Only)
```bash
node scripts/seed_db.js
```

### 3. Start All Backend Services
```bash
./scripts/start_all.sh
```

This will start all 6 backend services:
- **User Profile Tool** (port 3000)
- **Recipe Tool** (port 3001)
- **Shopping List Tool** (port 3002)
- **Metrics Tool** (port 3003)
- **Logger Tool** (port 3004)
- **Main Agent** (port 4000)

### 4. Start the Frontend UI
```bash
cd ui
npm run dev
```

The UI will be available at: **http://localhost:5173**

---

## Testing

### Manual Test via UI
1. Open http://localhost:5173 in your browser
2. Enter your preferences (allergies, dislikes, diet)
3. Click "Generate Week Plan"
4. View your personalized meal plan

### Automated Test
```bash
node scripts/test_flow.js
```

---

## Managing Services

### View All Logs
```bash
tail -f logs/*.log
```

### Stop All Services
```bash
./scripts/stop_all.sh
```

### Check Service Status
```bash
# Check if ports are in use
lsof -i :3000,3001,3002,3003,3004,4000
```

---

## Troubleshooting

### "Failed to fetch" Error in UI
1. Make sure all backend services are running:
   ```bash
   curl http://localhost:3000/profile/melani-123
   curl http://localhost:4000/session/melani-123
   ```

2. If services aren't running, restart them:
   ```bash
   ./scripts/stop_all.sh
   ./scripts/start_all.sh
   ```

### CORS Issues
CORS is enabled on all backend services. If you still see CORS errors, check that the `cors` package is installed:
```bash
npm list cors
```

### Port Already in Use
Kill existing processes on the ports:
```bash
lsof -ti:3000,3001,3002,3003,3004,4000 | xargs kill -9
```

---

## Architecture

```
┌─────────────────┐
│   Frontend UI   │  (React + Vite, port 5173)
│  (User Input)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Main Agent     │  (port 4000)
│  (Orchestrator) │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┬──────────┐
    ▼         ▼         ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Profile │ │Recipe  │ │Shopping│ │Metrics │ │Logger  │
│Tool    │ │Tool    │ │Tool    │ │Tool    │ │Tool    │
│(3000)  │ │(3001)  │ │(3002)  │ │(3003)  │ │(3004)  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

---

## Adding Custom Allergies/Dislikes

The UI now supports:
- **Predefined allergies**: Click to select from common allergens
- **Custom allergies**: Enter any custom allergy and click "Add"
- **Predefined dislikes**: Click to select from common ingredients
- **Custom dislikes**: Enter any food you dislike and click "Add"

All preferences are saved to your user profile and used when generating meal plans.

---

## Next Steps

- [ ] Wire LLM agents (recipe_generator.py, meal_planner.py, feedback_compactor.py)
- [ ] Add Google Sheets integration for shopping lists
- [ ] Implement advanced filtering and personalization
- [ ] Add nutrition information display

