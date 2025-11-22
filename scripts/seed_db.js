const fs = require('fs');
const path = require('path');

const recipesSource = path.resolve(__dirname, '../data/recipes/recipes.json');
const recipesTarget = path.resolve(__dirname, '../tools/recipeTool/recipes.json');
const userProfileDb = path.resolve(__dirname, '../tools/userProfileTool/db.json');

console.log('🌱 Seeding database...\n');

// Seed recipes
try {
  if (!fs.existsSync(recipesSource)) {
    console.error('❌ Source recipes file not found:', recipesSource);
    process.exit(1);
  }

  const recipesContent = fs.readFileSync(recipesSource, 'utf8');
  const recipes = JSON.parse(recipesContent);
  
  fs.writeFileSync(recipesTarget, JSON.stringify(recipes, null, 2));
  console.log(`✅ Seeded ${Array.isArray(recipes) ? recipes.length : 'N/A'} recipes to recipe tool`);
  console.log(`   → ${recipesTarget}\n`);
} catch (err) {
  console.error('❌ Failed to seed recipes:', err.message);
  process.exit(1);
}

// Seed user profile
try {
  const profileData = {
    "melani-123": {
      "id": "melani-123",
      "name": "Melani Ortega",
      "email": "melani@example.com",
      "preferences": {
        "favoriteCuisines": ["Mediterranean", "Thai"],
        "dietary": ["vegetarian"],
        "avoidIngredients": ["gluten", "lactose"],
        "maxCookMins": 30
      }
    }
  };

  fs.writeFileSync(userProfileDb, JSON.stringify(profileData, null, 2));
  console.log('✅ Seeded user profile: melani-123');
  console.log(`   → ${userProfileDb}\n`);
} catch (err) {
  console.error('❌ Failed to seed user profile:', err.message);
  process.exit(1);
}

console.log('🎉 Database seeding completed successfully!\n');
console.log('Next steps:');
console.log('  1. Start all services (userProfileTool, recipeTool, shoppingTool, agent)');
console.log('  2. Run test flow: node scripts/test_flow.js');

