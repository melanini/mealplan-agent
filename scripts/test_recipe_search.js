#!/usr/bin/env node
/**
 * Test Recipe Generator with Google Search
 */

const { generateRecipeFromWeb } = require('../agent/recipeGeneratorWrapper');

async function testRecipeSearch() {
  console.log('🔍 Testing Recipe Generator with Google Search\n');
  console.log('='.repeat(70));
  
  const testRequirements = {
    diet: 'vegetarian',
    avoidIngredients: ['mushrooms', 'cilantro'],
    maxCookMins: 25,
    servings: 2,
    style: 'Mediterranean'
  };
  
  console.log('Search Requirements:');
  console.log(`  Diet: ${testRequirements.diet}`);
  console.log(`  Avoid: ${testRequirements.avoidIngredients.join(', ')}`);
  console.log(`  Max Time: ${testRequirements.maxCookMins} minutes`);
  console.log(`  Servings: ${testRequirements.servings}`);
  console.log(`  Style: ${testRequirements.style}`);
  console.log('='.repeat(70));
  
  try {
    console.log('\n⏳ Searching Google for recipes...\n');
    const startTime = Date.now();
    
    const recipe = await generateRecipeFromWeb(testRequirements);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Recipe found in ${duration}ms\n`);
    console.log('='.repeat(70));
    
    // Display results
    console.log('\n📖 RECIPE DETAILS:\n');
    
    console.log(`Title: ${recipe.title}`);
    if (recipe.source && recipe.source !== 'generated') {
      console.log(`Source: ${recipe.source}`);
      console.log(`Website: ${recipe.sourceWebsite || 'Unknown'}`);
    }
    
    if (recipe.searchQuery) {
      console.log(`Search Query Used: "${recipe.searchQuery}"`);
    }
    
    console.log(`\nCook Time: ${recipe.cookTimeMins} minutes`);
    if (recipe.prepTimeMins) {
      console.log(`Prep Time: ${recipe.prepTimeMins} minutes`);
      console.log(`Total Time: ${recipe.totalTimeMins} minutes`);
    }
    console.log(`Servings: ${recipe.servings}`);
    
    if (recipe.rating) {
      console.log(`Rating: ${recipe.rating}/5 (${recipe.reviewCount || 0} reviews)`);
    }
    
    console.log(`\nTags: ${(recipe.tags || []).join(', ')}`);
    
    console.log('\n📝 Ingredients:');
    recipe.ingredients.forEach((ing, idx) => {
      console.log(`  ${idx + 1}. ${ing.qty} ${ing.name}`);
    });
    
    console.log('\n👨‍🍳 Instructions:');
    recipe.steps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
    
    if (recipe.nutritionInfo) {
      console.log('\n🥗 Nutrition (per serving):');
      console.log(`  Calories: ${recipe.nutritionInfo.calories}`);
      console.log(`  Protein: ${recipe.nutritionInfo.protein}`);
      console.log(`  Carbs: ${recipe.nutritionInfo.carbs}`);
      console.log(`  Fat: ${recipe.nutritionInfo.fat}`);
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (recipe.foundOnWeb) {
      console.log('\n✅ Recipe successfully fetched from the web!');
    } else if (recipe.fallbackUsed) {
      console.log('\n⚠️  Fallback recipe used (search unavailable)');
      if (recipe.error) {
        console.log(`   Error: ${recipe.error}`);
      }
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run test
console.log('Starting Recipe Search Test...\n');
testRecipeSearch().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

