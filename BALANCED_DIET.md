# 🥗 Balanced Diet & Variety Agent

## Overview

The Balanced Diet & Variety Agent is an AI-powered system that ensures users eat nutritionally balanced meals while preventing recipe repetition for 4 weeks. It analyzes meal plans, calculates macronutrient ratios, and suggests replacements to maintain variety and nutritional balance.

## Key Features

- ✅ **4-Week Repetition Prevention**: Ensures no recipe repeats within 28 days
- ✅ **Macronutrient Balance**: Tracks protein, carbs, and fat ratios
- ✅ **Variety Scoring**: Measures ingredient and cuisine diversity
- ✅ **Smart Replacements**: Suggests alternatives that maintain nutritional goals
- ✅ **Dietary Compliance**: Always respects intolerances and dislikes
- ✅ **Three-Tier Fallback**: Ensures reliable operation even when AI is unavailable

## Architecture

### Components

1. **`balanced_diet_agent.py`** - Python agent using Google Gemini LLM
2. **`balancedDietWrapper.js`** - Node.js wrapper with fallback logic
3. **Integration in `agent/index.js`** - Automatic analysis during plan generation
4. **UI Display in `PlanView.jsx`** - Visual nutrition metrics and insights

### Three-Tier Fallback System

```
Tier 1: Python Agent with Gemini ✨
   │ AI-powered macro analysis
   │ Intelligent variety scoring
   │ Context-aware replacements
   ↓ (if fails)
   
Tier 2: Retry Python Agent 🔄
   │ Handles transient failures
   │ Network/LLM recovery
   ↓ (if fails)
   
Tier 3: JavaScript Fallback 🛡️
   │ Simple repetition detection
   │ Basic replacement logic
   ✓ Always provides value
```

## How It Works

### 1. Analysis Process

```
User History (4 weeks)
         ↓
Extract Recent Recipe IDs
         ↓
Check Current Plan ──→ Detect Repeats
         ↓
Analyze Recipe Tags ──→ Calculate Macros
         ↓
Evaluate Variety ──→ Score Diversity
         ↓
Suggest Replacements ──→ Maintain Balance
         ↓
Return Updated Plan
```

### 2. Macro Ratio Estimation

The agent estimates macronutrient ratios from recipe tags:

| Tag | Protein | Carbs | Fat |
|-----|---------|-------|-----|
| `protein-rich` | 40% | 30% | 30% |
| `carbs`, `pasta`, `rice` | 15% | 60% | 25% |
| `healthy-fat`, `avocado` | 20% | 30% | 50% |
| `balanced` | 30% | 40% | 30% |

Daily macros are averaged across all meals.

### 3. Variety Scoring

**High Variety (Green)**
- 7+ different main ingredients
- 3+ cuisines represented
- No recipe used more than once

**Medium Variety (Orange)**
- 5-6 different main ingredients
- 2-3 cuisines
- Minimal repetition

**Low Variety (Red)**
- <5 different main ingredients
- 1-2 cuisines
- Multiple recipe repeats

## Input Format

```json
{
  "weeklyPlan": [
    {
      "day": "monday",
      "mealType": "lunch",
      "recipe": {
        "id": "r_001",
        "title": "Chickpea Curry",
        "tags": ["vegan", "protein-rich", "indian"]
      }
    },
    {
      "day": "monday",
      "mealType": "dinner",
      "recipe": {
        "id": "r_002",
        "title": "Tomato Pasta",
        "tags": ["vegetarian", "carbs", "italian"]
      }
    }
  ],
  "recipesPool": [
    {
      "id": "r_001",
      "title": "Chickpea Curry",
      "tags": ["vegan", "protein-rich", "indian"],
      "ingredients": [...]
    },
    {
      "id": "r_010",
      "title": "Lentil Stir-Fry",
      "tags": ["vegan", "protein-rich", "asian"],
      "ingredients": [...]
    }
  ],
  "userProfile": {
    "intolerances": ["gluten"],
    "dislikes": ["cilantro"],
    "preferredMacros": {
      "protein": 0.30,
      "carbs": 0.45,
      "fat": 0.25
    }
  },
  "history": [
    {"week": 1, "recipes": ["r_005", "r_007", ...]},
    {"week": 2, "recipes": ["r_003", "r_002", ...]},
    {"week": 3, "recipes": ["r_001", "r_006", ...]},
    {"week": 4, "recipes": ["r_008", "r_009", ...]}
  ]
}
```

## Output Format

```json
{
  "updatedWeeklyPlan": [
    {
      "day": "monday",
      "mealType": "lunch",
      "recipe": {
        "id": "r_010",
        "title": "Lentil Stir-Fry",
        "tags": ["vegan", "protein-rich", "asian"]
      },
      "notes": "Replaced to avoid repetition from week 3"
    }
  ],
  "replacements": [
    {
      "day": "monday",
      "mealType": "lunch",
      "originalRecipeId": "r_001",
      "originalRecipeTitle": "Chickpea Curry",
      "newRecipeId": "r_010",
      "newRecipeTitle": "Lentil Stir-Fry",
      "reason": "Recipe used in past 4 weeks (week 3); replaced with similar protein-rich option"
    }
  ],
  "metrics": {
    "proteinRatio": 0.28,
    "carbsRatio": 0.47,
    "fatRatio": 0.25,
    "replacementsCount": 1,
    "varietyScore": "high",
    "cuisineDiversity": ["Indian", "Italian", "Asian", "Mexican"],
    "repeatedRecipes": 0
  },
  "recommendations": [
    "Great variety across cuisines this week!",
    "Protein levels are within target range",
    "Consider adding more leafy greens for micronutrients"
  ]
}
```

## Integration

### Backend Integration

In `agent/index.js`:

```javascript
const { analyzeBalancedDiet, formatHistoryFromPlans } = require('./balancedDietWrapper');

// Get user's meal plan history
const userPlans = await getUserPlanHistory(userId, 4);
const history = formatHistoryFromPlans(userPlans);

// Format weekly plan for analysis
const weeklyPlanFormatted = weekPlan.map(day => [
  {
    day: day.day.toLowerCase(),
    mealType: 'lunch',
    recipe: { id: day.lunch.id, title: day.lunch.title, tags: [...] }
  },
  {
    day: day.day.toLowerCase(),
    mealType: 'dinner',
    recipe: { id: day.dinner.id, title: day.dinner.title, tags: [...] }
  }
]).flat();

// Run analysis
const dietAnalysis = await analyzeBalancedDiet(
  weeklyPlanFormatted,
  recipesPool,
  userProfile.preferences,
  history
);

// Apply replacements to the plan
if (dietAnalysis.replacements && dietAnalysis.replacements.length > 0) {
  // Update recipes based on suggestions
  applyReplacements(weekPlan, dietAnalysis.replacements);
}
```

### Frontend Display

The UI displays balanced diet insights with:

1. **Nutrition Metrics Cards** - Visual macro ratios with progress bars
2. **Variety Score Badge** - Color-coded (green/orange/red)
3. **Recipe Replacements** - Clear before/after with reasons
4. **Nutrition Tips** - AI-generated recommendations

## Usage Examples

### Example 1: Detecting Repetition

**Scenario**: User had "Chickpea Curry" in week 3

**Input**: Current plan includes "Chickpea Curry" again

**Output**:
```json
{
  "replacements": [
    {
      "originalRecipeId": "r_001",
      "originalRecipeTitle": "Chickpea Curry",
      "newRecipeId": "r_010",
      "newRecipeTitle": "Lentil Stir-Fry",
      "reason": "Recipe used in week 3 (within 4-week window)"
    }
  ]
}
```

### Example 2: Balancing Macros

**Scenario**: Too many carb-heavy meals

**Current Plan**:
- Monday: Pasta (60% carbs)
- Tuesday: Rice Bowl (60% carbs)
- Wednesday: Pizza (60% carbs)

**Analysis**: Carbs = 60% (target: 45%)

**Suggested Replacement**:
```json
{
  "replacements": [
    {
      "day": "tuesday",
      "newRecipeTitle": "Grilled Chicken Salad",
      "reason": "Balance macro ratios - add more protein"
    }
  ]
}
```

### Example 3: Improving Variety

**Scenario**: All Italian meals

**Current Plan**:
- Pasta, Pizza, Risotto, Lasagna, Bruschetta

**Analysis**: Variety Score = LOW (1 cuisine, similar ingredients)

**Suggested Replacements**:
```json
{
  "replacements": [
    {
      "newRecipeTitle": "Thai Curry",
      "reason": "Increase cuisine diversity - add Asian flavors"
    },
    {
      "newRecipeTitle": "Mexican Burrito Bowl",
      "reason": "Increase cuisine diversity - add Mexican flavors"
    }
  ],
  "recommendations": [
    "Consider exploring more global cuisines for better variety"
  ]
}
```

## Testing

### Run the Test Script

```bash
cd mealprep-agent
node scripts/test_balanced_diet.js
```

### Expected Output

```
🧪 Testing Balanced Diet & Variety Agent

======================================================================
Input Weekly Plan:
  monday lunch: Chickpea Curry (r_001)
  monday dinner: Tomato Pasta (r_002)
  tuesday lunch: Greek Salad (r_003)
  tuesday dinner: Chickpea Curry (r_001)    ← REPEAT!
  wednesday lunch: Chicken Stir-Fry (r_004)
  wednesday dinner: Beef Tacos (r_005)

User Preferences:
  Preferred Macros: P:30% C:45% F:25%
  Intolerances: gluten
  Dislikes: cilantro

Recent History (Past 4 Weeks):
  Week 1: r_010, r_009, r_008, r_007
  Week 2: r_006, r_007, r_008, r_009
  Week 3: r_001, r_003, r_004, r_005    ← r_001 was used here!
  Week 4: r_006, r_007, r_008, r_009

⚠️  Issues to Detect:
  • r_001 (Chickpea Curry) repeats TWICE in current plan
  • r_001 was also used in Week 3 (within 4-week window)
======================================================================

⏳ Running balanced diet analysis...

✅ Analysis completed in 2847ms

======================================================================

📊 RESULTS:

🥗 Nutritional Balance:
  Protein: 28.0% (target: 30%)
  Carbs: 47.0% (target: 45%)
  Fat: 25.0% (target: 25%)
  Variety Score: MEDIUM
  Cuisine Diversity: Indian, Italian, Mediterranean, Asian, Mexican
  Repeated Recipes: 2

🔄 Recipe Replacements (2):
  1. tuesday dinner:
     ❌ Chickpea Curry (r_001)
     ✅ Lentil Stew (r_006)
     💡 Reason: Recipe repeats within same week

  2. monday lunch:
     ❌ Chickpea Curry (r_001)
     ✅ Quinoa Bowl (r_007)
     💡 Reason: Recipe used in week 3 (within 4-week window)

💡 Nutritional Recommendations:
  1. Excellent macro balance - very close to target ratios
  2. Good cuisine diversity across 5 different styles
  3. Consider adding more leafy greens for micronutrients
  4. Protein sources are well-distributed throughout the week

📅 Updated Weekly Plan:
  monday lunch: Quinoa Bowl (replaced to avoid repetition)
  monday dinner: Tomato Pasta
  tuesday lunch: Greek Salad
  tuesday dinner: Lentil Stew (replaced to avoid repetition)
  wednesday lunch: Chicken Stir-Fry
  wednesday dinner: Beef Tacos

======================================================================

📈 Analysis Summary:
  Total meals analyzed: 6
  Recipes changed: 2
  Replacements made: 2
  Variety score: medium

✓ Test Validation:
  ✅ Detected repeated recipe (r_001)

✅ Test completed successfully!
```

## UI Components

### Balanced Diet Section

Displays in `PlanView.jsx`:

```jsx
{plan.balancedDiet && (
  <div className="balanced-diet-section">
    <h2>🥗 Balanced Diet & Nutrition</h2>
    
    {/* Macro Metrics */}
    <div className="nutrition-metrics">
      <div className="metric-card">
        <div className="metric-label">Protein</div>
        <div className="metric-value">28%</div>
        <div className="metric-bar">
          <div className="metric-fill protein" style={{width: '28%'}}></div>
        </div>
      </div>
      {/* Carbs and Fat cards... */}
    </div>
    
    {/* Variety Score */}
    <div className="variety-indicator">
      <strong>Variety Score:</strong>
      <span className="variety-badge variety-high">HIGH</span>
    </div>
    
    {/* Replacements */}
    {/* Recommendations */}
  </div>
)}
```

### Visual Design

**Nutrition Metrics**
- Color-coded progress bars (red=protein, orange=carbs, purple=fat)
- Large percentage values
- Smooth animations

**Variety Badge**
- Green = High variety (excellent)
- Orange = Medium variety (good)
- Red = Low variety (needs improvement)

**Replacement Cards**
- Day/meal badge
- Strike-through for replaced recipe
- Arrow pointing to new recipe
- Clear reason explanation

## Performance

- **Average Analysis Time**: 2-4 seconds
- **Timeout**: 30 seconds
- **Fallback Time**: <50ms (JavaScript)
- **History Lookback**: 4 weeks (28 days)

## Error Handling

### Python Agent Failures
- LLM unavailable → Retry → JavaScript fallback
- Invalid JSON → Parse and correct → Fallback if needed
- Timeout → Cancel → JavaScript fallback

### Fallback Behavior
```json
{
  "fallbackUsed": true,
  "metrics": {
    "varietyScore": "unknown"
  },
  "recommendations": [
    "Fallback mode used - manual review recommended"
  ]
}
```

## Best Practices

### For Users
1. **Check Nutrition Metrics** - Ensure balanced macro ratios
2. **Review Replacements** - Understand why changes were made
3. **Track Variety Score** - Aim for "High" consistently
4. **Follow Recommendations** - AI suggestions improve over time

### For Developers
1. **Tag Recipes Accurately** - Enables better macro estimation
2. **Maintain History** - 4 weeks minimum for effective analysis
3. **Don't Block Generation** - Analysis runs asynchronously
4. **Always Have Fallback** - System degrades gracefully

## Future Enhancements

### Planned Features
- [ ] Micronutrient tracking (vitamins, minerals)
- [ ] Calorie counting and goals
- [ ] Allergen cross-contamination warnings
- [ ] Meal timing optimization
- [ ] Glycemic index consideration
- [ ] Seasonal ingredient preferences
- [ ] Athletic performance optimization

### ML Improvements
- [ ] Learn user's actual macro needs from feedback
- [ ] Personalized variety preferences
- [ ] Predict recipe satisfaction
- [ ] Smart meal sequencing (heavy to light)

## Troubleshooting

### "No replacements suggested"
**Possible reasons**:
- Plan is already optimal
- Limited recipes in pool
- All alternatives have restrictions
- Fallback mode (less intelligent)

### "Metrics don't match expectations"
**Check**:
1. Are recipe tags accurate?
2. Is the tag-to-macro mapping appropriate?
3. Are enough tags provided per recipe?
4. Manual calculation vs AI estimation

### "Variety score seems wrong"
**Verify**:
- Recipe tags include cuisine types
- Main ingredients are tagged
- Cooking styles are diverse
- Check `cuisineDiversity` array in metrics

### "Repeated recipe not caught"
**Investigate**:
1. Is history loading correctly?
2. Check `getUserPlanHistory()` function
3. Verify recipe IDs match exactly
4. Ensure history spans 4 weeks

## Monitoring

### Key Metrics
- `diet_analysis_complete` - Successful analyses
- `diet_analysis_failed` - Failed analyses  
- `diet_analysis_fallback_used` - Fallback invocations
- Average replacement count
- Variety score distribution

### Logs
```json
{
  "timestamp": "2025-11-22T10:30:00Z",
  "event": "diet_analysis_complete",
  "planId": "plan_xxx",
  "replacements": 2,
  "varietyScore": "high",
  "duration": 2847
}
```

## API Endpoints

### Used Internally

The balanced diet agent is called automatically during plan generation:

```
POST /plan/generate
```

Response includes:
```json
{
  "planId": "plan_xxx",
  "balancedDiet": {
    "replacements": [...],
    "metrics": {...},
    "recommendations": [...]
  }
}
```

## License & Credits

- Uses Google Gemini 2.0 Flash for AI analysis
- Part of the Mealprep Agent system
- MIT License

---

**Last Updated**: November 22, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

