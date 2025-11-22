# Recipe Replace Feature

## 🔄 Overview

The **Replace** feature allows users to swap out any meal they don't like with a different recipe from the available pool. Each lunch and dinner can be replaced independently.

---

## ✨ How It Works

### User Experience

1. **Click "Replace" button** on any meal (lunch or dinner)
2. **System finds alternative recipe** that:
   - Matches your dietary preferences
   - Respects your allergies/intolerances
   - Avoids duplicates in the current plan
   - Different from the current recipe
3. **Plan updates instantly** with new recipe
4. **Shopping list recalculates** automatically
5. **Success message** shows in logs

### Visual Feedback

- **Button shows "⏳ Replacing..."** while loading
- **Button is disabled** during replacement
- **Success message** appears in logs panel
- **Recipe card updates** with new meal
- **Shopping list refreshes** with new ingredients

---

## 🔧 Technical Implementation

### Backend Endpoint

**POST** `/plan/:planId/replace`

**Request Body:**
```json
{
  "day": "Monday",
  "mealType": "lunch"  // or "dinner"
}
```

**Response:**
```json
{
  "success": true,
  "planId": "plan_xxx",
  "day": "Monday",
  "mealType": "lunch",
  "oldRecipe": {
    "id": "r_001",
    "title": "Old Recipe",
    "cookTimeMins": 25,
    "servings": 2
  },
  "newRecipe": {
    "id": "r_042",
    "title": "New Recipe",
    "cookTimeMins": 20,
    "servings": 2
  },
  "updatedPlan": { /* full plan object */ }
}
```

### Selection Algorithm

1. **Fetch candidate recipes** matching user preferences
2. **Get all currently used recipe IDs** in the plan
3. **Find unused recipe** from candidates
4. **Fallback**: If all recipes used, select any except current
5. **Error**: If no alternatives available, return 404

### Plan Updates

When a recipe is replaced:
- ✅ Meal updated with new recipe
- ✅ Shopping list recalculated
- ✅ Metadata updated (lastModified, recipesUsed)
- ✅ Replacement tracked in plan history
- ✅ Plan persisted to disk

### Replacement History

Each replacement is tracked:
```json
{
  "replacements": [
    {
      "day": "Monday",
      "mealType": "lunch",
      "oldRecipe": { /* recipe details */ },
      "newRecipe": { /* recipe details */ },
      "timestamp": "2025-11-22T10:30:00.000Z"
    }
  ]
}
```

---

## 🎯 Features

### Smart Selection
- **No duplicates**: Won't suggest recipes already in your plan
- **Respect preferences**: Honors dietary restrictions and allergies
- **Variety guarantee**: Different from current recipe

### Automatic Updates
- **Shopping list**: Recalculates with new ingredients
- **Plan metadata**: Updates recipe counts and timestamps
- **Session context**: Tracks replacement history

### Error Handling
- **No alternatives available**: Clear error message
- **Plan not found**: Returns 404
- **Invalid parameters**: Validates day and mealType
- **Network errors**: Caught and logged in UI

---

## 🎨 UI Elements

### Replace Button States

**Normal State:**
```
🔄 Replace
```

**Loading State:**
```
⏳ Replacing...
(button disabled, grayed out)
```

**After Success:**
```
🔄 Replace
(button re-enabled, ready for another replacement)
```

### Log Messages

**During replacement:**
```
[10:30:15] Replacing lunch for Monday...
```

**On success:**
```
[10:30:16] ✅ Replaced lunch with "Mediterranean Quinoa Bowl"
[10:30:16] Shopping list updated with 42 items
```

**On error:**
```
[10:30:16] ❌ Error replacing recipe: No alternative recipes found
```

---

## 📊 Use Cases

### 1. Don't Like a Suggestion
User sees a recipe they don't want to cook → Click Replace → Get new option

### 2. Too Difficult
Recipe looks complicated → Replace with simpler alternative

### 3. Missing Ingredients
Don't have key ingredient → Replace with different recipe

### 4. Variety
Want more diversity in the week → Replace similar recipes

### 5. Time Constraints
Recipe takes too long → Replace with quicker option (respects maxCookMins)

---

## 🔍 Limitations

### Current Limitations
1. **Recipe pool size**: Limited by available recipes in database
2. **No customization**: Can't specify preferred cuisine for replacement
3. **Random selection**: From available recipes (not preference-weighted)
4. **No undo**: Can't revert to previous recipe (but can replace again)

### Future Enhancements
- [ ] **Undo/History**: Revert to previous recipe
- [ ] **Smart suggestions**: AI-powered alternatives based on similarity
- [ ] **Reason-based**: "Replace with something quicker/easier/different cuisine"
- [ ] **Preview before replace**: See new recipe before confirming
- [ ] **Bulk replace**: Replace multiple meals at once
- [ ] **Preference learning**: Track which replacements are accepted

---

## 🧪 Testing

### Manual Test Steps

1. **Start services**:
   ```bash
   ./scripts/start_all.sh
   cd ui && npm run dev
   ```

2. **Generate a plan** at http://localhost:5173

3. **Click "Replace"** on any meal

4. **Observe**:
   - Button shows "Replacing..."
   - Button is disabled
   - Log shows progress
   - Recipe changes
   - Shopping list updates

5. **Click recipe card** to verify new recipe details

### API Test

```bash
# Generate a plan first, then:
curl -X POST http://localhost:4000/plan/PLAN_ID/replace \
  -H "Content-Type: application/json" \
  -d '{
    "day": "Monday",
    "mealType": "lunch"
  }'
```

---

## 📝 Code Locations

### Backend
- **Endpoint**: `/agent/index.js` line ~310
- **Function**: `POST /plan/:planId/replace`
- **Dependencies**: fetchRecipes, aggregateShoppingList, persistPlan

### Frontend
- **Component**: `/ui/src/PlanView.jsx`
- **Function**: `replaceRecipe(day, mealType)`
- **State**: `replacingMeal` (tracks loading state)
- **Styling**: `/ui/src/PlanView.css` (.btn-secondary:disabled)

---

## 🎉 Summary

The Replace feature provides a seamless way for users to customize their meal plans with just one click. It intelligently selects alternatives that match preferences, avoids duplicates, and keeps everything (plan and shopping list) in sync automatically.

**Key Benefits:**
- ⚡ **Fast**: One-click replacement
- 🎯 **Smart**: Respects preferences and avoids duplicates
- 🔄 **Automatic**: Updates plan and shopping list
- 💪 **Reliable**: Error handling and loading states
- 📱 **Responsive**: Works on all devices

**Ready to use at http://localhost:5173!** 🚀

