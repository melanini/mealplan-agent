#!/usr/bin/env python3
"""
Waste Reduction Agent for Meal Planning
Minimizes food waste by optimizing ingredient usage across weekly recipes.
"""

import sys
import json
from google.genai import types
from google.genai.types import GenerateContentConfig, GoogleSearch

# Initialize Gemini model
try:
    import google.generativeai as genai
    
    # Configure the model
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
except ImportError as e:
    print(f"Error importing required modules: {e}", file=sys.stderr)
    sys.exit(1)

SYSTEM_PROMPT = """You are a Waste Reduction Agent for a weekly meal planner. Your goal is to minimize food waste by:

1. Identifying ingredients that appear in multiple recipes in the week and recommending how to consolidate them.
2. Suggesting substitutions when possible so leftover ingredients can be reused across recipes.
3. Highlighting ingredients that are likely to spoil before being fully used and providing replacement options or batch cooking suggestions.
4. Ensuring substitutions respect user dietary restrictions and preferences.

CRITICAL RULES:
- Never suggest ingredients the user is intolerant to or dislikes
- Return ONLY valid JSON, no markdown, no explanations
- Focus on reducing leftover/unused ingredients across the week
- Do not remove ingredients from recipes unless you propose a substitution
- Consider typical package sizes (e.g., herbs come in bunches, vegetables in standard sizes)
- Prioritize fresh ingredients that spoil quickly (herbs, leafy greens, fresh produce)
- Look for opportunities to use partial packages across multiple recipes
- Suggest practical substitutions that maintain the recipe's character

Example reasoning process:
- If a recipe needs 2 tomatoes and another needs 3, suggest buying 5 tomatoes total
- If a recipe needs 1/4 cup cilantro and user dislikes cilantro, suggest parsley
- If spinach appears once but kale appears twice, suggest substituting spinach with kale
- If fresh herbs are used in small amounts, suggest dried alternatives or recipes that use more
"""

USER_PROMPT_TEMPLATE = """Analyze this weekly meal plan and optimize for waste reduction:

INPUT:
{input_json}

OUTPUT FORMAT (return ONLY this JSON structure, no other text):
{{
  "optimizedRecipes": [
    {{
      "id": "recipe_id",
      "title": "Recipe Title",
      "ingredients": [{{"name":"ingredient","qty":"amount"}}],
      "notes": "optional usage notes for waste reduction"
    }}
  ],
  "shoppingList": [
    {{
      "name":"ingredient_name",
      "qty":"total_amount_needed",
      "reuseNotes":"how this ingredient is used across recipes",
      "packageSize":"standard_package_size",
      "estimatedWaste":"low/medium/high if any"
    }}
  ],
  "substitutionSuggestions": [
    {{
      "recipeId":"r_xxx",
      "original":"original_ingredient",
      "substitute":"replacement_ingredient",
      "reason":"waste reduction rationale",
      "qty":"adjusted_quantity"
    }}
  ],
  "wasteReductionTips": [
    "practical tip 1",
    "practical tip 2"
  ],
  "estimatedWasteReduction": "percentage or description"
}}

ANALYSIS CHECKLIST:
1. Identify all ingredients used across recipes
2. Count usage frequency and quantities
3. Consider typical package sizes
4. Flag ingredients used in small quantities
5. Suggest substitutions to consolidate similar ingredients
6. Respect dietary restrictions: {dietary_restrictions}
7. Never suggest disliked ingredients: {dislikes}
8. Optimize shopping list to minimize partial packages
9. Provide practical batch cooking or storage tips

Return ONLY the JSON output, nothing else."""


def analyze_waste_reduction(input_data):
    """
    Analyze recipes and generate waste reduction recommendations.
    
    Args:
        input_data: Dict containing recipes and user profile
        
    Returns:
        Dict with optimized recipes, shopping list, and suggestions
    """
    try:
        # Extract user preferences for the prompt
        user_profile = input_data.get('userProfile', {})
        intolerances = user_profile.get('intolerances', [])
        dislikes = user_profile.get('dislikes', [])
        
        dietary_restrictions = ', '.join(intolerances) if intolerances else 'none'
        dislikes_str = ', '.join(dislikes) if dislikes else 'none'
        
        # Format the input
        input_json = json.dumps(input_data, indent=2)
        
        # Create the full prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(
            input_json=input_json,
            dietary_restrictions=dietary_restrictions,
            dislikes=dislikes_str
        )
        
        # Generate content using Gemini
        response = model.generate_content(
            [SYSTEM_PROMPT, user_prompt],
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,  # Lower temperature for more consistent output
                top_p=0.95,
                top_k=40,
                max_output_tokens=2048,
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
        required_keys = ['optimizedRecipes', 'shoppingList', 'substitutionSuggestions']
        for key in required_keys:
            if key not in result:
                result[key] = []
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse JSON from LLM response: {e}", file=sys.stderr)
        print(f"Raw response: {response_text}", file=sys.stderr)
        # Return a fallback structure
        return {
            "optimizedRecipes": input_data.get('recipes', []),
            "shoppingList": [],
            "substitutionSuggestions": [],
            "wasteReductionTips": ["Unable to generate recommendations. Using original recipes."],
            "estimatedWasteReduction": "0%",
            "error": str(e)
        }
    except Exception as e:
        print(f"Error in waste reduction analysis: {e}", file=sys.stderr)
        return {
            "optimizedRecipes": input_data.get('recipes', []),
            "shoppingList": [],
            "substitutionSuggestions": [],
            "wasteReductionTips": ["Error occurred during analysis. Using original recipes."],
            "estimatedWasteReduction": "0%",
            "error": str(e)
        }


def main():
    """Main entry point for the waste reduction agent."""
    try:
        # Read input from stdin
        input_text = sys.stdin.read()
        
        if not input_text.strip():
            print(json.dumps({
                "error": "No input provided",
                "optimizedRecipes": [],
                "shoppingList": [],
                "substitutionSuggestions": []
            }))
            sys.exit(1)
        
        # Parse input JSON
        try:
            input_data = json.loads(input_text)
        except json.JSONDecodeError as e:
            print(json.dumps({
                "error": f"Invalid JSON input: {str(e)}",
                "optimizedRecipes": [],
                "shoppingList": [],
                "substitutionSuggestions": []
            }))
            sys.exit(1)
        
        # Validate input structure
        if 'recipes' not in input_data or not input_data['recipes']:
            print(json.dumps({
                "error": "Input must contain 'recipes' array",
                "optimizedRecipes": [],
                "shoppingList": [],
                "substitutionSuggestions": []
            }))
            sys.exit(1)
        
        # Run waste reduction analysis
        result = analyze_waste_reduction(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "optimizedRecipes": [],
            "shoppingList": [],
            "substitutionSuggestions": []
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

