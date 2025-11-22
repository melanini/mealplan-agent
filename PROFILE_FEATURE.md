# Profile Feature Documentation

## 🎯 Overview

The **Profile** feature provides users with a centralized location to manage their meal plan preferences, view activity logs, and enable automatic weekly plan generation.

---

## ✨ Key Features

### ⚙️ Settings Management
- **Dietary Style**: Choose from 9 dietary preferences
- **Servings**: Configure meal sizes (1-6 servings)
- **Max Cook Time**: Set maximum cooking time (10-120 minutes)
- **Allergies & Intolerances**: Select or add custom allergens
- **Food Dislikes**: Manage ingredients you don't like
- **Save Preferences**: One-click save for all settings

### 📋 Activity Logs
- View system activity in real-time
- Filter by log level (info, warning, error)
- Timestamped entries
- Refresh on demand
- Color-coded by severity

### 📅 Auto-Generate
- Enable automatic weekly plan creation
- Choose day of week for generation
- Uses saved preferences
- Set-and-forget convenience

---

## 🏗️ Architecture

### Frontend Component

**File**: `ui/src/Profile.jsx`

**Props:**
- `userId`: User identifier
- `addLog`: Logging callback function

**State Management:**
- Form fields for all preferences
- Two-tab interface (Settings / Logs)
- Loading and saving states
- Real-time log updates

### Backend Integration

**Endpoints Used:**
1. `GET /profile/:userId` - Load user profile
2. `PATCH /profile/:userId` - Save preferences
3. `GET /logs?limit=50` - Fetch activity logs

---

## 🎨 User Interface

### Tab Structure

```
┌──────────────────────────────────────┐
│ 👤 Profile Settings                  │
│ User: melani-123                      │
├──────────────────────────────────────┤
│ [⚙️ Settings] [📋 Activity Logs]    │
├──────────────────────────────────────┤
│                                       │
│ Content Area                          │
│                                       │
└──────────────────────────────────────┘
```

### Settings Tab

**Meal Plan Preferences:**
- Dietary Style dropdown
- Servings selector  
- Max cook time input

**Allergies & Intolerances:**
- 9 predefined pills (including Fish & Seafood)
- Custom input field
- Selected items display
- One-click remove

**Food Dislikes:**
- 12 predefined pills (including Fish & Seafood)
- Custom input field
- Selected items display
- One-click remove

**Automatic Plan Generation:**
- Toggle switch (Enabled/Disabled)
- Day selector (when enabled)
- Info box with description
- Visual feedback

**Save Button:**
- Gradient purple design
- Loading state
- Success feedback

### Logs Tab

**Features:**
- Refresh button
- Scrollable log list
- Color-coded entries
- Timestamp display
- Log level badges
- Hover effects

---

## 📊 Data Structure

### Profile Preferences

```json
{
  "id": "melani-123",
  "name": "Melani Ortega",
  "email": "melani@example.com",
  "preferences": {
    "dietary": ["vegetarian"],
    "avoidIngredients": ["gluten", "lactose", "fish & seafood"],
    "dislikes": ["mushrooms", "olives"],
    "servings": 2,
    "maxCookMins": 30,
    "autoGenerate": true,
    "generateDay": "Sunday"
  }
}
```

### Activity Logs

```json
{
  "total": 50,
  "logs": [
    {
      "timestamp": "2025-11-22T17:30:00Z",
      "level": "info",
      "message": "Profile loaded successfully",
      "context": {}
    }
  ]
}
```

---

## 🎯 User Flow

### Viewing/Editing Settings

1. **Navigate to Profile**
   - Click "👤 Profile" in navigation

2. **View Current Settings**
   - All preferences loaded automatically
   - Pre-populated form fields

3. **Modify Preferences**
   - Change any settings
   - Add/remove allergies
   - Add/remove dislikes
   - Toggle auto-generate

4. **Save Changes**
   - Click "💾 Save Preferences"
   - Success confirmation
   - Settings persisted

### Viewing Logs

1. **Switch to Logs Tab**
   - Click "📋 Activity Logs"

2. **Browse Activity**
   - Scroll through recent logs
   - See timestamps and levels
   - Identify errors/warnings

3. **Refresh Logs**
   - Click "🔄 Refresh"
   - Fetch latest entries

### Enabling Auto-Generate

1. **Enable Toggle**
   - Click toggle switch

2. **Select Day**
   - Choose weekday for generation

3. **Save Settings**
   - Preferences saved
   - Auto-generation enabled

---

## 🆕 New Additions

### Fish & Seafood Option

**Added to:**
- ✅ Allergies & Intolerances (Profile)
- ✅ Food Dislikes (Profile)
- ✅ Allergies & Intolerances (Home)
- ✅ Food Dislikes (Home)

**Benefits:**
- Common allergen coverage
- Dietary restriction support
- Recipe filtering accuracy

---

## 🎨 Styling Features

### Color Scheme
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Success**: Green (#4caf50)
- **Info**: Blue (#2196f3)
- **Warning**: Orange (#ff9800)
- **Error**: Red (#f44336)

### Interactive Elements
- **Pills**: 2px border, 20px radius, hover effects
- **Toggle**: Smooth slide animation
- **Buttons**: Transform on hover
- **Inputs**: Focus rings with brand color
- **Tabs**: Bottom border highlight

### Visual Feedback
- Loading spinners
- Disabled states
- Hover animations
- Color transitions
- Box shadows

---

## 🔧 Technical Details

### State Management

```javascript
// Form State
const [diet, setDiet] = useState('');
const [intolerances, setIntolerances] = useState([]);
const [dislikes, setDislikes] = useState([]);
const [servings, setServings] = useState('2');
const [maxCookMins, setMaxCookMins] = useState('30');
const [autoGenerate, setAutoGenerate] = useState(false);
const [generateDay, setGenerateDay] = useState('Sunday');
```

### API Calls

**Load Profile:**
```javascript
const response = await fetch(`${PROFILE_URL}/profile/${userId}`);
const data = await response.json();
// Populate form fields
```

**Save Profile:**
```javascript
await fetch(`${PROFILE_URL}/profile/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ preferences })
});
```

**Load Logs:**
```javascript
const response = await fetch(`${LOGGER_URL}/logs?limit=50`);
const data = await response.json();
setLogs(data.logs);
```

---

## 📱 Responsive Design

### Desktop (>768px)
- Two-column grid for settings
- Full-width pills
- Side-by-side tabs

### Mobile (<768px)
- Single-column layout
- Stacked settings
- Full-width buttons
- Scrollable logs

---

## 🚀 Use Cases

### 1. Set Dietary Restrictions
**Scenario:** User has celiac disease and fish allergy

**Steps:**
1. Navigate to Profile
2. Select "Gluten" pill
3. Select "Fish & Seafood" pill
4. Click "Save Preferences"

**Result:** All recipes will exclude gluten and seafood

### 2. Configure Auto-Generation
**Scenario:** User wants automatic Sunday meal plans

**Steps:**
1. Go to Profile → Settings
2. Toggle "Auto-Generate" ON
3. Select "Sunday" from dropdown
4. Save preferences

**Result:** New plan generated every Sunday automatically

### 3. Review Activity
**Scenario:** User wants to see recent system events

**Steps:**
1. Navigate to Profile
2. Click "Activity Logs" tab
3. Scroll through entries
4. Click "Refresh" for updates

**Result:** View all recent system activity

### 4. Add Custom Restrictions
**Scenario:** User dislikes cilantro (not in preset list)

**Steps:**
1. Go to Profile → Food Dislikes
2. Type "Cilantro" in custom input
3. Click "Add"
4. Save preferences

**Result:** Cilantro added to dislikes, used in filtering

---

## 💾 Data Persistence

### Storage Location
- **Profile**: `data/users/db.json` (via userProfileTool)
- **Logs**: `data/logs/events.json` (via loggerTool)

### Update Strategy
- **On Save**: Full preference object replaced
- **On Load**: Merge with defaults if missing
- **Auto-Generate**: Stored with preferences

---

## 🎯 Integration Points

### With Home View
- Preferences can be set in Profile or Home
- Changes sync to profile automatically
- Home view uses profile defaults

### With Plan Generation
- Preferences used in `POST /plan/generate`
- Filters recipes by restrictions
- Respects cook time limits

### With Auto-Generation
- Scheduler checks `autoGenerate` flag
- Uses saved preferences
- Generates on specified day

---

## 🔮 Future Enhancements

### Advanced Settings
- [ ] Portion size preferences
- [ ] Cuisine preferences (Italian, Asian, etc.)
- [ ] Meal prep day selection
- [ ] Budget constraints
- [ ] Calorie targets

### Smart Features
- [ ] Recipe recommendation history
- [ ] Preference learning from ratings
- [ ] Seasonal ingredient preferences
- [ ] Cooking skill level
- [ ] Kitchen equipment available

### Social Features
- [ ] Share profile settings
- [ ] Import preferences from friends
- [ ] Community dietary templates
- [ ] Nutritionist recommendations

---

## 🎨 Component Breakdown

### ProfileComponent
- **Parent**: App.jsx
- **Children**: None (self-contained)
- **Services**: userProfileTool, loggerTool
- **State**: Local form state
- **Effects**: Load on mount, refresh logs

### Key Functions

**loadProfile()**
- Fetches user profile
- Populates form fields
- Handles loading states

**saveProfile()**
- Validates inputs
- Sends PATCH request
- Shows success/error feedback

**loadLogs()**
- Fetches activity logs
- Updates logs state
- Handles pagination

---

## 📊 Settings Options

### Dietary Styles
1. Any (no restriction)
2. Classic
3. Low Carb
4. Keto
5. Flexitarian
6. Paleo
7. Vegetarian
8. Pescetarian
9. Vegan

### Allergies (9 options)
- Gluten
- Peanut
- Tree Nut
- Soy
- Sesame
- Mustard
- Sulfite
- Nightshade
- **Fish & Seafood** ✨ NEW

### Dislikes (12 options)
- Avocado
- Beets
- Bell Peppers
- Brussels Sprouts
- Cauliflower
- Eggplant
- Mushrooms
- Olives
- Quinoa
- Tofu
- Turnips
- **Fish & Seafood** ✨ NEW

### Auto-Generate Days
- Sunday
- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday

---

## ✅ Summary

The Profile feature provides:

**Key Benefits:**
- ✅ Centralized preference management
- ✅ Real-time activity monitoring
- ✅ Automatic plan generation
- ✅ Persistent settings
- ✅ Custom restrictions support
- ✅ Fish & Seafood option added
- ✅ Beautiful, responsive UI

**Technical Highlights:**
- 🎯 Clean component architecture
- 💾 Persistent storage
- 🔄 Real-time updates
- 🎨 Modern design
- 📱 Mobile responsive
- ⚡ Fast loading

**Ready to use at http://localhost:5173** 🎉

Navigate to "👤 Profile" to manage all your settings!

