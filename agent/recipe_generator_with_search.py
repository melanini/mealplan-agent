#!/usr/bin/env python3
"""
Enhanced Recipe Generator with Google Search
Finds real recipes from the web using Google Search
"""

import sys
import json
from google.genai import types

try:
    import google.generativeai as genai
    from google.adk.tools import google_search
    
    # Configure the model
    model = genai.GenerativeModel(
        'gemini-2.0-flash-exp',
        tools=[google_search]  # Enable Google Search
    )
    
except ImportError as e:
    print(f"Error importing required modules: {e}", file=sys.stderr)
    sys.exit(1)

SYSTEM_PROMPT = """You are a Recipe Discovery Agent with access to Google Search.

Your task:
1. Use Google Search to find real recipes that match user requirements
2. Extract recipe details from search results
3. Format as structured JSON
4. Ensure recipes meet all constraints

CRITICAL RULES:
- Always search Google first for real recipes
- Verify recipe meets time constraints
- Check for avoided ingredients
- Prefer recipes from trusted sites (AllRecipes, Food Network, BBC Good Food, etc.)
- Extract complete ingredient lists and steps
- Return ONLY valid JSON

SEARCH STRATEGY:
- Use specific queries: "[diet] [style] recipe [time] minutes"
- Look for recipes with ratings/reviews
- Prioritize recent recipes
- Check multiple sources if needed
"""

USER_PROMPT_TEMPLATE = """Find a recipe using Google Search with these requirements:

REQUIREMENTS:
- Diet: {diet}
- Avoid: {avoid_ingredients}
- Max cook time: {max_cook_mins} minutes
- Servings: {servings}
- Style: {style}

SEARCH INSTRUCTIONS:
1. Search Google for recipes matching these criteria
2. Find 2-3 candidate recipes
3. Select the best match
4. Extract full recipe details

OUTPUT FORMAT (return ONLY this JSON):
{{
  "id": "r_web_001",
  "title": "Recipe Name from Web",
  "source": "website URL",
  "sourceWebsite": "AllRecipes/FoodNetwork/etc",
  "ingredients": [
    {{"name": "ingredient", "qty": "amount"}},
    ...
  ],
  "steps": [
    "Step 1...",
    "Step 2...",
    ...
  ],
  "cookTimeMins": 25,
  "prepTimeMins": 10,
  "totalTimeMins": 35,
  "servings": 2,
  "tags": ["diet-type", "cuisine", "quick"],
  "rating": 4.5,
  "reviewCount": 234,
  "nutritionInfo": {{
    "calories": 350,
    "protein": "25g",
    "carbs": "45g",
    "fat": "12g"
  }},
  "searchQuery": "the query you used",
  "foundOnWeb": true
}}

VALIDATION:
- Total time <= {max_cook_mins} minutes
- No ingredients from avoid list: {avoid_ingredients}
- Suitable for {diet} diet
- Realistic measurements
- Clear, actionable steps

Use Google Search now to find a real recipe!
"""


def generate_recipe_from_web(input_data):
    """
    Generate recipe by searching the web with Google Search.
    
    Args:
        input_data: Dict with diet, avoidIngredients, maxCookMins, servings, style
        
    Returns:
        Dict with recipe data from web search
    """
    try:
        # Extract parameters
        diet = input_data.get('diet', 'any')
        avoid_ingredients = input_data.get('avoidIngredients', [])
        max_cook_mins = input_data.get('maxCookMins', 30)
        servings = input_data.get('servings', 2)
        style = input_data.get('style', 'any cuisine')
        
        avoid_str = ', '.join(avoid_ingredients) if avoid_ingredients else 'none'
        
        # Create prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(
            diet=diet,
            avoid_ingredients=avoid_str,
            max_cook_mins=max_cook_mins,
            servings=servings,
            style=style
        )
        
        # Generate with Google Search enabled
        response = model.generate_content(
            [SYSTEM_PROMPT, user_prompt],
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,  # Some creativity for recipe selection
                top_p=0.95,
                top_k=40,
                max_output_tokens=2048,
            )
        )
        
        # Extract response
        response_text = response.text.strip()
        
        # Remove markdown if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            lines = lines[1:]  # Remove ```json
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]  # Remove ```
            response_text = '\n'.join(lines)
        
        # Parse JSON
        recipe = json.loads(response_text)
        
        # Validate structure
        required_fields = ['title', 'ingredients', 'steps', 'cookTimeMins']
        for field in required_fields:
            if field not in recipe:
                raise ValueError(f"Missing required field: {field}")
        
        # Add metadata
        recipe['generatedFrom'] = 'web_search'
        recipe['searchEnabled'] = True
        
        return recipe
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}", file=sys.stderr)
        print(f"Raw response: {response_text[:500]}", file=sys.stderr)
        
        # Return fallback
        return create_fallback_recipe(input_data, f"JSON error: {e}")
        
    except Exception as e:
        print(f"Error generating recipe: {e}", file=sys.stderr)
        return create_fallback_recipe(input_data, str(e))


def create_fallback_recipe(input_data, error_msg):
    """Create a basic recipe when search fails."""
    diet = input_data.get('diet', 'any')
    max_cook_mins = input_data.get('maxCookMins', 30)
    servings = input_data.get('servings', 2)
    
    return {
        "id": "r_fallback_001",
        "title": f"Quick {diet.title()} Recipe",
        "source": "generated",
        "ingredients": [
            {"name": "main ingredient", "qty": "as needed"},
            {"name": "seasoning", "qty": "to taste"}
        ],
        "steps": [
            "Prepare ingredients",
            f"Cook for approximately {max_cook_mins} minutes",
            "Serve hot"
        ],
        "cookTimeMins": max_cook_mins,
        "servings": servings,
        "tags": [diet, "simple"],
        "foundOnWeb": False,
        "error": error_msg,
        "fallbackUsed": True
    }


def main():
    """Main entry point."""
    try:
        # Read input
        input_text = sys.stdin.read()
        
        if not input_text.strip():
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
        
        # Parse input
        try:
            input_data = json.loads(input_text)
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON: {str(e)}"}))
            sys.exit(1)
        
        # Generate recipe using web search
        recipe = generate_recipe_from_web(input_data)
        
        # Output
        print(json.dumps(recipe, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

