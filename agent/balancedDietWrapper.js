/**
 * Balanced Diet & Variety Agent Wrapper
 * Node.js wrapper for the Python balanced diet agent with fallback logic
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Naive JavaScript fallback for diet balance analysis
 * Used when Python agent fails
 */
function naiveFallback(weeklyPlan, recipesPool, userProfile, history) {
  // Extract recently used recipe IDs (past 4 weeks)
  const recentRecipeIds = new Set();
  const last4Weeks = history.slice(-4);
  
  last4Weeks.forEach(week => {
    if (week.recipes) {
      week.recipes.forEach(id => recentRecipeIds.add(id));
    }
  });
  
  // Check for repeated recipes
  const replacements = [];
  const updatedPlan = weeklyPlan.map(meal => {
    const recipeId = meal.recipe?.id;
    
    if (recentRecipeIds.has(recipeId)) {
      // Find a replacement from pool
      const availableRecipes = recipesPool.filter(r => 
        !recentRecipeIds.has(r.id) && 
        r.id !== recipeId
      );
      
      if (availableRecipes.length > 0) {
        const replacement = availableRecipes[0];
        replacements.push({
          day: meal.day,
          mealType: meal.mealType,
          originalRecipeId: recipeId,
          originalRecipeTitle: meal.recipe.title,
          newRecipeId: replacement.id,
          newRecipeTitle: replacement.title,
          reason: 'Recipe used in past 4 weeks (fallback detection)'
        });
        
        return {
          ...meal,
          recipe: {
            id: replacement.id,
            title: replacement.title,
            tags: replacement.tags || []
          },
          notes: `Replaced to avoid repetition (fallback mode)`
        };
      }
    }
    
    return meal;
  });
  
  // Calculate basic variety metrics
  const uniqueRecipes = new Set(updatedPlan.map(m => m.recipe?.id));
  const varietyScore = uniqueRecipes.size >= 10 ? 'high' : 
                       uniqueRecipes.size >= 7 ? 'medium' : 'low';
  
  return {
    updatedWeeklyPlan: updatedPlan,
    replacements,
    metrics: {
      proteinRatio: 0.25,
      carbsRatio: 0.50,
      fatRatio: 0.25,
      replacementsCount: replacements.length,
      varietyScore,
      cuisineDiversity: ['mixed'],
      repeatedRecipes: replacements.length
    },
    recommendations: [
      `Detected ${replacements.length} repeated recipes from past 4 weeks`,
      'Fallback mode used - manual review recommended for nutritional balance',
      'Consider adding more variety in protein sources and cuisines'
    ],
    fallbackUsed: true
  };
}

/**
 * Call Python balanced diet agent with three-tier fallback
 */
async function analyzeBalancedDiet(weeklyPlan, recipesPool, userProfile = {}, history = []) {
  const input = {
    weeklyPlan,
    recipesPool,
    userProfile,
    history
  };
  
  // Tier 1: Try Python agent with Gemini
  try {
    const result = await callPythonAgent(input);
    if (result && result.updatedWeeklyPlan && result.updatedWeeklyPlan.length > 0) {
      console.log('[Balanced Diet] Tier 1: Python agent with Gemini succeeded');
      return result;
    }
  } catch (err) {
    console.warn('[Balanced Diet] Tier 1 failed:', err.message);
  }
  
  // Tier 2: Retry Python agent once
  try {
    console.log('[Balanced Diet] Tier 2: Retrying Python agent...');
    const result = await callPythonAgent(input);
    if (result && result.updatedWeeklyPlan && result.updatedWeeklyPlan.length > 0) {
      console.log('[Balanced Diet] Tier 2: Python agent retry succeeded');
      return result;
    }
  } catch (err) {
    console.warn('[Balanced Diet] Tier 2 failed:', err.message);
  }
  
  // Tier 3: Fallback to naive JavaScript implementation
  console.log('[Balanced Diet] Tier 3: Using JavaScript fallback');
  return naiveFallback(weeklyPlan, recipesPool, userProfile, history);
}

/**
 * Call the Python balanced diet agent
 */
function callPythonAgent(input) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'balanced_diet_agent.py');
    const pythonProcess = spawn('python3', [scriptPath]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python agent exited with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        
        // Check for errors in the result
        if (result.error && !result.fallbackUsed) {
          reject(new Error(`Agent error: ${result.error}`));
          return;
        }
        
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse agent output: ${err.message}\nOutput: ${stdout}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
    
    // Send input via stdin
    pythonProcess.stdin.write(JSON.stringify(input));
    pythonProcess.stdin.end();
    
    // Timeout after 30 seconds
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Balanced diet analysis timed out'));
    }, 30000);
  });
}

/**
 * Helper function to format history from stored plans
 */
function formatHistoryFromPlans(plans) {
  // Convert stored plans into history format
  return plans.map((plan, index) => ({
    week: index + 1,
    recipes: plan.metadata?.recipesUsed || []
  }));
}

module.exports = {
  analyzeBalancedDiet,
  naiveFallback,
  formatHistoryFromPlans
};

