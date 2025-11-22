# 🎭 Agent Orchestration Plan

## Overview

This document describes how the various AI agents in the Mealprep system collaborate through the MCP (Model Context Protocol) interface to generate optimized meal plans.

## Agent Ecosystem

### Available Agents

1. **Recipe Generator** 🍳
   - Purpose: Create new recipes from constraints
   - Input: Dietary requirements, time limits, preferences
   - Output: Complete recipe with ingredients and steps

2. **Meal Planner** 📅
   - Purpose: Arrange recipes into weekly schedule
   - Input: Recipe pool, weekday preferences
   - Output: 7-day meal plan with variety constraints

3. **Feedback Compactor** 💬
   - Purpose: Extract structured preferences from free text
   - Input: User feedback text
   - Output: Structured preferences (likes, dislikes, etc.)

4. **Shopping Normalizer** 🛒
   - Purpose: Aggregate and normalize ingredient lists
   - Input: Raw ingredient strings
   - Output: Consolidated shopping list

5. **Waste Reduction** ♻️
   - Purpose: Minimize food waste across recipes
   - Input: Recipe list, user profile
   - Output: Optimized recipes, substitutions, tips

6. **Balanced Diet** 🥗
   - Purpose: Ensure nutrition and prevent repetition
   - Input: Weekly plan, history, preferences
   - Output: Balanced plan, replacements, metrics

## Orchestration Flow

### Standard Meal Plan Generation

```
┌─────────────────────────────────────────────────────────┐
│                    Start: User Request                   │
│                 (userId, weekStart, prefs)               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  1. User Profile Manager   │
         │  - Fetch user profile      │
         │  - Get dietary prefs       │
         │  - Load history (4 weeks)  │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  2. Recipe Search          │
         │  - Query by constraints    │
         │  - Filter by intolerances  │
         │  - Return candidate pool   │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  3. Meal Planner           │
         │  - Select 14 recipes       │
         │  - 2 per day (lunch/dinner)│
         │  - Initial variety logic   │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  4. Balanced Diet Agent    │
         │  - Check 4-week history    │
         │  - Analyze macro balance   │
         │  - Replace repeated recipes│
         │  - Ensure variety          │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  5. Shopping Normalizer    │
         │  - Aggregate ingredients   │
         │  - Normalize quantities    │
         │  - Smart deduplication     │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  6. Waste Reduction Agent  │
         │  - Analyze ingredient use  │
         │  - Suggest substitutions   │
         │  - Optimize shopping list  │
         │  - Generate waste tips     │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  7. Final Assembly         │
         │  - Combine all outputs     │
         │  - Persist plan            │
         │  - Return to user          │
         └────────────────────────────┘
```

### Feedback Processing Flow

```
┌─────────────────────────────────────────────────────────┐
│           User Feedback: "Too spicy, no mushrooms"      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  1. Feedback Compactor     │
         │  - Parse free text         │
         │  - Extract preferences     │
         │  - Structure output        │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  2. User Profile Manager   │
         │  - Merge with profile      │
         │  - Update preferences      │
         │  - Persist changes         │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  3. Meal Planner (rerun)   │
         │  - Consider new prefs      │
         │  - Avoid spicy recipes     │
         │  - Exclude mushrooms       │
         └────────────────────────────┘
```

## Agent Communication Patterns

### 1. Sequential Pipeline (Current)

Most common pattern - agents run in sequence:

```javascript
// Step 1: Get data
const profile = await userProfileManager.get(userId);
const recipes = await recipeSearch.find(constraints);

// Step 2: Plan
const plan = await mealPlanner.generate(recipes);

// Step 3: Optimize
const balanced = await balancedDiet.analyze(plan, history);
const optimized = await wasteReduction.analyze(balanced.recipes);

// Step 4: Finalize
const shopping = await shoppingNormalizer.aggregate(optimized.recipes);
```

**Advantages:**
- Simple to implement
- Easy to debug
- Clear data flow

**Disadvantages:**
- Slower (sequential execution)
- Agents can't collaborate dynamically

### 2. Parallel Analysis (Proposed)

Some agents can run in parallel:

```javascript
// After initial plan generation
const [balancedResult, wasteResult] = await Promise.all([
  balancedDiet.analyze(plan, history),
  wasteReduction.analyze(plan.recipes)
]);

// Merge results
const finalPlan = mergeAnalyses(balancedResult, wasteResult);
```

**Advantages:**
- Faster execution
- Better resource utilization

**Disadvantages:**
- May have conflicting recommendations
- Needs conflict resolution

### 3. Iterative Refinement (Advanced)

Agents iterate to reach optimal solution:

```javascript
let plan = await mealPlanner.generate(recipes);
let iterations = 0;
const maxIterations = 3;

while (iterations < maxIterations) {
  // Analyze
  const balanced = await balancedDiet.analyze(plan);
  const waste = await wasteReduction.analyze(plan);
  
  // Check if satisfactory
  if (balanced.score > 0.9 && waste.score > 0.9) {
    break; // Good enough!
  }
  
  // Refine based on feedback
  plan = await mealPlanner.refine(plan, {
    balancedFeedback: balanced.suggestions,
    wasteFeedback: waste.suggestions
  });
  
  iterations++;
}
```

**Advantages:**
- Highest quality results
- Agents collaborate to find optimal solution

**Disadvantages:**
- Slower
- More complex
- May not converge

## MCP Tool Specifications

### Tool: `orchestrate_meal_plan`

**Full orchestration with all agents:**

```json
{
  "name": "orchestrate_meal_plan",
  "input": {
    "userId": "melani-123",
    "weekStart": "2025-11-25"
  },
  "output": {
    "planId": "plan_xxx",
    "weekPlan": [...],
    "shoppingList": [...],
    "balancedDiet": {
      "metrics": {...},
      "replacements": [...]
    },
    "wasteReduction": {
      "substitutions": [...],
      "tips": [...]
    },
    "metadata": {
      "agentsUsed": [
        "user_profile_manager",
        "recipe_search",
        "meal_planner",
        "balanced_diet",
        "shopping_normalizer",
        "waste_reduction"
      ],
      "executionTime": 4523,
      "quality": {
        "varietyScore": "high",
        "wasteReduction": "18%",
        "macroBalance": 0.95
      }
    }
  }
}
```

### Tool: `recipe_generator`

```json
{
  "name": "recipe_generator",
  "input": {
    "diet": "vegetarian",
    "avoidIngredients": ["mushrooms", "cilantro"],
    "maxCookMins": 25,
    "servings": 2,
    "style": "Mediterranean"
  },
  "output": {
    "id": "r_generated_001",
    "title": "Mediterranean Chickpea Bowl",
    "ingredients": [...],
    "steps": [...],
    "cookTimeMins": 20,
    "tags": ["vegetarian", "mediterranean", "protein-rich"]
  }
}
```

### Tool: `balanced_diet`

```json
{
  "name": "balanced_diet",
  "input": {
    "weeklyPlan": [...],
    "recipesPool": [...],
    "userProfile": {...},
    "history": [...]
  },
  "output": {
    "updatedWeeklyPlan": [...],
    "replacements": [...],
    "metrics": {
      "proteinRatio": 0.28,
      "carbsRatio": 0.47,
      "fatRatio": 0.25,
      "varietyScore": "high"
    }
  }
}
```

## Conflict Resolution Strategies

### When Multiple Agents Suggest Different Changes

#### Strategy 1: Priority-Based

Assign priority to each agent:

```
1. Balanced Diet (Highest)
   - Health and safety first
   - Prevents repetition

2. Waste Reduction
   - Sustainability important
   - Cost savings

3. Other optimizations
```

#### Strategy 2: Score-Based

Each agent provides a confidence score:

```javascript
const suggestions = [
  { agent: 'balanced_diet', change: {...}, score: 0.95 },
  { agent: 'waste_reduction', change: {...}, score: 0.78 }
];

// Take highest score
const winner = suggestions.sort((a, b) => b.score - a.score)[0];
```

#### Strategy 3: Merge Compatible

Try to merge non-conflicting suggestions:

```javascript
function mergeChanges(balancedChanges, wasteChanges) {
  const merged = [];
  
  // Group by meal
  const byMeal = groupByMeal([...balancedChanges, ...wasteChanges]);
  
  for (const [meal, changes] of byMeal) {
    if (changes.length === 1) {
      // No conflict
      merged.push(changes[0]);
    } else {
      // Conflict - resolve
      merged.push(resolveConflict(changes));
    }
  }
  
  return merged;
}
```

## Data Flow Between Agents

### Shared Context Object

All agents receive and update a shared context:

```javascript
const context = {
  // User information
  userId: "melani-123",
  profile: {
    intolerances: ["gluten"],
    dislikes: ["cilantro"],
    preferredMacros: {...}
  },
  
  // History
  history: {
    last4Weeks: [...],
    lastNRecipes: [...]
  },
  
  // Current plan state
  currentPlan: {
    recipes: [...],
    weekPlan: [...]
  },
  
  // Agent outputs
  analyses: {
    balancedDiet: {...},
    wasteReduction: {...}
  },
  
  // Quality metrics
  metrics: {
    varietyScore: 0.85,
    wasteScore: 0.78,
    macroBalance: 0.92
  }
};
```

### Context Updates

Each agent can:
1. **Read** any part of context
2. **Write** to its designated section
3. **Propose** changes to the plan
4. **Flag** conflicts

```javascript
// Agent writes its analysis
context.analyses.wasteReduction = {
  substitutions: [...],
  estimatedReduction: "18%",
  timestamp: Date.now()
};

// Agent proposes changes
context.proposedChanges.push({
  agent: "waste_reduction",
  type: "substitute_ingredient",
  meal: "monday_lunch",
  details: {...}
});
```

## Quality Assurance

### Post-Orchestration Validation

Before returning the plan, validate:

```javascript
function validatePlan(plan, context) {
  const checks = [];
  
  // 1. Dietary restrictions
  checks.push(validateDietaryRestrictions(plan, context.profile));
  
  // 2. No repetition
  checks.push(validateNoRepetition(plan, context.history));
  
  // 3. Macro balance
  checks.push(validateMacroBalance(plan, context.profile.preferredMacros));
  
  // 4. Variety
  checks.push(validateVariety(plan));
  
  // 5. Feasibility
  checks.push(validateCookingTime(plan, context.profile));
  
  return {
    valid: checks.every(c => c.passed),
    failures: checks.filter(c => !c.passed)
  };
}
```

### Rollback on Failure

If validation fails, rollback to safe state:

```javascript
if (!validation.valid) {
  console.error('Plan validation failed:', validation.failures);
  
  // Rollback to pre-optimization state
  plan = context.previousStates.beforeOptimization;
  
  // Or use fallback plan
  plan = generateFallbackPlan(context);
}
```

## Performance Optimization

### Caching Strategy

```javascript
// Cache expensive computations
const cache = {
  recipes: new Map(),      // Recipe lookups
  history: new Map(),      // User history
  analysis: new Map()      // Agent analyses
};

// Cache key format
function getCacheKey(agentName, input) {
  return `${agentName}:${hash(input)}`;
}
```

### Parallel Execution

```javascript
async function optimizeInParallel(plan, context) {
  // These can run in parallel (no dependencies)
  const [wasteResult, nutritionCheck] = await Promise.all([
    wasteReduction.analyze(plan),
    nutritionAnalyzer.check(plan)
  ]);
  
  // These need wasteResult
  const finalPlan = await balancedDiet.analyze(
    plan,
    { wasteResult, nutritionCheck }
  );
  
  return finalPlan;
}
```

### Timeout Handling

```javascript
async function callAgentWithTimeout(agent, input, timeout = 5000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Agent timeout')), timeout)
  );
  
  try {
    return await Promise.race([
      agent.execute(input),
      timeoutPromise
    ]);
  } catch (error) {
    console.warn(`Agent ${agent.name} timed out, using fallback`);
    return agent.fallback(input);
  }
}
```

## Monitoring & Observability

### Agent Performance Metrics

Track for each agent:

```javascript
{
  agentName: "balanced_diet",
  metrics: {
    callCount: 1523,
    successRate: 0.98,
    averageLatency: 2341,
    timeoutRate: 0.01,
    fallbackRate: 0.02,
    lastSuccess: "2025-11-22T10:30:00Z"
  }
}
```

### Orchestration Metrics

Track overall system:

```javascript
{
  totalPlansGenerated: 5234,
  averageLatency: 4523,
  agentCollaboration: {
    bothAgentsUsed: 4890,
    balancedDietOnly: 234,
    wasteReductionOnly: 110
  },
  qualityMetrics: {
    averageVariety: 0.87,
    averageWasteReduction: 0.16,
    userSatisfaction: 0.92
  }
}
```

## Future Enhancements

### 1. Agent Learning

Agents learn from outcomes:

```javascript
// After user rates the plan
await balancedDiet.learnFromFeedback({
  planId: "plan_xxx",
  replacementsMade: [...],
  userRating: 4.5,
  userFeedback: "Loved the variety!"
});
```

### 2. Dynamic Agent Selection

Choose which agents to run based on context:

```javascript
function selectAgents(context) {
  const agents = ['balanced_diet']; // Always run
  
  if (context.history.length >= 4) {
    agents.push('waste_reduction');
  }
  
  if (context.profile.specificGoals) {
    agents.push('nutrition_optimizer');
  }
  
  return agents;
}
```

### 3. Multi-Agent Negotiation

Agents negotiate to find consensus:

```javascript
const negotiation = await conductNegotiation([
  balancedDiet,
  wasteReduction
], plan);

// Agents exchange proposals until consensus
// or timeout, then use conflict resolution
```

## Usage Examples

### Example 1: Full Orchestration via MCP

```bash
# Call MCP server
echo '{
  "method": "tools/call",
  "params": {
    "name": "orchestrate_meal_plan",
    "arguments": {
      "userId": "melani-123",
      "weekStart": "2025-11-25"
    }
  }
}' | node mcp/mcp_server.js
```

### Example 2: Individual Agent via MCP

```bash
# Call waste reduction agent only
echo '{
  "method": "tools/call",
  "params": {
    "name": "waste_reduction",
    "arguments": {
      "recipes": [...],
      "userProfile": {...}
    }
  }
}' | node mcp/mcp_server.js
```

### Example 3: Chain Multiple Agents

```javascript
const mcp = new MealPrepMCPServer();

// Step 1: Search recipes
const recipes = await mcp.call('recipe_search', {
  maxCookMins: 30,
  tags: ['vegetarian']
});

// Step 2: Generate plan
const plan = await mcp.call('meal_planner', {
  recipes: recipes.data
});

// Step 3: Optimize
const optimized = await mcp.call('waste_reduction', {
  recipes: plan.weekPlan
});
```

## Testing Strategy

### Unit Tests (Per Agent)

Test each agent independently:

```javascript
describe('Balanced Diet Agent', () => {
  it('should detect recipe repetition', async () => {
    const result = await balancedDiet.analyze({
      weeklyPlan: [...],
      history: [...]
    });
    
    expect(result.replacements.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests (Agent Pairs)

Test agent collaboration:

```javascript
describe('Balanced Diet + Waste Reduction', () => {
  it('should not conflict on replacements', async () => {
    const plan = generateTestPlan();
    
    const balanced = await balancedDiet.analyze(plan);
    const waste = await wasteReduction.analyze(balanced.updatedPlan);
    
    // Check for conflicts
    const conflicts = findConflicts(balanced, waste);
    expect(conflicts).toHaveLength(0);
  });
});
```

### End-to-End Tests (Full Orchestration)

Test complete flow:

```javascript
describe('Full Orchestration', () => {
  it('should generate valid plan', async () => {
    const result = await orchestrate({
      userId: 'test-user',
      weekStart: '2025-11-25'
    });
    
    expect(result.plan).toBeDefined();
    expect(result.balancedDiet).toBeDefined();
    expect(result.wasteReduction).toBeDefined();
    
    // Validate output
    const validation = validatePlan(result.plan);
    expect(validation.valid).toBe(true);
  });
});
```

---

**Last Updated**: November 22, 2025  
**Version**: 1.0.0  
**Status**: 🚧 In Development

