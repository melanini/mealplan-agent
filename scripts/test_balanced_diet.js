#!/usr/bin/env node
/**
 * Test script for the Balanced Diet & Variety Agent
 * Tests the agent's ability to ensure nutritional balance and prevent repetition
 */

const { analyzeBalancedDiet } = require('../agent/balancedDietWrapper');

// Sample test data
const testWeeklyPlan = [
  {
    day: "monday",
    mealType: "lunch",
    recipe: { id: "r_001", title: "Chickpea Curry", tags: ["vegan", "protein-rich", "indian"] }
  },
  {
    day: "monday",
    mealType: "dinner",
    recipe: { id: "r_002", title: "Tomato Pasta", tags: ["vegetarian", "carbs", "italian"] }
  },
  {
    day: "tuesday",
    mealType: "lunch",
    recipe: { id: "r_003", title: "Greek Salad", tags: ["vegetarian", "healthy-fat", "mediterranean"] }
  },
  {
    day: "tuesday",
    mealType: "dinner",
    recipe: { id: "r_001", title: "Chickpea Curry", tags: ["vegan", "protein-rich", "indian"] } // REPEAT!
  },
  {
    day: "wednesday",
    mealType: "lunch",
    recipe: { id: "r_004", title: "Chicken Stir-Fry", tags: ["protein-rich", "balanced", "asian"] }
  },
  {
    day: "wednesday",
    mealType: "dinner",
    recipe: { id: "r_005", title: "Beef Tacos", tags: ["protein-rich", "mexican"] }
  }
];

const testRecipesPool = [
  { id: "r_001", title: "Chickpea Curry", tags: ["vegan", "protein-rich", "indian"], ingredients: [] },
  { id: "r_002", title: "Tomato Pasta", tags: ["vegetarian", "carbs", "italian"], ingredients: [] },
  { id: "r_003", title: "Greek Salad", tags: ["vegetarian", "healthy-fat", "mediterranean"], ingredients: [] },
  { id: "r_004", title: "Chicken Stir-Fry", tags: ["protein-rich", "balanced", "asian"], ingredients: [] },
  { id: "r_005", title: "Beef Tacos", tags: ["protein-rich", "mexican"], ingredients: [] },
  { id: "r_006", title: "Lentil Stew", tags: ["vegan", "protein-rich", "comfort-food"], ingredients: [] },
  { id: "r_007", title: "Quinoa Bowl", tags: ["vegan", "balanced", "healthy"], ingredients: [] },
  { id: "r_008", title: "Salmon Teriyaki", tags: ["protein-rich", "healthy-fat", "asian"], ingredients: [] },
  { id: "r_009", title: "Veggie Pizza", tags: ["vegetarian", "carbs", "italian"], ingredients: [] },
  { id: "r_010", title: "Tofu Scramble", tags: ["vegan", "protein-rich", "breakfast"], ingredients: [] }
];

const testUserProfile = {
  intolerances: ["gluten"],
  dislikes: ["cilantro"],
  preferredMacros: {
    protein: 0.30,
    carbs: 0.45,
    fat: 0.25
  },
  dietary: ["healthy", "quick"]
};

// Simulate past 4 weeks of history with r_001 appearing in week 3
const testHistory = [
  { week: 1, recipes: ["r_010", "r_009", "r_008", "r_007"] },
  { week: 2, recipes: ["r_006", "r_007", "r_008", "r_009"] },
  { week: 3, recipes: ["r_001", "r_003", "r_004", "r_005"] }, // r_001 was used here!
  { week: 4, recipes: ["r_006", "r_007", "r_008", "r_009"] }
];

async function runTest() {
  console.log('🧪 Testing Balanced Diet & Variety Agent\n');
  console.log('='.repeat(70));
  console.log('Input Weekly Plan:');
  testWeeklyPlan.forEach(meal => {
    console.log(`  ${meal.day} ${meal.mealType}: ${meal.recipe.title} (${meal.recipe.id})`);
  });
  
  console.log('\nUser Preferences:');
  console.log(`  Preferred Macros: P:${testUserProfile.preferredMacros.protein*100}% C:${testUserProfile.preferredMacros.carbs*100}% F:${testUserProfile.preferredMacros.fat*100}%`);
  console.log(`  Intolerances: ${testUserProfile.intolerances.join(', ')}`);
  console.log(`  Dislikes: ${testUserProfile.dislikes.join(', ')}`);
  
  console.log('\nRecent History (Past 4 Weeks):');
  testHistory.forEach(week => {
    console.log(`  Week ${week.week}: ${week.recipes.join(', ')}`);
  });
  
  console.log('\n⚠️  Issues to Detect:');
  console.log('  • r_001 (Chickpea Curry) repeats TWICE in current plan');
  console.log('  • r_001 was also used in Week 3 (within 4-week window)');
  console.log('='.repeat(70));
  
  try {
    const startTime = Date.now();
    console.log('\n⏳ Running balanced diet analysis...\n');
    
    const result = await analyzeBalancedDiet(
      testWeeklyPlan,
      testRecipesPool,
      testUserProfile,
      testHistory
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${duration}ms\n`);
    console.log('='.repeat(70));
    
    // Display results
    console.log('\n📊 RESULTS:\n');
    
    // Nutrition metrics
    if (result.metrics) {
      console.log('🥗 Nutritional Balance:');
      console.log(`  Protein: ${(result.metrics.proteinRatio * 100).toFixed(1)}% (target: ${testUserProfile.preferredMacros.protein*100}%)`);
      console.log(`  Carbs: ${(result.metrics.carbsRatio * 100).toFixed(1)}% (target: ${testUserProfile.preferredMacros.carbs*100}%)`);
      console.log(`  Fat: ${(result.metrics.fatRatio * 100).toFixed(1)}% (target: ${testUserProfile.preferredMacros.fat*100}%)`);
      console.log(`  Variety Score: ${result.metrics.varietyScore?.toUpperCase() || 'N/A'}`);
      if (result.metrics.cuisineDiversity) {
        console.log(`  Cuisine Diversity: ${result.metrics.cuisineDiversity.join(', ')}`);
      }
      console.log(`  Repeated Recipes: ${result.metrics.repeatedRecipes || 0}`);
      console.log();
    }
    
    // Replacements
    if (result.replacements && result.replacements.length > 0) {
      console.log(`🔄 Recipe Replacements (${result.replacements.length}):`);
      result.replacements.forEach((replacement, idx) => {
        console.log(`  ${idx + 1}. ${replacement.day} ${replacement.mealType}:`);
        console.log(`     ❌ ${replacement.originalRecipeTitle} (${replacement.originalRecipeId})`);
        console.log(`     ✅ ${replacement.newRecipeTitle} (${replacement.newRecipeId})`);
        console.log(`     💡 Reason: ${replacement.reason}`);
        console.log();
      });
    } else {
      console.log('✅ No replacements needed - plan is already optimal!\n');
    }
    
    // Recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      console.log('💡 Nutritional Recommendations:');
      result.recommendations.forEach((rec, idx) => {
        console.log(`  ${idx + 1}. ${rec}`);
      });
      console.log();
    }
    
    // Updated plan
    if (result.updatedWeeklyPlan && result.updatedWeeklyPlan.length > 0) {
      console.log('📅 Updated Weekly Plan:');
      result.updatedWeeklyPlan.forEach(meal => {
        const notes = meal.notes ? ` (${meal.notes})` : '';
        console.log(`  ${meal.day} ${meal.mealType}: ${meal.recipe.title}${notes}`);
      });
      console.log();
    }
    
    // Fallback indicator
    if (result.fallbackUsed) {
      console.log('⚠️  Note: JavaScript fallback was used (Python agent unavailable)');
      console.log();
    }
    
    console.log('='.repeat(70));
    
    // Analysis summary
    console.log('\n📈 Analysis Summary:');
    const originalRecipeIds = testWeeklyPlan.map(m => m.recipe.id);
    const updatedRecipeIds = result.updatedWeeklyPlan.map(m => m.recipe.id);
    const changedCount = originalRecipeIds.filter((id, idx) => id !== updatedRecipeIds[idx]).length;
    
    console.log(`  Total meals analyzed: ${testWeeklyPlan.length}`);
    console.log(`  Recipes changed: ${changedCount}`);
    console.log(`  Replacements made: ${result.replacements?.length || 0}`);
    console.log(`  Variety score: ${result.metrics?.varietyScore || 'N/A'}`);
    
    // Check if known issues were caught
    const r001Replaced = result.replacements?.some(r => r.originalRecipeId === 'r_001');
    console.log(`\n✓ Test Validation:`);
    console.log(`  ${r001Replaced ? '✅' : '❌'} Detected repeated recipe (r_001)`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
console.log('Starting Balanced Diet Agent Test...\n');
runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

