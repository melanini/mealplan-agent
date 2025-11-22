/**
 * Waste Reduction Agent Wrapper
 * Node.js wrapper for the Python waste reduction agent with fallback logic
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Naive JavaScript fallback for waste reduction analysis
 * Used when Python agent fails
 */
function naiveFallback(recipes, userProfile = {}) {
  const ingredientMap = new Map();
  const intolerances = userProfile.intolerances || [];
  const dislikes = userProfile.dislikes || [];
  
  // Aggregate ingredients across all recipes
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const name = ing.name.toLowerCase().trim();
      if (!ingredientMap.has(name)) {
        ingredientMap.set(name, {
          name: ing.name,
          recipes: [],
          totalQty: ing.qty || '1'
        });
      }
      ingredientMap.get(name).recipes.push(recipe.title);
    });
  });
  
  // Build shopping list with reuse notes
  const shoppingList = Array.from(ingredientMap.values()).map(item => ({
    name: item.name,
    qty: item.totalQty,
    reuseNotes: item.recipes.length > 1 
      ? `Used in ${item.recipes.length} recipes: ${item.recipes.join(', ')}`
      : `Used in ${item.recipes[0]}`,
    packageSize: 'standard',
    estimatedWaste: item.recipes.length > 1 ? 'low' : 'medium'
  }));
  
  return {
    optimizedRecipes: recipes.map(r => ({
      ...r,
      notes: 'Original recipe - no optimizations applied (fallback mode)'
    })),
    shoppingList,
    substitutionSuggestions: [],
    wasteReductionTips: [
      'Store fresh herbs in water like flowers to extend shelf life',
      'Freeze leftover ingredients in portions for future use',
      'Plan recipes that share common ingredients earlier in the week'
    ],
    estimatedWasteReduction: '5-10% (fallback estimates)',
    fallbackUsed: true
  };
}

/**
 * Call Python waste reduction agent with three-tier fallback
 */
async function analyzeWasteReduction(recipes, userProfile = {}) {
  const input = {
    recipes,
    userProfile
  };
  
  // Tier 1: Try Python agent with Gemini
  try {
    const result = await callPythonAgent(input);
    if (result && result.optimizedRecipes && result.optimizedRecipes.length > 0) {
      console.log('[Waste Reduction] Tier 1: Python agent with Gemini succeeded');
      return result;
    }
  } catch (err) {
    console.warn('[Waste Reduction] Tier 1 failed:', err.message);
  }
  
  // Tier 2: Retry Python agent once
  try {
    console.log('[Waste Reduction] Tier 2: Retrying Python agent...');
    const result = await callPythonAgent(input);
    if (result && result.optimizedRecipes && result.optimizedRecipes.length > 0) {
      console.log('[Waste Reduction] Tier 2: Python agent retry succeeded');
      return result;
    }
  } catch (err) {
    console.warn('[Waste Reduction] Tier 2 failed:', err.message);
  }
  
  // Tier 3: Fallback to naive JavaScript implementation
  console.log('[Waste Reduction] Tier 3: Using JavaScript fallback');
  return naiveFallback(recipes, userProfile);
}

/**
 * Call the Python waste reduction agent
 */
function callPythonAgent(input) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'waste_reduction_agent.py');
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
        if (result.error) {
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
      reject(new Error('Waste reduction analysis timed out'));
    }, 30000);
  });
}

module.exports = {
  analyzeWasteReduction,
  naiveFallback
};

