# Mealprep Agent UI

React + Vite UI for the Mealprep Agent system.

## Features

- User profile setup (diet, allergies, dislikes, servings)
- Weekly meal plan generation
- Recipe feedback (accept/reject with reasons)
- Shopping list display
- Real-time logs panel for observability

## Setup

```bash
npm install
npm run dev
```

The app will run on http://localhost:5173

## Backend Requirements

Ensure the following services are running:

- Agent (port 4000): `node agent/index.js`
- User Profile Tool (port 3000): `node tools/userProfileTool/index.js`
- Recipe Tool (port 3001): `node tools/recipeTool/index.js`
- Shopping Tool (port 3002): `node tools/shoppingListTool/index.js`
- Metrics Tool (port 3003): `node tools/metricsTool/index.js` (optional)

## Usage

1. Enter your user ID (default: melani-123)
2. Select your diet, allergies, dislikes, and serving size
3. Click "Generate Week Plan"
4. View your weekly meal plan
5. Provide feedback on recipes (accept/reject)
6. View shopping list
7. Monitor activity in the logs panel
