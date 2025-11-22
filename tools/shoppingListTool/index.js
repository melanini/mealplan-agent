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

function normalizeIngredientName(name) {
  return name.toLowerCase().trim();
}

function aggregateIngredients(recipeList) {
  const ingredientMap = new Map();

  recipeList.forEach(recipe => {
    const ingredients = recipe.ingredients || [];
    const recipeRef = recipe.id || recipe.title || 'Unknown';

    ingredients.forEach(ing => {
      const name = ing.name || ing.item || '';
      const qty = ing.qty || ing.quantity || '1 unit';
      const normalized = normalizeIngredientName(name);

      if (!normalized) return;

      if (ingredientMap.has(normalized)) {
        const existing = ingredientMap.get(normalized);
        existing.recipes.push(recipeRef);
        existing.quantities.push(qty);
      } else {
        ingredientMap.set(normalized, {
          name: name,
          normalizedName: normalized,
          quantities: [qty],
          recipes: [recipeRef]
        });
      }
    });
  });

  const aggregated = Array.from(ingredientMap.values()).map(item => ({
    name: item.name,
    qtySuggested: item.quantities.join(', '),
    recipes: [...new Set(item.recipes)]
  }));

  return aggregated;
}

app.post('/shopping/aggregate', (req, res) => {
  const { recipeIds } = req.body;

  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: 'recipeIds must be a non-empty array' });
  }

  const selectedRecipes = recipes.filter(r => recipeIds.includes(r.id));

  if (selectedRecipes.length === 0) {
    return res.status(404).json({ error: 'No recipes found for provided IDs' });
  }

  const shoppingList = aggregateIngredients(selectedRecipes);

  res.json(shoppingList);
});

app.post('/shopping/export/sheets', (req, res) => {
  const { shoppingList, spreadsheetId } = req.body;

  if (!Array.isArray(shoppingList)) {
    return res.status(400).json({ error: 'shoppingList must be an array' });
  }

  if (!spreadsheetId) {
    return res.status(400).json({ error: 'spreadsheetId is required' });
  }

  console.log(`[PLACEHOLDER] Export to Google Sheets: ${spreadsheetId}`);
  console.log(`Items to export: ${shoppingList.length}`);

  res.json({
    success: true,
    message: 'Shopping list export placeholder executed',
    spreadsheetId,
    itemCount: shoppingList.length
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`shoppingListTool listening on port ${PORT}`);
});

module.exports = app;

