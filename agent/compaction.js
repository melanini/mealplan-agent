// /agent/compaction.js
const axios = require('axios');

/**
 * Compacts user feedback into structured profile preferences.
 * 
 * Compaction prompt:
 * "You are a profile compactor. Given raw user feedback text about meal preferences, 
 * extract structured data: favoriteCuisines[], dietary[], avoidIngredients[], 
 * maxCookMins (number), preferredMealComplexity (simple|moderate|complex).
 * Return only JSON with these fields."
 * 
 * @param {string} feedbackText - Raw user feedback text
 * @returns {Promise<Object>} Compacted profile data
 */
async function compactFeedbackToProfile(feedbackText) {
  // TODO: Wire to Google Gemini ADK agent for actual LLM-based compaction
  // For now, return manual mapping stub
  
  console.log(`[${new Date().toISOString()}] compaction_started length=${feedbackText.length}`);
  
  const compacted = manualCompactionStub(feedbackText);
  
  console.log(`[${new Date().toISOString()}] compaction_completed fields=${Object.keys(compacted).length}`);
  
  return compacted;
}

/**
 * Manual compaction stub - simple keyword matching.
 * Replace this with LLM agent call in production.
 */
function manualCompactionStub(feedbackText) {
  const lower = feedbackText.toLowerCase();
  const result = {
    favoriteCuisines: [],
    dietary: [],
    avoidIngredients: [],
    maxCookMins: 30,
    preferredMealComplexity: 'moderate'
  };
  
  // Cuisine detection
  const cuisines = ['italian', 'mexican', 'thai', 'mediterranean', 'indian', 'chinese', 'japanese', 'greek'];
  cuisines.forEach(cuisine => {
    if (lower.includes(cuisine)) {
      result.favoriteCuisines.push(cuisine);
    }
  });
  
  // Dietary preferences
  if (lower.includes('vegetarian') || lower.includes('no meat')) {
    result.dietary.push('vegetarian');
  }
  if (lower.includes('vegan')) {
    result.dietary.push('vegan');
  }
  if (lower.includes('gluten-free') || lower.includes('no gluten')) {
    result.dietary.push('gluten-free');
  }
  if (lower.includes('dairy-free') || lower.includes('no dairy') || lower.includes('lactose')) {
    result.dietary.push('dairy-free');
  }
  
  // Avoid ingredients
  const avoidKeywords = ['avoid', 'no ', 'don\'t like', 'dislike', 'allergic'];
  const commonIngredients = ['nuts', 'shellfish', 'eggs', 'soy', 'fish', 'peanuts', 'gluten', 'dairy'];
  
  avoidKeywords.forEach(keyword => {
    if (lower.includes(keyword)) {
      commonIngredients.forEach(ingredient => {
        if (lower.includes(ingredient)) {
          if (!result.avoidIngredients.includes(ingredient)) {
            result.avoidIngredients.push(ingredient);
          }
        }
      });
    }
  });
  
  // Time preferences
  if (lower.includes('quick') || lower.includes('fast') || lower.includes('15 min')) {
    result.maxCookMins = 15;
  } else if (lower.includes('20 min')) {
    result.maxCookMins = 20;
  } else if (lower.includes('30 min')) {
    result.maxCookMins = 30;
  }
  
  // Complexity
  if (lower.includes('simple') || lower.includes('easy') || lower.includes('basic')) {
    result.preferredMealComplexity = 'simple';
  } else if (lower.includes('complex') || lower.includes('elaborate') || lower.includes('gourmet')) {
    result.preferredMealComplexity = 'complex';
  }
  
  return result;
}

/**
 * Merge compacted preferences into existing profile.
 */
function mergePreferences(existingPreferences, compacted) {
  const merged = { ...existingPreferences };
  
  // Merge arrays with deduplication
  if (compacted.favoriteCuisines && compacted.favoriteCuisines.length > 0) {
    merged.favoriteCuisines = [...new Set([
      ...(existingPreferences.favoriteCuisines || []),
      ...compacted.favoriteCuisines
    ])];
  }
  
  if (compacted.dietary && compacted.dietary.length > 0) {
    merged.dietary = [...new Set([
      ...(existingPreferences.dietary || []),
      ...compacted.dietary
    ])];
  }
  
  if (compacted.avoidIngredients && compacted.avoidIngredients.length > 0) {
    merged.avoidIngredients = [...new Set([
      ...(existingPreferences.avoidIngredients || []),
      ...compacted.avoidIngredients
    ])];
  }
  
  // Take most restrictive time constraint
  if (compacted.maxCookMins) {
    merged.maxCookMins = Math.min(
      existingPreferences.maxCookMins || 30,
      compacted.maxCookMins
    );
  }
  
  // Override complexity if specified
  if (compacted.preferredMealComplexity) {
    merged.preferredMealComplexity = compacted.preferredMealComplexity;
  }
  
  return merged;
}

module.exports = {
  compactFeedbackToProfile,
  mergePreferences
};

