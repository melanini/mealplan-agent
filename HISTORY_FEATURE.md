# History & Rating Feature

## 🎯 Overview

The **History & Rating** feature allows users to view all their past meal plans, see ratings for recipes they've tried, and easily access historical plans.

---

## ✨ Key Features

### 📅 Meal Plan History
- View all past meal plans in chronological order
- See week dates and creation times
- Quick stats: recipe count, average rating, feedback count
- Expandable cards to see full weekly details
- One-click access to view complete plans

### ⭐ Recipe Rating System
- Rate recipes 1-5 stars
- Ratings saved with each recipe feedback
- Average ratings displayed in history
- Star visualization (★★★★★)
- Tracks rating timestamps

### 🎨 Beautiful UI
- Card-based history view
- Color-coded meal sections (lunch/dinner)
- Smooth animations and transitions
- Responsive design for all devices
- Loading states and error handling

---

## 🏗️ Architecture

### Backend Endpoints

#### 1. **GET `/history/:userId`**
Retrieves all meal plans for a user with ratings

**Query Parameters:**
- `limit` (optional): Number of plans to return (default: 10)

**Response:**
```json
{
  "userId": "melani-123",
  "plans": [
    {
      "planId": "plan_xxx",
      "weekStart": "2025-11-18",
      "createdAt": "2025-11-18T10:00:00Z",
      "recipeCount": 14,
      "feedbackCount": 5,
      "ratings": {
        "r_001": 5,
        "r_002": 4
      },
      "averageRating": 4.5,
      "ratedCount": 2,
      "lastModified": "2025-11-18T12:30:00Z"
    }
  ],
  "total": 5
}
```

#### 2. **POST `/plan/:planId/recipe/:recipeId/rating`**
Save a star rating for a specific recipe

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Delicious and easy to make!"
}
```

**Response:**
```json
{
  "success": true,
  "planId": "plan_xxx",
  "recipeId": "r_001",
  "rating": {
    "rating": 5,
    "comment": "Delicious and easy to make!",
    "ratedAt": "2025-11-22T17:30:00Z"
  }
}
```

---

## 🎨 Frontend Components

### History Component (`ui/src/History.jsx`)

**Features:**
- Fetches user's plan history
- Expandable plan cards
- View button to load full plan
- Displays ratings with stars
- Shows meal summaries
- Replacement history

**Props:**
- `userId`: User identifier
- `onViewPlan`: Callback to view full plan
- `addLog`: Logging function

### Enhanced PlanView (`ui/src/PlanView.jsx`)

**New Features:**
- Star rating UI in feedback modal
- Interactive star selection (click to rate)
- Hover preview
- Rating submission along with feedback
- Rating display in history

### App Navigation (`ui/src/App.jsx`)

**Views:**
- **Home**: Generate new meal plans
- **History**: View past plans and ratings
- **Plan**: View current/historical plan details

---

## 🎯 User Flow

### Viewing History

1. **Navigate to History**
   - Click "📅 History" in navigation

2. **Browse Plans**
   - Scroll through past meal plans
   - See quick stats for each week

3. **Expand Plan Details**
   - Click on any plan card
   - View all meals for the week
   - See which recipes were rated

4. **View Full Plan**
   - Click "📖 View Full Plan"
   - Navigate to complete plan view
   - Access all recipes and shopping list

### Rating Recipes

1. **Provide Feedback**
   - Click "Feedback" on any meal
   - Click stars to rate (1-5)
   - Optionally add written feedback
   - Submit rating

2. **Ratings Saved**
   - Rating stored with recipe
   - Visible in history view
   - Used for future recommendations

---

## 💾 Data Storage

### Plan Files
Location: `data/plans/<planId>.json`

**Structure:**
```json
{
  "planId": "plan_xxx",
  "userId": "melani-123",
  "weekStart": "2025-11-18",
  "createdAt": "2025-11-18T10:00:00Z",
  "weekPlan": [...],
  "shoppingList": [...],
  "feedback": {
    "r_001": {
      "accepted": true,
      "rating": 5,
      "comment": "Great recipe!",
      "ratedAt": "2025-11-18T12:00:00Z"
    }
  },
  "replacements": [],
  "metadata": {
    "recipesUsed": [...],
    "totalItems": 42,
    "lastModified": "2025-11-18T12:30:00Z"
  }
}
```

---

## 🎨 UI Design

### History Card States

**Collapsed:**
```
┌─────────────────────────────────────────┐
│ Week of Nov 18, 2025     2 days ago     │
│                                          │
│ 🍽️ 14    ⭐ 4.5    💬 5                │
│   recipes  avg rating  feedback          │
│                                      ▶  │
└─────────────────────────────────────────┘
```

**Expanded:**
```
┌──────────────────────────────────────────────┐
│ Week of Nov 18, 2025     2 days ago          │
│                                               │
│ 🍽️ 14    ⭐ 4.5    💬  5                     │
│   recipes  avg rating  feedback               │
│                                           ▼  │
├───────────────────────────────────────────────┤
│ [📖 View Full Plan]                          │
│                                               │
│ ┌─────────┬─────────┬─────────┬─────────┐  │
│ │ Monday  │ Tuesday │ Wednesday│...      │  │
│ │🌤️ Lunch │🌤️ Lunch │🌤️ Lunch  │         │  │
│ │ Recipe  │ Recipe  │ Recipe   │         │  │
│ │ ★★★★★   │         │ ★★★☆☆    │         │  │
│ │         │         │          │         │  │
│ │🌙 Dinner│🌙 Dinner│🌙 Dinner │         │  │
│ │ Recipe  │ Recipe  │ Recipe   │         │  │
│ │ ★★★★☆   │ ★★★★★   │          │         │  │
│ └─────────┴─────────┴─────────┴─────────┘  │
│                                               │
│ 🔄 Replacements (2)                          │
│ • Monday dinner: Old → New                   │
│ • Tuesday lunch: Old → New                   │
└───────────────────────────────────────────────┘
```

### Rating UI

**Feedback Modal with Rating:**
```
┌──────────────────────────────────┐
│ Feedback for Mediterranean Bowl  │
│                                   │
│ Rate this recipe:                 │
│ ★★★★☆  (4/5 stars)               │
│                                   │
│ ┌─────────────────────────────┐  │
│ │ Comments...                 │  │
│ └─────────────────────────────┘  │
│                                   │
│ [👍 Accept] [👎 Reject] [Cancel] │
└──────────────────────────────────┘
```

---

## 📊 Statistics Calculated

### Per Plan
- **Recipe Count**: Total meals (lunch + dinner × 7)
- **Feedback Count**: Number of recipes with feedback
- **Rated Count**: Number of recipes with star ratings
- **Average Rating**: Mean of all ratings (1-5 scale)
- **Last Modified**: Most recent update timestamp

### Display Format
- Ratings: ★★★★★ (visual stars)
- Average: 4.5 (one decimal)
- Counts: Integer values
- Dates: "Nov 18, 2025"
- Time Since: "2 days ago"

---

## 🔧 Integration Points

### With Feedback System
- Ratings submitted along with feedback
- Stored in same feedback object
- Accept/Reject + Rating in one flow

### With Plan View
- History can load any past plan
- Full navigation back to plan details
- Seamless transition between views

### With User Profile
- Future: Use ratings for recommendations
- Track preferences over time
- Identify favorite recipes

---

## 🚀 Usage

### View History
```javascript
// Navigate to history
http://localhost:5173
Click "📅 History"
```

### Rate a Recipe
```javascript
// From plan view
Click "Feedback" on any meal
Click stars to rate (1-5)
Add optional comment
Click "👍 Accept" or "👎 Reject"
```

### View Past Plan
```javascript
// From history
Click any plan card to expand
Click "📖 View Full Plan"
Full plan loads with all details
```

---

## 🎯 Future Enhancements

### Analytics
- [ ] Rating trends over time
- [ ] Most/least favorite recipes
- [ ] Cooking frequency stats
- [ ] Dietary compliance tracking

### Smart Features
- [ ] Suggest recipes based on high ratings
- [ ] Avoid recipes with low ratings
- [ ] Reuse highly-rated plans
- [ ] Export history as PDF

### Social Features
- [ ] Share favorite plans
- [ ] Compare ratings with others
- [ ] Recipe recommendations from community
- [ ] Collaborative meal planning

---

## 📝 API Examples

### Fetch History
```bash
curl http://localhost:4000/history/melani-123?limit=5
```

### Submit Rating
```bash
curl -X POST http://localhost:4000/plan/plan_xxx/recipe/r_001/rating \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Absolutely delicious!"
  }'
```

---

## 🎨 Styling Classes

### History Component
- `.history-container`: Main wrapper
- `.history-card`: Individual plan card
- `.history-card.expanded`: Expanded state
- `.stat`: Statistic display
- `.meals-grid`: Day summaries grid
- `.day-summary`: Single day container
- `.meal-rating`: Star display

### Rating System
- `.rating-section`: Rating UI wrapper
- `.star-rating`: Stars container
- `.star`: Individual star
- `.star.filled`: Filled star (rated)

---

## ✅ Summary

The History & Rating feature provides a comprehensive view of users' meal planning journey:

**Benefits:**
- ✅ Track meal plan history
- ✅ Rate and remember favorite recipes
- ✅ Review past plans anytime
- ✅ Learn from cooking experience
- ✅ Make better food choices over time

**Technical Highlights:**
- 🎯 Clean REST API design
- 🎨 Beautiful, responsive UI
- 💾 Persistent storage
- ⚡ Fast loading with pagination
- 🛡️ Error handling throughout

**Ready to use at http://localhost:5173!** 🎉

Navigate between Home and History to explore all features.

