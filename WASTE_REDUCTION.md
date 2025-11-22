# ♻️ Waste Reduction Agent

## Overview

The Waste Reduction Agent is an AI-powered system that minimizes food waste in weekly meal plans by:
- Identifying common ingredients across recipes
- Suggesting smart substitutions to consolidate ingredient usage
- Optimizing shopping lists to reduce partial packages
- Providing practical waste reduction tips
- Respecting user dietary restrictions and preferences

## Architecture

### Components

1. **`waste_reduction_agent.py`** - Python agent using Google Gemini LLM
2. **`wasteReductionWrapper.js`** - Node.js wrapper with three-tier fallback
3. **Integration in `agent/index.js`** - Automatic analysis during plan generation
4. **UI Display in `PlanView.jsx`** - Visual waste reduction insights

### Three-Tier Fallback System

```
Tier 1: Python Agent with Gemini ✨
   ↓ (if fails)
Tier 2: Retry Python Agent 🔄
   ↓ (if fails)
Tier 3: JavaScript Fallback 🛡️
```

This ensures the system always provides waste reduction recommendations, even when the AI agent is unavailable.

## Input Format

```json
{
  "recipes": [
    {
      "id": "r_001",
      "title": "Chickpea Curry",
      "ingredients": [
        {"name": "chickpeas", "qty": "1 can"},
        {"name": "tomato", "qty": "2"},
        {"name": "spinach", "qty": "1 cup"},
        {"name": "cilantro", "qty": "1/4 cup"}
      ]
    },
    {
      "id": "r_002",
      "title": "Tomato Pasta",
      "ingredients": [
        {"name": "pasta", "qty": "200g"},
        {"name": "tomato", "qty": "3"},
        {"name": "basil", "qty": "1/4 cup"}
      ]
    }
  ],
  "userProfile": {
    "intolerances": ["gluten", "lactose"],
    "dislikes": ["cilantro"],
    "dietary": ["quick", "healthy"]
  }
}
```

## Output Format

```json
{
  "optimizedRecipes": [
    {
      "id": "r_001",
      "title": "Chickpea Curry",
      "ingredients": [...],
      "notes": "Use 1 tomato from batch of 5 leftover from Pasta recipe"
    }
  ],
  "shoppingList": [
    {
      "name": "chickpeas",
      "qty": "1 can",
      "reuseNotes": "Used in 1 recipe",
      "packageSize": "standard",
      "estimatedWaste": "low"
    },
    {
      "name": "tomato",
      "qty": "5 total",
      "reuseNotes": "Used across Curry (2) and Pasta (3)",
      "packageSize": "standard",
      "estimatedWaste": "low"
    }
  ],
  "substitutionSuggestions": [
    {
      "recipeId": "r_001",
      "original": "cilantro",
      "substitute": "parsley",
      "reason": "User dislikes cilantro; parsley provides similar fresh flavor",
      "qty": "1/4 cup"
    }
  ],
  "wasteReductionTips": [
    "Store fresh herbs in water like flowers to extend shelf life",
    "Buy tomatoes in bulk and use across multiple recipes this week",
    "Freeze leftover ingredients in portions for future use"
  ],
  "estimatedWasteReduction": "15-20%"
}
```

## Agent Logic

### 1. Ingredient Analysis
- **Count Usage**: Track how many recipes use each ingredient
- **Aggregate Quantities**: Sum up total amounts needed
- **Identify Overlaps**: Find ingredients that appear multiple times

### 2. Package Size Consideration
The agent considers typical grocery store package sizes:
- Fresh herbs: Usually sold in bunches
- Vegetables: Standard sizes (e.g., 1 tomato ≈ 150g)
- Canned goods: Standard can sizes
- Dry ingredients: Common package sizes

### 3. Substitution Logic
```
IF ingredient appears once in small quantity THEN
  Check if similar ingredient appears more frequently
  IF yes AND respects dietary restrictions THEN
    Suggest substitution
```

### 4. Waste Risk Assessment
- **High**: Ingredient used in very small quantity, spoils quickly
- **Medium**: Partial package usage, moderate shelf life
- **Low**: Full package usage or appears in multiple recipes

### 5. Dietary Constraint Enforcement
```
NEVER suggest ingredients in:
  - userProfile.intolerances[]
  - userProfile.dislikes[]

ALWAYS respect:
  - Dietary preferences (vegan, vegetarian, etc.)
  - Cooking skill level
  - Time constraints
```

## Integration

### Backend Integration

In `agent/index.js`:
```javascript
const { analyzeWasteReduction } = require('./wasteReductionWrapper');

// During plan generation
const wasteAnalysis = await analyzeWasteReduction(
  selectedRecipes,
  userProfile.preferences
);

// Include in plan data
planData.wasteReduction = {
  optimizedRecipes: wasteAnalysis.optimizedRecipes,
  substitutionSuggestions: wasteAnalysis.substitutionSuggestions,
  wasteReductionTips: wasteAnalysis.wasteReductionTips,
  estimatedWasteReduction: wasteAnalysis.estimatedWasteReduction
};
```

### Frontend Display

The UI displays waste reduction insights in three sections:

1. **Estimated Waste Reduction** - Overall impact metric
2. **Smart Substitutions** - Specific ingredient swaps with reasons
3. **Tips** - Practical advice for reducing waste

## Usage Examples

### Example 1: Consolidating Fresh Herbs

**Input**: 3 recipes using different herbs in small amounts
- Recipe A: 1/4 cup cilantro
- Recipe B: 1/4 cup parsley  
- Recipe C: 1/4 cup basil

**Output**: 
```json
{
  "substitutionSuggestions": [
    {
      "recipeId": "r_002",
      "original": "cilantro",
      "substitute": "parsley",
      "reason": "Consolidate herb purchases - parsley appears in 2 recipes"
    }
  ]
}
```

### Example 2: Optimizing Tomato Usage

**Input**: 2 recipes with tomatoes
- Recipe A: 2 tomatoes
- Recipe B: 3 tomatoes

**Output**:
```json
{
  "shoppingList": [
    {
      "name": "tomato",
      "qty": "5 total",
      "reuseNotes": "Used across Curry (2) and Pasta (3) - buy in bulk",
      "estimatedWaste": "low"
    }
  ]
}
```

### Example 3: Respecting Dietary Restrictions

**Input**: User is lactose intolerant
```json
{
  "userProfile": {
    "intolerances": ["lactose"]
  }
}
```

**Output**: Will NEVER suggest dairy products like milk, cheese, butter, cream, or yogurt

## Testing

### Run the Test Script

```bash
cd mealprep-agent
node scripts/test_waste_reduction.js
```

### Expected Output

```
🧪 Testing Waste Reduction Agent

============================================================
Input Recipes:
  - Chickpea Curry (7 ingredients)
  - Tomato Pasta (5 ingredients)
  - Garlic Shrimp (5 ingredients)
  - Spinach Salad (5 ingredients)

User Profile:
  - Intolerances: gluten, lactose
  - Dislikes: cilantro
============================================================

⏳ Running waste reduction analysis...

✅ Analysis completed in 2341ms

============================================================

📊 RESULTS:

✨ Optimized Recipes:
  📝 Chickpea Curry
     💡 Substitute cilantro with parsley to match other recipes
  📝 Tomato Pasta
     💡 Use tomatoes from consolidated batch of 6
  📝 Garlic Shrimp
     💡 Original recipe
  📝 Spinach Salad
     💡 Use spinach from Chickpea Curry batch

🛒 Optimized Shopping List (15 items):
  • chickpeas: 1 can
    ℹ️  Used in Chickpea Curry
  • tomato: 6 total
    ℹ️  Used in 2 recipes: Curry (2), Pasta (3), Salad (1)
  • garlic: 9 cloves
    ℹ️  Used in 3 recipes - buy 1-2 bulbs
  • spinach: 3 cups
    ℹ️  Used in 2 recipes - buy 1 bag
    ⚠️  Waste level: medium
  • parsley: 1/2 cup
    ℹ️  Consolidated from cilantro substitution
  ...

🔄 Substitution Suggestions (1):
  • Recipe: r_001
    Replace: cilantro → parsley
    Reason: User dislikes cilantro; parsley provides similar fresh flavor
    Quantity: 1/4 cup

💡 Waste Reduction Tips:
  1. Store fresh herbs in water like flowers to extend shelf life
  2. Buy tomatoes and garlic in bulk - used across multiple recipes
  3. Use spinach earlier in the week as it spoils quickly
  4. Consider freezing leftover garlic cloves in oil

📈 Estimated Waste Reduction: 15-20%

============================================================

🔍 Ingredient Analysis:
Common ingredients across recipes:
  • tomato: used in 3 recipes
  • garlic: used in 3 recipes
  • spinach: used in 2 recipes
  • olive oil: used in 2 recipes
  • lemon: used in 2 recipes

✅ Test completed successfully!
```

## API Endpoints

### Used Internally

The waste reduction agent is called automatically during plan generation:

```
POST /plan/generate
```

Response includes:
```json
{
  "planId": "plan_xxx",
  "wasteReduction": {
    "optimizedRecipes": [...],
    "substitutionSuggestions": [...],
    "wasteReductionTips": [...],
    "estimatedWasteReduction": "15-20%"
  }
}
```

## UI Components

### Waste Reduction Section

Displays in `PlanView.jsx` after the meal plan:

```jsx
{plan.wasteReduction && (
  <div className="waste-reduction-section">
    <h2>♻️ Waste Reduction Insights</h2>
    {/* Estimated reduction */}
    {/* Substitution suggestions */}
    {/* Tips */}
  </div>
)}
```

### Shopping List Enhancement

Shopping items now include:
- **Reuse notes**: How ingredient is used across recipes
- **Waste indicators**: Visual warnings for potential waste
- **Quantity consolidation**: Total amounts with breakdown

## Performance

- **Average Analysis Time**: 2-4 seconds
- **Timeout**: 30 seconds
- **Fallback Time**: <100ms (JavaScript)
- **Cache**: None (analysis is recipe-specific)

## Error Handling

### Python Agent Failures
- LLM unavailable → Retry once → JavaScript fallback
- Invalid JSON response → Parse and correct → Fallback if needed
- Timeout → Cancel process → JavaScript fallback

### Fallback Behavior
When fallback is used:
```json
{
  "fallbackUsed": true,
  "estimatedWasteReduction": "5-10% (fallback estimates)"
}
```

## Best Practices

### For Agent Prompting
1. **Always specify dietary restrictions** in the prompt
2. **Provide typical package sizes** for context
3. **Request practical substitutions** only
4. **Enforce JSON-only output** to avoid parsing issues

### For Integration
1. **Don't block plan generation** on waste analysis
2. **Log failures** for debugging
3. **Always have fallback** ready
4. **Display partial results** if available

### For Users
1. **Update dietary preferences** regularly
2. **Review substitution suggestions** before shopping
3. **Follow tips** for maximum waste reduction
4. **Plan recipes** strategically throughout the week

## Future Enhancements

### Potential Improvements
- [ ] Historical waste tracking per user
- [ ] Seasonal ingredient recommendations
- [ ] Price optimization alongside waste reduction
- [ ] Recipe scaling suggestions
- [ ] Leftover recipe generation
- [ ] Batch cooking recommendations
- [ ] Freezer inventory integration
- [ ] Store package size database

### ML Improvements
- [ ] Learn from user acceptance of substitutions
- [ ] Personalized waste reduction patterns
- [ ] Predictive ingredient spoilage
- [ ] Smart reordering of recipes in the week

## Troubleshooting

### "Python agent failed"
**Solution**: Check if Python 3 and `google-generativeai` are installed
```bash
python3 --version
pip3 list | grep google-generativeai
```

### "Invalid JSON from agent"
**Solution**: The LLM sometimes returns markdown. The wrapper handles this, but check logs:
```bash
tail -f data/logs/events.json
```

### "No substitutions suggested"
**Possible reasons**:
- Recipes already well-optimized
- No common ingredients found
- All ingredients are dietary restricted
- Fallback mode was used (less intelligent)

### "Waste reduction section not showing"
**Check**:
1. Is `plan.wasteReduction` present in the response?
2. Check browser console for JS errors
3. Verify backend agent is running
4. Check that analysis isn't timing out

## Monitoring

### Key Metrics
- `waste_analysis_complete` - Successful analyses
- `waste_analysis_failed` - Failed analyses
- `waste_analysis_fallback_used` - Fallback invocations
- Average substitution count
- User acceptance rate of substitutions

### Logs
All waste reduction events are logged:
```json
{
  "timestamp": "2025-11-22T10:30:00Z",
  "event": "waste_analysis_complete",
  "planId": "plan_xxx",
  "substitutions": 2,
  "estimatedReduction": "15-20%",
  "duration": 2341
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

