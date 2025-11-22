#!/usr/bin/env node
/**
 * Test script for the Waste Reduction Agent
 * Tests the agent's ability to optimize ingredient usage and reduce waste
 */

const { analyzeWasteReduction } = require('../agent/wasteReductionWrapper');

// Sample test data with overlapping ingredients
const testRecipes = [
  {
    id: "r_001",
    title: "Chickpea Curry",
    ingredients: [
      { name: "chickpeas", qty: "1 can" },
      { name: "tomato", qty: "2" },
      { name: "onion", qty: "1" },
      { name: "garlic", qty: "3 cloves" },
      { name: "spinach", qty: "1 cup" },
      { name: "curry powder", qty: "2 tbsp" },
      { name: "cilantro", qty: "1/4 cup" }
    ]
  },
  {
    id: "r_002",
    title: "Tomato Pasta",
    ingredients: [
      { name: "pasta", qty: "200g" },
      { name: "tomato", qty: "3" },
      { name: "garlic", qty: "2 cloves" },
      { name: "basil", qty: "1/4 cup" },
      { name: "olive oil", qty: "2 tbsp" }
    ]
  },
  {
    id: "r_003",
    title: "Garlic Shrimp",
    ingredients: [
      { name: "shrimp", qty: "300g" },
      { name: "garlic", qty: "4 cloves" },
      { name: "butter", qty: "2 tbsp" },
      { name: "parsley", qty: "1/4 cup" },
      { name: "lemon", qty: "1" }
    ]
  },
  {
    id: "r_004",
    title: "Spinach Salad",
    ingredients: [
      { name: "spinach", qty: "2 cups" },
      { name: "tomato", qty: "1" },
      { name: "cucumber", qty: "1" },
      { name: "olive oil", qty: "2 tbsp" },
      { name: "lemon", qty: "1/2" }
    ]
  }
];

const testUserProfile = {
  intolerances: ["gluten", "lactose"],
  dislikes: ["cilantro"],
  dietary: ["quick", "healthy"]
};

async function runTest() {
  console.log('🧪 Testing Waste Reduction Agent\n');
  console.log('=' .repeat(60));
  console.log('Input Recipes:');
  testRecipes.forEach(recipe => {
    console.log(`  - ${recipe.title} (${recipe.ingredients.length} ingredients)`);
  });
  console.log('\nUser Profile:');
  console.log(`  - Intolerances: ${testUserProfile.intolerances.join(', ')}`);
  console.log(`  - Dislikes: ${testUserProfile.dislikes.join(', ')}`);
  console.log('=' .repeat(60));
  
  try {
    const startTime = Date.now();
    console.log('\n⏳ Running waste reduction analysis...\n');
    
    const result = await analyzeWasteReduction(testRecipes, testUserProfile);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Analysis completed in ${duration}ms\n`);
    console.log('=' .repeat(60));
    
    // Display results
    console.log('\n📊 RESULTS:\n');
    
    // Optimized recipes
    if (result.optimizedRecipes && result.optimizedRecipes.length > 0) {
      console.log('✨ Optimized Recipes:');
      result.optimizedRecipes.forEach(recipe => {
        console.log(`  📝 ${recipe.title}`);
        if (recipe.notes) {
          console.log(`     💡 ${recipe.notes}`);
        }
      });
      console.log();
    }
    
    // Shopping list
    if (result.shoppingList && result.shoppingList.length > 0) {
      console.log(`🛒 Optimized Shopping List (${result.shoppingList.length} items):`);
      result.shoppingList.forEach(item => {
        console.log(`  • ${item.name}: ${item.qty}`);
        if (item.reuseNotes) {
          console.log(`    ℹ️  ${item.reuseNotes}`);
        }
        if (item.estimatedWaste && item.estimatedWaste !== 'low') {
          console.log(`    ⚠️  Waste level: ${item.estimatedWaste}`);
        }
      });
      console.log();
    }
    
    // Substitution suggestions
    if (result.substitutionSuggestions && result.substitutionSuggestions.length > 0) {
      console.log(`🔄 Substitution Suggestions (${result.substitutionSuggestions.length}):`);
      result.substitutionSuggestions.forEach(sub => {
        console.log(`  • Recipe: ${sub.recipeId}`);
        console.log(`    Replace: ${sub.original} → ${sub.substitute}`);
        console.log(`    Reason: ${sub.reason}`);
        if (sub.qty) {
          console.log(`    Quantity: ${sub.qty}`);
        }
      });
      console.log();
    }
    
    // Waste reduction tips
    if (result.wasteReductionTips && result.wasteReductionTips.length > 0) {
      console.log('💡 Waste Reduction Tips:');
      result.wasteReductionTips.forEach((tip, idx) => {
        console.log(`  ${idx + 1}. ${tip}`);
      });
      console.log();
    }
    
    // Estimated waste reduction
    if (result.estimatedWasteReduction) {
      console.log(`📈 Estimated Waste Reduction: ${result.estimatedWasteReduction}`);
      console.log();
    }
    
    // Fallback indicator
    if (result.fallbackUsed) {
      console.log('⚠️  Note: JavaScript fallback was used (Python agent unavailable)');
      console.log();
    }
    
    console.log('=' .repeat(60));
    
    // Analyze common ingredients
    console.log('\n🔍 Ingredient Analysis:');
    const ingredientCount = new Map();
    testRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const name = ing.name.toLowerCase();
        ingredientCount.set(name, (ingredientCount.get(name) || 0) + 1);
      });
    });
    
    const commonIngredients = Array.from(ingredientCount.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);
    
    if (commonIngredients.length > 0) {
      console.log('Common ingredients across recipes:');
      commonIngredients.forEach(([name, count]) => {
        console.log(`  • ${name}: used in ${count} recipes`);
      });
    } else {
      console.log('No common ingredients found');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
console.log('Starting Waste Reduction Agent Test...\n');
runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

