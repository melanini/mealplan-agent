const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { compactFeedbackToProfile, mergePreferences } = require('./compaction');
const { analyzeWasteReduction } = require('./wasteReductionWrapper');
const { analyzeBalancedDiet, formatHistoryFromPlans } = require('./balancedDietWrapper');
const { generateRecipeFromWeb } = require('./recipeGeneratorWrapper');

const app = express();
app.use(cors());
app.use(express.json());

const plansDir = path.resolve(__dirname, '../data/plans');
const sessionStore = new Map();

if (!fs.existsSync(plansDir)) {
  fs.mkdirSync(plansDir, { recursive: true });
}

const TOOLS = {
  userProfile: process.env.USER_PROFILE_URL || 'http://localhost:3000',
  recipe: process.env.RECIPE_TOOL_URL || 'http://localhost:3001',
  shopping: process.env.SHOPPING_TOOL_URL || 'http://localhost:3002',
  metrics: process.env.METRICS_TOOL_URL || 'http://localhost:3003'
};

function generatePlanId() {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getSessionContext(userId) {
  if (!sessionStore.has(userId)) {
    sessionStore.set(userId, {
      userId,
      recentRecipes: [],
      planHistory: [],
      createdAt: new Date().toISOString()
    });
  }
  return sessionStore.get(userId);
}

function updateSessionContext(userId, updates) {
  const context = getSessionContext(userId);
  Object.assign(context, updates);
  sessionStore.set(userId, context);
}

async function fetchUserProfile(userId) {
  try {
    const response = await axios.get(`${TOOLS.userProfile}/profile/${userId}`);
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch profile for ${userId}:`, err.message);
    return {
      id: userId,
      name: '',
      email: '',
      preferences: {}
    };
  }
}

async function fetchRecipes(maxCookMins, tags = [], exclude = []) {
  try {
    const params = new URLSearchParams();
    if (maxCookMins) params.append('maxCookMins', maxCookMins);
    if (tags.length > 0) params.append('tags', tags.join(','));
    exclude.forEach(item => params.append('exclude[]', item));

    const response = await axios.get(`${TOOLS.recipe}/recipes?${params.toString()}`);
    return response.data;
  } catch (err) {
    console.error('Failed to fetch recipes:', err.message);
    return [];
  }
}

/**
 * Generate recipes using Google Search (web-based recipes)
 * Falls back to local recipes if web search fails
 */
async function generateRecipesFromWeb(count, userPreferences) {
  const {
    diet = 'any',
    avoidIngredients = [],
    maxCookMins = 30,
    servings = 2,
    dietary = []
  } = userPreferences;

  console.log(`[${new Date().toISOString()}] generating_recipes_from_web count=${count} diet=${diet}`);

  const recipes = [];
  const errors = [];

  // Generate recipes in parallel (limit to avoid overwhelming the system)
  const batchSize = 3;
  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const batchCount = Math.min(batchSize, count - i);

    for (let j = 0; j < batchCount; j++) {
      const style = dietary.length > 0 ? dietary.join(', ') : 'any cuisine';
      
      batch.push(
        generateRecipeFromWeb({
          diet,
          avoidIngredients,
          maxCookMins,
          servings,
          style
        }).catch(err => {
          errors.push(err.message);
          return null;
        })
      );
    }

    const batchResults = await Promise.all(batch);
    recipes.push(...batchResults.filter(r => r !== null));
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < count) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (recipes.length === 0) {
    console.warn(`[${new Date().toISOString()}] web_search_failed, falling_back_to_local errors=${errors.length}`);
    // Fallback to local recipes
    const localRecipes = await fetchRecipes(maxCookMins, dietary, avoidIngredients);
    return localRecipes;
  }

  console.log(`[${new Date().toISOString()}] recipes_generated_from_web count=${recipes.length} errors=${errors.length}`);
  
  // Transform web recipes to match expected format
  return recipes.map((recipe, idx) => ({
    id: recipe.id || `web_${Date.now()}_${idx}`,
    title: recipe.title,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || [],
    cookTimeMins: recipe.cookTimeMins || recipe.cook_time_minutes || maxCookMins,
    tags: recipe.tags || dietary,
    servings: recipe.servings || servings,
    sourceUrl: recipe.sourceUrl || null,
    rating: recipe.rating || null,
    reviewCount: recipe.reviewCount || null,
    nutrition: recipe.nutrition || null,
    generatedFrom: 'web_search'
  }));
}

async function aggregateShoppingList(recipeIds) {
  try {
    const response = await axios.post(`${TOOLS.shopping}/shopping/aggregate`, {
      recipeIds
    });
    return response.data;
  } catch (err) {
    console.error('Failed to aggregate shopping list:', err.message);
    return [];
  }
}

async function incrementMetric(metricName) {
  try {
    await axios.post(`${TOOLS.metrics}/metrics/increment`, {
      metric: metricName
    });
  } catch (err) {
    console.error(`Failed to increment metric ${metricName}:`, err.message);
  }
}

async function updateUserProfile(userId, updates) {
  try {
    const response = await axios.patch(`${TOOLS.userProfile}/profile/${userId}`, updates);
    return response.data;
  } catch (err) {
    console.error(`Failed to update profile for ${userId}:`, err.message);
    return null;
  }
}

async function getUserPlanHistory(userId, weeksCount = 4) {
  try {
    // Read all plan files and filter by userId, get most recent 'weeksCount'
    const files = fs.readdirSync(plansDir);
    const userPlans = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const planPath = path.join(plansDir, file);
        const planData = JSON.parse(fs.readFileSync(planPath, 'utf8'));
        
        if (planData.userId === userId) {
          userPlans.push(planData);
        }
      }
    }
    
    // Sort by creation date (most recent first) and take the requested count
    userPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return userPlans.slice(0, weeksCount);
  } catch (err) {
    console.error(`Failed to get plan history for ${userId}:`, err.message);
    return [];
  }
}

function selectRecipeForDay(candidates, recentRecipes, dayIndex) {
  const availableRecipes = candidates.filter(recipe => 
    !recentRecipes.includes(recipe.id)
  );

  if (availableRecipes.length === 0) {
    return candidates[dayIndex % candidates.length];
  }

  const selectedIndex = dayIndex % availableRecipes.length;
  return availableRecipes[selectedIndex];
}

function persistPlan(planId, planData) {
  const filePath = path.join(plansDir, `${planId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(planData, null, 2));
  return filePath;
}

function loadPlan(planId) {
  const filePath = path.join(plansDir, `${planId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

app.post('/plan/generate', async (req, res) => {
  const { userId, weekStart } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const startTime = new Date().toISOString();
  console.log(`[${startTime}] plan_generation_started for user: ${userId}`);

  try {
    const sessionContext = getSessionContext(userId);
    const profile = await fetchUserProfile(userId);

    const maxCookMins = profile.preferences?.maxCookMins || 30;
    const dietaryTags = profile.preferences?.dietary || [];
    const avoidIngredients = profile.preferences?.avoidIngredients || [];
    const diet = profile.preferences?.diet || 'any';
    const servings = profile.preferences?.servings || 2;

    console.log(`[${new Date().toISOString()}] generating_recipes using_web_search diet=${diet} maxCookMins=${maxCookMins}`);
    
    // Use web search to generate recipes (14 recipes: 2 per day for 7 days)
    const candidates = await generateRecipesFromWeb(14, {
      diet,
      avoidIngredients,
      maxCookMins,
      servings,
      dietary: dietaryTags
    });

    if (candidates.length === 0) {
      return res.status(404).json({ 
        error: 'No recipes found matching user preferences',
        profile 
      });
    }

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekPlan = [];
    const selectedRecipeIds = [];
    const recentRecipes = sessionContext.recentRecipes || [];

    daysOfWeek.forEach((day, index) => {
      // Select lunch recipe
      const lunchRecipe = selectRecipeForDay(candidates, [...recentRecipes, ...selectedRecipeIds], index * 2);
      selectedRecipeIds.push(lunchRecipe.id);
      
      // Select dinner recipe (different from lunch)
      const dinnerRecipe = selectRecipeForDay(candidates, [...recentRecipes, ...selectedRecipeIds], index * 2 + 1);
      selectedRecipeIds.push(dinnerRecipe.id);
      
      weekPlan.push({
        day,
        date: weekStart ? new Date(new Date(weekStart).getTime() + index * 86400000).toISOString().split('T')[0] : null,
        lunch: {
          id: lunchRecipe.id,
          title: lunchRecipe.title,
          cookTimeMins: lunchRecipe.cookTimeMins || lunchRecipe.cook_time_minutes || 0,
          servings: lunchRecipe.servings
        },
        dinner: {
          id: dinnerRecipe.id,
          title: dinnerRecipe.title,
          cookTimeMins: dinnerRecipe.cookTimeMins || dinnerRecipe.cook_time_minutes || 0,
          servings: dinnerRecipe.servings
        }
      });
    });

    // Run balanced diet & variety analysis
    console.log(`[${new Date().toISOString()}] analyzing_diet_balance recipes=${candidates.length}`);
    let dietAnalysis = null;
    try {
      // Get user's meal plan history (last 4 weeks)
      const userPlans = await getUserPlanHistory(userId, 4);
      const history = formatHistoryFromPlans(userPlans);
      
      // Format weekly plan for analysis
      const weeklyPlanFormatted = weekPlan.map(day => [
        {
          day: day.day.toLowerCase(),
          mealType: 'lunch',
          recipe: {
            id: day.lunch.id,
            title: day.lunch.title,
            tags: candidates.find(r => r.id === day.lunch.id)?.tags || []
          }
        },
        {
          day: day.day.toLowerCase(),
          mealType: 'dinner',
          recipe: {
            id: day.dinner.id,
            title: day.dinner.title,
            tags: candidates.find(r => r.id === day.dinner.id)?.tags || []
          }
        }
      ]).flat();
      
      dietAnalysis = await analyzeBalancedDiet(
        weeklyPlanFormatted,
        candidates,
        profile.preferences || {},
        history
      );
      
      console.log(`[${new Date().toISOString()}] diet_analysis_complete replacements=${dietAnalysis.replacements?.length || 0}`);
      
      // Apply diet analysis recommendations to the week plan
      if (dietAnalysis && dietAnalysis.replacements && dietAnalysis.replacements.length > 0) {
        dietAnalysis.replacements.forEach(replacement => {
          const dayPlan = weekPlan.find(d => d.day.toLowerCase() === replacement.day.toLowerCase());
          if (dayPlan) {
            const mealType = replacement.mealType.toLowerCase();
            const newRecipe = candidates.find(r => r.id === replacement.newRecipeId);
            
            if (newRecipe) {
              if (mealType === 'lunch') {
                dayPlan.lunch = {
                  id: newRecipe.id,
                  title: newRecipe.title,
                  cookTimeMins: newRecipe.cookTimeMins || newRecipe.cook_time_minutes || 0,
                  servings: newRecipe.servings
                };
              } else if (mealType === 'dinner') {
                dayPlan.dinner = {
                  id: newRecipe.id,
                  title: newRecipe.title,
                  cookTimeMins: newRecipe.cookTimeMins || newRecipe.cook_time_minutes || 0,
                  servings: newRecipe.servings
                };
              }
            }
          }
        });
        
        // Update selected recipe IDs after replacements
        selectedRecipeIds.length = 0;
        weekPlan.forEach(day => {
          selectedRecipeIds.push(day.lunch.id, day.dinner.id);
        });
      }
    } catch (err) {
      console.warn(`[${new Date().toISOString()}] diet_analysis_failed: ${err.message}`);
    }

    console.log(`[${new Date().toISOString()}] aggregating_shopping_list recipes=${selectedRecipeIds.length}`);
    
    const shoppingList = await aggregateShoppingList(selectedRecipeIds);

    // Run waste reduction analysis
    console.log(`[${new Date().toISOString()}] analyzing_waste_reduction recipes=${candidates.length}`);
    let wasteAnalysis = null;
    try {
      wasteAnalysis = await analyzeWasteReduction(
        candidates.filter(r => selectedRecipeIds.includes(r.id)),
        profile.preferences || {}
      );
      console.log(`[${new Date().toISOString()}] waste_analysis_complete substitutions=${wasteAnalysis.substitutionSuggestions?.length || 0}`);
    } catch (err) {
      console.warn(`[${new Date().toISOString()}] waste_analysis_failed: ${err.message}`);
    }

    const planId = generatePlanId();
    const planData = {
      planId,
      userId,
      weekStart: weekStart || new Date().toISOString().split('T')[0],
      createdAt: startTime,
      profile: {
        id: profile.id,
        name: profile.name,
        preferences: profile.preferences
      },
      weekPlan,
      shoppingList: wasteAnalysis?.shoppingList || shoppingList,
      feedback: {},
      wasteReduction: wasteAnalysis ? {
        optimizedRecipes: wasteAnalysis.optimizedRecipes,
        substitutionSuggestions: wasteAnalysis.substitutionSuggestions,
        wasteReductionTips: wasteAnalysis.wasteReductionTips,
        estimatedWasteReduction: wasteAnalysis.estimatedWasteReduction
      } : null,
      balancedDiet: dietAnalysis ? {
        replacements: dietAnalysis.replacements,
        metrics: dietAnalysis.metrics,
        recommendations: dietAnalysis.recommendations
      } : null,
      metadata: {
        recipesUsed: selectedRecipeIds,
        totalItems: (wasteAnalysis?.shoppingList || shoppingList).length,
        wasteAnalysisApplied: !!wasteAnalysis,
        dietAnalysisApplied: !!dietAnalysis
      }
    };

    persistPlan(planId, planData);

    updateSessionContext(userId, {
      recentRecipes: [...new Set([...recentRecipes, ...selectedRecipeIds])].slice(-20),
      planHistory: [...(sessionContext.planHistory || []), planId].slice(-10)
    });

    const endTime = new Date().toISOString();
    console.log(`[${endTime}] plan_generated planId=${planId} userId=${userId} recipes=${selectedRecipeIds.length} shoppingItems=${shoppingList.length}`);

    res.json({
      success: true,
      planId,
      plan: planData
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] plan_generation_error userId=${userId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to generate plan',
      message: error.message 
    });
  }
});

app.post('/plan/:planId/recipe/:recipeId/feedback', async (req, res) => {
  const { planId, recipeId } = req.params;
  const { accepted, rejectionReason, comment } = req.body;

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] feedback_received planId=${planId} recipeId=${recipeId} accepted=${accepted}`);

  try {
    const plan = loadPlan(planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (!plan.feedback) {
      plan.feedback = {};
    }

    plan.feedback[recipeId] = {
      accepted: !!accepted,
      rejectionReason: rejectionReason || null,
      comment: comment || null,
      timestamp
    };

    persistPlan(planId, plan);

    const metricName = accepted ? 'recipes_accepted_total' : 'recipes_rejected_total';
    await incrementMetric(metricName);

    if (!accepted && rejectionReason) {
      console.log(`[${new Date().toISOString()}] compacting_feedback recipeId=${recipeId}`);
      
      const compacted = await compactFeedbackToProfile(rejectionReason);
      
      if (compacted && Object.keys(compacted).length > 0) {
        const currentProfile = await fetchUserProfile(plan.userId);
        const mergedPreferences = mergePreferences(currentProfile.preferences || {}, compacted);
        
        const updatedProfile = await updateUserProfile(plan.userId, {
          preferences: mergedPreferences
        });
        
        console.log(`[${new Date().toISOString()}] profile_updated userId=${plan.userId} compacted_fields=${Object.keys(compacted).length}`);
      }
    }

    res.json({
      success: true,
      planId,
      recipeId,
      feedback: plan.feedback[recipeId]
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] feedback_error planId=${planId} recipeId=${recipeId}:`, error.message);
    res.status(500).json({
      error: 'Failed to process feedback',
      message: error.message
    });
  }
});

app.post('/plan/:planId/replace', async (req, res) => {
  const { planId } = req.params;
  const { day, mealType } = req.body; // mealType: 'lunch' or 'dinner'

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] recipe_replace_requested planId=${planId} day=${day} mealType=${mealType}`);

  try {
    const plan = loadPlan(planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (!day || !mealType || !['lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ error: 'day and mealType (lunch/dinner) are required' });
    }

    const dayPlan = plan.weekPlan.find(d => d.day === day);
    if (!dayPlan) {
      return res.status(404).json({ error: `Day ${day} not found in plan` });
    }

    // Get user profile to respect preferences
    const profile = await fetchUserProfile(plan.userId);
    const maxCookMins = profile.preferences?.maxCookMins || 30;
    const dietaryTags = profile.preferences?.dietary || [];
    const avoidIngredients = profile.preferences?.avoidIngredients || [];
    const diet = profile.preferences?.diet || 'any';
    const servings = profile.preferences?.servings || 2;

    // Get all currently used recipe IDs to avoid duplicates
    const usedRecipeIds = plan.weekPlan.flatMap(d => [d.lunch.id, d.dinner.id]);
    const currentRecipeId = dayPlan[mealType].id;

    console.log(`[${new Date().toISOString()}] generating_replacement_recipe using_web_search`);
    
    // Generate alternative recipes using web search
    const candidates = await generateRecipesFromWeb(3, {
      diet,
      avoidIngredients,
      maxCookMins,
      servings,
      dietary: dietaryTags
    });

    if (candidates.length === 0) {
      return res.status(404).json({ error: 'No alternative recipes found' });
    }

    // Find a recipe that's not already in the plan
    let newRecipe = candidates.find(r => !usedRecipeIds.includes(r.id));
    
    // If all recipes are used, allow reusing but avoid the current one
    if (!newRecipe) {
      newRecipe = candidates.find(r => r.id !== currentRecipeId);
    }

    if (!newRecipe) {
      return res.status(404).json({ error: 'No alternative recipes available' });
    }

    // Update the meal with new recipe
    const oldRecipe = { ...dayPlan[mealType] };
    dayPlan[mealType] = {
      id: newRecipe.id,
      title: newRecipe.title,
      cookTimeMins: newRecipe.cookTimeMins || newRecipe.cook_time_minutes || 0,
      servings: newRecipe.servings
    };

    // Recalculate shopping list with all recipe IDs
    const allRecipeIds = plan.weekPlan.flatMap(d => [d.lunch.id, d.dinner.id]);
    const shoppingList = await aggregateShoppingList(allRecipeIds);
    plan.shoppingList = shoppingList;

    // Update metadata
    plan.metadata.recipesUsed = allRecipeIds;
    plan.metadata.totalItems = shoppingList.length;
    plan.metadata.lastModified = timestamp;

    // Track replacement in plan history
    if (!plan.replacements) {
      plan.replacements = [];
    }
    plan.replacements.push({
      day,
      mealType,
      oldRecipe: oldRecipe,
      newRecipe: dayPlan[mealType],
      timestamp
    });

    // Save updated plan
    persistPlan(planId, plan);

    console.log(`[${new Date().toISOString()}] recipe_replaced planId=${planId} day=${day} mealType=${mealType} oldRecipe=${oldRecipe.id} newRecipe=${newRecipe.id}`);

    res.json({
      success: true,
      planId,
      day,
      mealType,
      oldRecipe,
      newRecipe: dayPlan[mealType],
      updatedPlan: plan
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] replace_error planId=${planId}:`, error.message);
    res.status(500).json({
      error: 'Failed to replace recipe',
      message: error.message
    });
  }
});

app.get('/plan/:planId', (req, res) => {
  const { planId } = req.params;
  const plan = loadPlan(planId);

  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  res.json(plan);
});

app.get('/session/:userId', (req, res) => {
  const { userId } = req.params;
  const context = getSessionContext(userId);
  res.json(context);
});

app.get('/history/:userId', (req, res) => {
  const { userId } = req.params;
  const { limit = 10 } = req.query;

  try {
    // Read all plan files and filter by userId
    const planFiles = fs.readdirSync(plansDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const planData = JSON.parse(fs.readFileSync(path.join(plansDir, f), 'utf8'));
          return planData;
        } catch (err) {
          console.error(`Error reading plan ${f}:`, err.message);
          return null;
        }
      })
      .filter(plan => plan && plan.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    // Calculate ratings for each plan
    const plansWithRatings = planFiles.map(plan => {
      const ratings = {};
      let totalRating = 0;
      let ratedCount = 0;

      if (plan.feedback) {
        Object.entries(plan.feedback).forEach(([recipeId, feedback]) => {
          if (feedback.rating) {
            ratings[recipeId] = feedback.rating;
            totalRating += feedback.rating;
            ratedCount++;
          }
        });
      }

      const averageRating = ratedCount > 0 ? totalRating / ratedCount : null;

      return {
        planId: plan.planId,
        weekStart: plan.weekStart,
        createdAt: plan.createdAt,
        recipeCount: plan.weekPlan.length * 2, // lunch + dinner
        feedbackCount: plan.feedback ? Object.keys(plan.feedback).length : 0,
        ratings,
        averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : null,
        ratedCount,
        lastModified: plan.metadata?.lastModified || plan.createdAt
      };
    });

    res.json({
      userId,
      plans: plansWithRatings,
      total: plansWithRatings.length
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] history_error userId=${userId}:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

app.post('/plan/:planId/recipe/:recipeId/rating', async (req, res) => {
  const { planId, recipeId } = req.params;
  const { rating, comment } = req.body;

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] rating_received planId=${planId} recipeId=${recipeId} rating=${rating}`);

  try {
    const plan = loadPlan(planId);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!plan.feedback) {
      plan.feedback = {};
    }

    // Update or create feedback entry with rating
    plan.feedback[recipeId] = {
      ...plan.feedback[recipeId],
      rating: parseInt(rating),
      comment: comment || plan.feedback[recipeId]?.comment || null,
      ratedAt: timestamp
    };

    persistPlan(planId, plan);

    console.log(`[${new Date().toISOString()}] rating_saved planId=${planId} recipeId=${recipeId} rating=${rating}`);

    res.json({
      success: true,
      planId,
      recipeId,
      rating: plan.feedback[recipeId]
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] rating_error planId=${planId} recipeId=${recipeId}:`, error.message);
    res.status(500).json({
      error: 'Failed to save rating',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mealprep Agent listening on port ${PORT}`);
  console.log(`Tool endpoints configured: userProfile=${TOOLS.userProfile}, recipe=${TOOLS.recipe}, shopping=${TOOLS.shopping}, metrics=${TOOLS.metrics}`);
});

module.exports = app;
