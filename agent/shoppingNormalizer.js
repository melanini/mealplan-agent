/**
 * Shopping List Normalizer - Node.js Wrapper
 * 
 * Wraps the Python ADK shopping normalizer agent for use in Node.js services.
 * Can be used by the shoppingListTool to produce cleaner, aggregated lists.
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Normalize a shopping list using the AI agent
 * 
 * @param {Array} ingredients - Array of ingredient objects with name, qty, etc.
 * @returns {Promise<Array>} - Normalized and aggregated shopping list
 */
async function normalizeShoppingList(ingredients) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'shopping_normalizer.py');
    const python = spawn('python3', [pythonScript]);
    
    let stdout = '';
    let stderr = '';
    
    // Send ingredients as JSON to Python script via stdin
    python.stdin.write(JSON.stringify(ingredients));
    python.stdin.end();
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python agent error:', stderr);
        // Fallback to basic normalization
        resolve(basicNormalization(ingredients));
        return;
      }
      
      try {
        // Extract JSON from stdout (may have other output)
        const jsonMatch = stdout.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const normalized = JSON.parse(jsonMatch[0]);
          resolve(normalized);
        } else {
          console.warn('No JSON found in agent output, using basic normalization');
          resolve(basicNormalization(ingredients));
        }
      } catch (err) {
        console.error('Error parsing agent response:', err.message);
        resolve(basicNormalization(ingredients));
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      python.kill();
      console.warn('Agent timeout, using basic normalization');
      resolve(basicNormalization(ingredients));
    }, 30000);
  });
}

/**
 * Basic normalization fallback (if AI agent fails)
 * Simple grouping by lowercase name
 */
function basicNormalization(ingredients) {
  const grouped = new Map();
  
  ingredients.forEach(ing => {
    const name = (ing.name || ing.item || '').toLowerCase().trim();
    if (!name) return;
    
    const qty = ing.qty || ing.quantity || '1 unit';
    
    if (grouped.has(name)) {
      const existing = grouped.get(name);
      existing.quantities.push(qty);
    } else {
      grouped.set(name, {
        name: name,
        quantities: [qty],
        notes: ''
      });
    }
  });
  
  // Convert to output format
  return Array.from(grouped.values())
    .map(item => ({
      name: item.name,
      qty: item.quantities.join(', '),
      notes: item.notes
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Enhanced normalization that can be used directly without AI
 * (for when Python/AI is not available)
 */
function enhancedNormalization(ingredients) {
  const grouped = new Map();
  
  ingredients.forEach(ing => {
    let name = (ing.name || ing.item || '').toLowerCase().trim();
    const qty = ing.qty || ing.quantity || '1 unit';
    let notes = '';
    
    // Extract notes from name
    const notePatterns = [
      { pattern: /\b(fresh|dried|frozen|canned|crushed|diced|chopped|minced|sliced)\b/gi, type: 'prep' },
      { pattern: /\b(ground|whole|raw)\b/gi, type: 'form' }
    ];
    
    notePatterns.forEach(({ pattern }) => {
      const matches = name.match(pattern);
      if (matches) {
        notes = matches.join(', ').toLowerCase();
        matches.forEach(match => {
          name = name.replace(new RegExp(`\\b${match}\\b`, 'gi'), '').trim();
        });
      }
    });
    
    // Clean up extra spaces
    name = name.replace(/\s+/g, ' ').trim();
    
    // Normalize common variations
    const normalizations = {
      'chickpeas': ['garbanzo beans', 'garbanzos', 'chick peas'],
      'bell pepper': ['bell peppers', 'sweet pepper', 'sweet peppers'],
      'olive oil': ['oil (olive)', 'extra virgin olive oil'],
      'tomato': ['tomatoes'],
      'onion': ['onions'],
      'garlic': ['garlic clove', 'garlic cloves', 'clove of garlic', 'cloves garlic']
    };
    
    for (const [standard, variations] of Object.entries(normalizations)) {
      if (variations.some(v => name.includes(v))) {
        name = standard;
        break;
      }
    }
    
    const key = `${name}-${notes}`;
    
    if (grouped.has(key)) {
      const existing = grouped.get(key);
      existing.quantities.push(qty);
    } else {
      grouped.set(key, {
        name,
        quantities: [qty],
        notes
      });
    }
  });
  
  // Convert to output format
  return Array.from(grouped.values())
    .map(item => ({
      name: item.name,
      qty: item.quantities.length > 1 
        ? item.quantities.join(' + ') 
        : item.quantities[0],
      notes: item.notes
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
  normalizeShoppingList,
  basicNormalization,
  enhancedNormalization
};

