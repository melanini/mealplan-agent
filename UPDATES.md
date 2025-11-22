# Latest Updates - Two Meals Per Day

## 🍽️ Feature: Lunch + Dinner Meal Planning

### Overview
The Mealprep Agent now generates **two meal suggestions per day** instead of just dinner:
- 🌤️ **Lunch**: Lighter meal option
- 🌙 **Dinner**: Evening meal option

This gives you **14 recipes per week** (2 meals × 7 days) for complete meal planning.

---

## 📋 What Changed

### Backend (`agent/index.js`)
**Meal Selection Logic:**
- Now selects **2 recipes per day** (lunch and dinner)
- Ensures **variety** by tracking both meals when selecting
- Lunch and dinner are different recipes for the same day
- Both meals respect user preferences (allergies, dietary style, cook time)

**Data Structure:**
```javascript
// Before: Only dinner
{
  day: "Monday",
  dinner: { id, title, cookTimeMins, servings }
}

// After: Lunch + Dinner
{
  day: "Monday",
  lunch: { id, title, cookTimeMins, servings },
  dinner: { id, title, cookTimeMins, servings }
}
```

**Shopping List:**
- Automatically includes ingredients from **all 14 recipes**
- No additional changes needed - already aggregates by recipe IDs

---

### Frontend (`ui/src/PlanView.jsx`)
**Visual Layout:**
- Each day card now contains **two meal sections**
- Clear labels: 🌤️ Lunch and 🌙 Dinner
- Each meal is independently **clickable** to view details
- Separate **Replace** and **Feedback** buttons for each meal

**User Interactions:**
- Click on any recipe card → View full recipe details
- Provide feedback independently for lunch and dinner
- Replace individual meals without affecting the other

---

### Styling (`ui/src/PlanView.css`)
**New Styles:**
- `.meal-section`: Container for each meal with subtle background
- **Color-coded borders**: Orange for lunch, purple for dinner
- Improved spacing and visual hierarchy
- Smooth hover transitions
- Responsive layout that works on all devices

**Visual Enhancements:**
- Cards have subtle backgrounds to separate meals
- Hover effects on meal sections
- Better organized button layout
- Consistent spacing throughout

---

## 🎨 Design Features

### Color Coding
- **Lunch** (🌤️): Orange accent (`#ffa726`)
- **Dinner** (🌙): Purple accent (`#5c6bc0`)

### Layout
- Day cards are taller to accommodate two meals
- Each meal section is visually distinct but cohesive
- Clean separation between lunch and dinner
- Consistent spacing and padding

### Interactions
- Click any meal title/info to view recipe
- Independent feedback for each meal
- Replace button for each meal separately
- Smooth animations and transitions

---

## 📊 Impact

### Recipe Count
- **Before**: 7 recipes/week (1 per day)
- **After**: 14 recipes/week (2 per day)
- **Shopping List**: Now includes ingredients from all 14 recipes

### User Benefits
1. **Complete Meal Planning**: Both lunch and dinner covered
2. **More Variety**: 14 different recipes per week
3. **Better Planning**: See full day's meals at a glance
4. **Independent Control**: Manage lunch and dinner separately
5. **Comprehensive Shopping**: One list for all meals

---

## 🚀 How to Use

1. **Generate a New Plan**:
   ```
   - Go to http://localhost:5173
   - Enter your preferences
   - Click "Generate Week Plan"
   ```

2. **View the Two-Meal Layout**:
   - Each day now shows lunch and dinner
   - Colored borders distinguish the meals
   - Click on any recipe to see details

3. **Manage Each Meal**:
   - Provide feedback independently
   - Replace lunch or dinner separately
   - View full recipes by clicking cards

4. **Shopping List**:
   - Automatically includes all 14 meals
   - Organized by ingredient
   - Shows quantities needed

---

## 🧪 Testing

**To test the new feature:**
1. Make sure all services are running:
   ```bash
   cd /Users/mel/Documents/mealprep-agent/mealprep-agent
   ./scripts/start_all.sh
   ```

2. Open the UI:
   ```
   http://localhost:5173
   ```

3. Generate a new meal plan

4. Observe:
   - ✅ Each day has 2 meals (lunch + dinner)
   - ✅ Both meals are clickable
   - ✅ Color-coded borders
   - ✅ Independent feedback buttons
   - ✅ Shopping list includes all meals

---

## 🔄 Backward Compatibility

**Note**: Old plans generated before this update will only have `dinner` data and may not display correctly. Generate a new plan to see the two-meal layout.

---

## 💡 Future Enhancements

Potential improvements:
- [ ] Add breakfast option (3 meals/day)
- [ ] Allow users to toggle lunch on/off
- [ ] Different max cook times for lunch vs dinner
- [ ] Meal prep suggestions (cook once, eat twice)
- [ ] Leftover planning across days

---

## 📝 Summary

✅ **Completed:**
- Backend generates 2 recipes per day
- Frontend displays lunch and dinner separately
- Styled two-meal layout with color coding
- Shopping list includes both meals
- All services restarted and tested

🎯 **Result:** A complete meal planning system covering both lunch and dinner for the entire week!

