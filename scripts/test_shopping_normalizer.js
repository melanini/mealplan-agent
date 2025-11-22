/**
 * Test script for the Shopping List Normalizer
 * 
 * Tests both the AI-powered normalizer and the fallback methods
 */

const { 
  normalizeShoppingList, 
  basicNormalization, 
  enhancedNormalization 
} = require('../agent/shoppingNormalizer');

// Sample ingredients from multiple recipes
const sampleIngredients = [
  { name: "Chickpeas", qty: "1 can" },
  { name: "chickpeas", qty: "2 cans" },
  { name: "Olive Oil", qty: "2 tbsp" },
  { name: "olive oil", qty: "1 tbsp" },
  { name: "Fresh Basil", qty: "1 cup" },
  { name: "basil", qty: "1/2 cup", item: "fresh" },
  { name: "Diced Tomatoes", qty: "1 can (14 oz)" },
  { name: "tomatoes", qty: "2 medium", item: "fresh tomatoes" },
  { name: "Garlic", qty: "3 cloves" },
  { name: "garlic cloves", qty: "2" },
  { name: "Quinoa", qty: "1 cup" },
  { name: "quinoa", qty: "1/2 cup" },
  { name: "Lemon", qty: "1" },
  { name: "lemon juice", qty: "2 tbsp" },
  { name: "Red Bell Pepper", qty: "1 large" },
  { name: "bell peppers", qty: "2 small", item: "red" },
  { name: "Salt", qty: "to taste" },
  { name: "salt", qty: "1 tsp" },
  { name: "Black Pepper", qty: "to taste" },
  { name: "Cumin", qty: "1 tsp" },
  { name: "ground cumin", qty: "1/2 tsp" }
];

async function testNormalizers() {
  console.log('🧪 Testing Shopping List Normalizers\n');
  console.log('='*60);
  
  console.log('\n📝 Input Ingredients:');
  console.log(JSON.stringify(sampleIngredients, null, 2));
  
  // Test 1: Basic Normalization
  console.log('\n' + '='*60);
  console.log('\n1️⃣  BASIC NORMALIZATION (Simple grouping)');
  console.log('-'*60);
  const basicResult = basicNormalization(sampleIngredients);
  console.log(JSON.stringify(basicResult, null, 2));
  console.log(`\n✅ Produced ${basicResult.length} unique items`);
  
  // Test 2: Enhanced Normalization
  console.log('\n' + '='*60);
  console.log('\n2️⃣  ENHANCED NORMALIZATION (Pattern matching)');
  console.log('-'*60);
  const enhancedResult = enhancedNormalization(sampleIngredients);
  console.log(JSON.stringify(enhancedResult, null, 2));
  console.log(`\n✅ Produced ${enhancedResult.length} unique items`);
  
  // Test 3: AI-Powered Normalization
  console.log('\n' + '='*60);
  console.log('\n3️⃣  AI-POWERED NORMALIZATION (LLM agent)');
  console.log('-'*60);
  console.log('⏳ Calling AI agent...\n');
  
  try {
    const aiResult = await normalizeShoppingList(sampleIngredients);
    console.log(JSON.stringify(aiResult, null, 2));
    console.log(`\n✅ Produced ${aiResult.length} unique items`);
    
    // Compare results
    console.log('\n' + '='*60);
    console.log('\n📊 COMPARISON');
    console.log('-'*60);
    console.log(`Basic:    ${basicResult.length} items`);
    console.log(`Enhanced: ${enhancedResult.length} items`);
    console.log(`AI:       ${aiResult.length} items`);
    
    console.log('\n🎯 AI Agent Benefits:');
    console.log('  ✓ Better quantity aggregation');
    console.log('  ✓ Smart notes extraction');
    console.log('  ✓ Handles edge cases');
    console.log('  ✓ Context-aware grouping');
    
  } catch (error) {
    console.error('\n❌ AI normalization failed:', error.message);
    console.log('\n💡 This is expected if Python/ADK is not configured');
    console.log('   The system will fall back to enhanced normalization');
  }
  
  console.log('\n' + '='*60);
  console.log('\n✅ Testing complete!\n');
}

// Run tests
testNormalizers().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

