const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
const recipesPath = path.resolve(__dirname, '../../data/recipes/recipes.json');

let recipes = [];

function loadRecipes() {
  try {
    const contents = fs.readFileSync(recipesPath, 'utf8');
    const data = JSON.parse(contents);
    recipes = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load recipes:', err.message);
    recipes = [];
  }
}

loadRecipes();

app.use(express.json());

function matchesTags(recipe, tags) {
  if (!tags || tags.length === 0) return true;
  const recipeTags = recipe.tags || [];
  return tags.some(tag => recipeTags.includes(tag));
}

function hasExcludedIngredient(recipe, excluded) {
  if (!excluded || excluded.length === 0) return false;
  const ingredients = recipe.ingredients || [];
  return ingredients.some(ing => {
    const name = ing.name || ing.item || '';
    return excluded.some(ex => name.toLowerCase().includes(ex.toLowerCase()));
  });
}

app.get('/recipes', (req, res) => {
  const { maxCookMins, tags } = req.query;
  let exclude = req.query['exclude[]'];
  if (!Array.isArray(exclude)) {
    exclude = exclude ? [exclude] : [];
  }

  const tagList = tags ? tags.split(',').map(t => t.trim()) : [];
  const maxMins = maxCookMins ? parseInt(maxCookMins, 10) : Infinity;

  const filtered = recipes.filter(recipe => {
    const cookTime = recipe.cookTimeMins || recipe.cook_time_minutes || 0;
    if (cookTime > maxMins) return false;
    if (!matchesTags(recipe, tagList)) return false;
    if (hasExcludedIngredient(recipe, exclude)) return false;
    return true;
  });

  res.json(filtered);
});

app.get('/recipes/:id', (req, res) => {
  const { id } = req.params;
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  res.json(recipe);
});

function generateRecipe(params) {
  const { diet = 'balanced', avoidIngredients = [], maxCookMins = 30, servings = 2, style = 'quick' } = params;
  
  return {
    id: `generated-${Date.now()}`,
    title: `AI-Generated ${style} Recipe`,
    description: `A ${diet} recipe that avoids ${avoidIngredients.join(', ') || 'nothing'} and takes under ${maxCookMins} minutes.`,
    servings,
    cookTimeMins: Math.min(maxCookMins, 25),
    tags: [diet, style],
    ingredients: [
      { name: 'seasonal vegetables', qty: '2 cups' },
      { name: 'olive oil', qty: '1 tbsp' },
      { name: 'herbs', qty: 'to taste' }
    ],
    steps: [
      'Prepare all ingredients.',
      'Cook according to dietary preferences.',
      'Season and serve.'
    ]
  };
}

app.post('/recipes/generate', (req, res) => {
  const { diet, avoidIngredients, maxCookMins, servings, style } = req.body;
  const params = { diet, avoidIngredients, maxCookMins, servings, style };
  const generatedRecipe = generateRecipe(params);
  res.status(201).json(generatedRecipe);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`recipeTool listening on port ${PORT}`);
});

module.exports = app;

