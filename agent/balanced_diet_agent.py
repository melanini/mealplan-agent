#!/usr/bin/env python3
"""
Balanced Diet & Variety Agent for Meal Planning
Ensures nutritional balance and prevents recipe repetition for 4 weeks.
"""

import sys
import json
from google.genai import types

# Initialize Gemini model
try:
    import google.generativeai as genai
    
    # Configure the model
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
except ImportError as e:
    print(f"Error importing required modules: {e}", file=sys.stderr)
    sys.exit(1)

SYSTEM_PROMPT = """You are a Balanced Diet & Variety Agent for meal planning. Your goal is to ensure users eat a nutritionally balanced diet while avoiding recipe repetition for at least 4 weeks.

CORE RESPONSIBILITIES:
1. Analyze weekly meal plans for nutritional balance
2. Ensure no recipe repeats from the past 4 weeks (28 days)
3. Maintain variety in ingredients, cuisines, and cooking styles
4. Respect user dietary restrictions and preferences
5. Meet target macronutrient ratios (protein/carbs/fat)

NUTRITIONAL GUIDELINES:
- Protein: Essential for muscle, typically 20-30% of diet
- Carbs: Primary energy source, typically 45-55% of diet
- Fat: Essential nutrients, typically 20-30% of diet
- Variety: Different main ingredients (proteins, grains, vegetables)
- Cuisine diversity: Mix of cooking styles (Mediterranean, Asian, etc.)

RECIPE TAGGING SYSTEM:
- Protein sources: chicken, beef, fish, legumes, tofu, eggs
- Carb sources: pasta, rice, bread, potatoes, quinoa
- Vegetable types: leafy greens, root vegetables, cruciferous
- Cuisines: Italian, Asian, Mexican, Mediterranean, etc.

REPLACEMENT LOGIC:
1. Check if recipe used in past 4 weeks → replace
2. Check if macros are imbalanced → suggest better option
3. Check for variety issues → diversify ingredients/cuisine
4. ALWAYS respect intolerances and dislikes
5. Provide clear, human-readable explanations

CRITICAL RULES:
- NEVER suggest recipes with user's intolerance ingredients
- NEVER suggest recipes with user's disliked ingredients
- Return ONLY valid JSON, no markdown, no explanations
- Provide specific, actionable recommendations
- Consider the full day's nutrition, not just individual meals
"""

USER_PROMPT_TEMPLATE = """Analyze this weekly meal plan for balance and variety:

INPUT:
{input_json}

ANALYSIS CHECKLIST:
1. Extract all recipe IDs from history (past 4 weeks)
2. Identify which recipes in current plan were used recently
3. Calculate current macro ratios from recipe tags
4. Compare to user's preferred macros: {preferred_macros}
5. Check for cuisine/ingredient variety
6. Identify replacement needs
7. Select appropriate replacements from recipes pool
8. Ensure replacements respect: {dietary_restrictions}
9. Never suggest disliked ingredients: {dislikes}

OUTPUT FORMAT (return ONLY this JSON structure, no other text):
{{
  "updatedWeeklyPlan": [
    {{
      "day": "monday",
      "mealType": "lunch",
      "recipe": {{
        "id": "r_xxx",
        "title": "Recipe Name",
        "tags": ["tag1", "tag2"]
      }},
      "notes": "optional explanation for changes"
    }}
  ],
  "replacements": [
    {{
      "day": "monday",
      "mealType": "lunch",
      "originalRecipeId": "r_001",
      "originalRecipeTitle": "Original Name",
      "newRecipeId": "r_010",
      "newRecipeTitle": "New Name",
      "reason": "specific reason for replacement"
    }}
  ],
  "metrics": {{
    "proteinRatio": 0.25,
    "carbsRatio": 0.50,
    "fatRatio": 0.25,
    "replacementsCount": 2,
    "varietyScore": "high/medium/low",
    "cuisineDiversity": ["Italian", "Asian", "Mexican"],
    "repeatedRecipes": 0
  }},
  "recommendations": [
    "human-readable recommendation 1",
    "human-readable recommendation 2"
  ]
}}

MACRO RATIO ESTIMATION RULES:
- "protein-rich" tag → high protein (40% protein, 30% carbs, 30% fat)
- "carbs" or "pasta" or "rice" tag → high carbs (15% protein, 60% carbs, 25% fat)
- "healthy-fat" or "avocado" tag → high fat (20% protein, 30% carbs, 50% fat)
- "balanced" tag → even distribution (30% protein, 40% carbs, 30% fat)
- Average all meals in the day to get daily macros

VARIETY SCORING:
- High: 7+ different main ingredients, 3+ cuisines
- Medium: 5-6 different main ingredients, 2-3 cuisines
- Low: <5 different main ingredients, 1-2 cuisines

Return ONLY the JSON output, nothing else."""


def analyze_diet_balance(input_data):
    """
    Analyze meal plan for nutritional balance and variety.
    
    Args:
        input_data: Dict containing weekly plan, recipes pool, user profile, and history
        
    Returns:
        Dict with updated plan, replacements, and metrics
    """
    try:
        # Extract user preferences for the prompt
        user_profile = input_data.get('userProfile', {})
        intolerances = user_profile.get('intolerances', [])
        dislikes = user_profile.get('dislikes', [])
        preferred_macros = user_profile.get('preferredMacros', {
            'protein': 0.25,
            'carbs': 0.50,
            'fat': 0.25
        })
        
        dietary_restrictions = ', '.join(intolerances) if intolerances else 'none'
        dislikes_str = ', '.join(dislikes) if dislikes else 'none'
        preferred_macros_str = f"Protein: {preferred_macros.get('protein', 0.25)*100}%, Carbs: {preferred_macros.get('carbs', 0.50)*100}%, Fat: {preferred_macros.get('fat', 0.25)*100}%"
        
        # Format the input
        input_json = json.dumps(input_data, indent=2)
        
        # Create the full prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(
            input_json=input_json,
            preferred_macros=preferred_macros_str,
            dietary_restrictions=dietary_restrictions,
            dislikes=dislikes_str
        )
        
        # Generate content using Gemini
        response = model.generate_content(
            [SYSTEM_PROMPT, user_prompt],
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,  # Slightly higher for creative recipe suggestions
                top_p=0.95,
                top_k=40,
                max_output_tokens=3072,
            )
        )
        
        # Extract the response text
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            # Remove first line (```json or ```)
            lines = lines[1:]
            # Remove last line (```)
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            response_text = '\n'.join(lines)
        
        # Parse JSON response
        result = json.loads(response_text)
        
        # Validate structure
        required_keys = ['updatedWeeklyPlan', 'replacements', 'metrics']
        for key in required_keys:
            if key not in result:
                if key == 'updatedWeeklyPlan':
                    result[key] = input_data.get('weeklyPlan', [])
                else:
                    result[key] = [] if key == 'replacements' else {}
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse JSON from LLM response: {e}", file=sys.stderr)
        print(f"Raw response: {response_text}", file=sys.stderr)
        # Return a fallback structure
        return create_fallback_response(input_data, str(e))
    except Exception as e:
        print(f"Error in diet balance analysis: {e}", file=sys.stderr)
        return create_fallback_response(input_data, str(e))


def create_fallback_response(input_data, error_msg):
    """Create a fallback response when the agent fails."""
    weekly_plan = input_data.get('weeklyPlan', [])
    history = input_data.get('history', [])
    
    # Extract recently used recipe IDs (naive check)
    recent_ids = set()
    for week in history[-4:]:  # Last 4 weeks
        recent_ids.update(week.get('recipes', []))
    
    # Simple check for repeated recipes
    replacements = []
    for meal in weekly_plan:
        recipe = meal.get('recipe', {})
        if recipe.get('id') in recent_ids:
            replacements.append({
                'day': meal.get('day'),
                'mealType': meal.get('mealType'),
                'originalRecipeId': recipe.get('id'),
                'originalRecipeTitle': recipe.get('title'),
                'newRecipeId': 'replacement_needed',
                'newRecipeTitle': 'Please select alternative',
                'reason': 'Recipe used in past 4 weeks'
            })
    
    return {
        "updatedWeeklyPlan": weekly_plan,
        "replacements": replacements,
        "metrics": {
            "proteinRatio": 0.25,
            "carbsRatio": 0.50,
            "fatRatio": 0.25,
            "replacementsCount": len(replacements),
            "varietyScore": "unknown",
            "cuisineDiversity": [],
            "repeatedRecipes": len(replacements)
        },
        "recommendations": [
            "Unable to generate detailed recommendations due to error",
            f"Error: {error_msg}",
            "Manual review recommended for nutritional balance"
        ],
        "error": error_msg,
        "fallbackUsed": True
    }


def main():
    """Main entry point for the balanced diet agent."""
    try:
        # Read input from stdin
        input_text = sys.stdin.read()
        
        if not input_text.strip():
            print(json.dumps({
                "error": "No input provided",
                "updatedWeeklyPlan": [],
                "replacements": [],
                "metrics": {}
            }))
            sys.exit(1)
        
        # Parse input JSON
        try:
            input_data = json.loads(input_text)
        except json.JSONDecodeError as e:
            print(json.dumps({
                "error": f"Invalid JSON input: {str(e)}",
                "updatedWeeklyPlan": [],
                "replacements": [],
                "metrics": {}
            }))
            sys.exit(1)
        
        # Validate input structure
        if 'weeklyPlan' not in input_data:
            print(json.dumps({
                "error": "Input must contain 'weeklyPlan' array",
                "updatedWeeklyPlan": [],
                "replacements": [],
                "metrics": {}
            }))
            sys.exit(1)
        
        # Run balanced diet analysis
        result = analyze_diet_balance(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "updatedWeeklyPlan": [],
            "replacements": [],
            "metrics": {}
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

