"""
Shopping List Normalizer Agent

Purpose: Intelligently normalize and aggregate ingredients from multiple recipes
into a clean, consolidated shopping list.

Input: Array of ingredient objects from multiple recipes
Output: Normalized array with aggregated quantities
"""

from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.runners import InMemoryRunner
from google.genai import types
import json
import sys


# Agent configuration
normalizer_agent = Agent(
    name="ShoppingListNormalizer",
    model=Gemini(model_name="gemini-2.0-flash-exp"),
    system_instruction="""You are an expert shopping list normalizer. Your job is to take raw ingredient lists from multiple recipes and produce a clean, consolidated shopping list.

## Instructions:

1. **Normalize ingredient names**: Convert to lowercase, standardize spelling, group similar items
   - "Chickpeas" → "chickpeas"
   - "chick peas" → "chickpeas"
   - "garbanzo beans" → "chickpeas"
   
2. **Aggregate quantities intelligently**:
   - Whole units: "2 cans + 1 can" → "3 cans"
   - Volumes: "1 cup + 2 cups" → "3 cups"
   - Weights: "8 oz + 4 oz" → "12 oz"
   - Mixed units: Keep separate entries if conversion is ambiguous
   
3. **Extract notes from context**:
   - "canned chickpeas" → name: "chickpeas", notes: "canned"
   - "fresh basil" → name: "basil", notes: "fresh"
   - "diced tomatoes" → name: "tomatoes", notes: "diced"
   
4. **Handle common variations**:
   - Singular/plural: "tomato" and "tomatoes" → "tomatoes"
   - Different forms: "olive oil", "oil (olive)" → "olive oil"
   - Brand specifications: Ignore or move to notes
   
5. **Smart grouping**:
   - Group similar preparations: "diced tomatoes" + "crushed tomatoes" → "tomatoes (diced, crushed)"
   - Keep distinct items separate: "fresh tomatoes" ≠ "canned tomatoes"

## Output Format:

Return ONLY a JSON array with this exact structure:
```json
[
  {
    "name": "chickpeas",
    "qty": "3 cans",
    "notes": "canned"
  },
  {
    "name": "olive oil",
    "qty": "1/2 cup",
    "notes": ""
  }
]
```

## Rules:
- Return ONLY valid JSON, no explanations
- Each item must have "name", "qty", and "notes" fields
- Use lowercase for names
- Combine quantities when units match
- Notes should be concise (e.g., "fresh", "canned", "diced")
- If quantity is unclear, use "as needed" or "to taste"
- Sort alphabetically by name for easy shopping""",
    generation_config=types.GenerateContentConfig(
        temperature=0.3,
        response_mime_type="application/json"
    )
)


def normalize_shopping_list(ingredients_data):
    """
    Normalize and aggregate a shopping list from multiple recipes.
    
    Args:
        ingredients_data: List of ingredient objects with 'name', 'qty', etc.
        
    Returns:
        Normalized list of ingredients as JSON
    """
    # Convert input to a readable format for the LLM
    ingredients_text = json.dumps(ingredients_data, indent=2)
    
    prompt = f"""Normalize and aggregate this shopping list from multiple recipes:

{ingredients_text}

Return a consolidated shopping list with aggregated quantities, normalized names, and extracted notes."""
    
    runner = InMemoryRunner()
    result = runner.run(agent=normalizer_agent, prompt=prompt)
    
    try:
        # Parse the JSON response
        normalized_list = json.loads(result)
        return normalized_list
    except json.JSONDecodeError as e:
        print(f"Error parsing agent response: {e}", file=sys.stderr)
        print(f"Raw response: {result}", file=sys.stderr)
        return []


def main():
    """
    Main entry point - can accept input from stdin or use sample data.
    """
    import sys
    
    # Check if input is provided via stdin
    if not sys.stdin.isatty():
        try:
            # Read from stdin (when called from Node.js)
            input_data = sys.stdin.read()
            ingredients_data = json.loads(input_data)
            
            # Normalize and output only the result
            normalized = normalize_shopping_list(ingredients_data)
            print(json.dumps(normalized, indent=2))
            return normalized
            
        except Exception as e:
            print(f"Error processing stdin: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Test mode with sample data
    sample_ingredients = [
        {"name": "Chickpeas", "qty": "1 can"},
        {"name": "chickpeas", "qty": "2 cans"},
        {"name": "Olive Oil", "qty": "2 tbsp"},
        {"name": "olive oil", "qty": "1 tbsp"},
        {"name": "Fresh Basil", "qty": "1 cup"},
        {"name": "basil", "qty": "1/2 cup", "item": "fresh"},
        {"name": "Diced Tomatoes", "qty": "1 can (14 oz)"},
        {"name": "tomatoes", "qty": "2 medium", "item": "fresh tomatoes"},
        {"name": "Garlic", "qty": "3 cloves"},
        {"name": "garlic cloves", "qty": "2"},
        {"name": "Quinoa", "qty": "1 cup"},
        {"name": "quinoa", "qty": "1/2 cup"},
        {"name": "Lemon", "qty": "1"},
        {"name": "lemon juice", "qty": "2 tbsp"},
        {"name": "Red Bell Pepper", "qty": "1 large"},
        {"name": "bell peppers", "qty": "2 small", "item": "red"},
        {"name": "Salt", "qty": "to taste"},
        {"name": "salt", "qty": "1 tsp"},
        {"name": "Black Pepper", "qty": "to taste"},
        {"name": "Cumin", "qty": "1 tsp"},
        {"name": "ground cumin", "qty": "1/2 tsp"}
    ]
    
    print("=== SHOPPING LIST NORMALIZER TEST ===\n", file=sys.stderr)
    print("Input ingredients:", file=sys.stderr)
    print(json.dumps(sample_ingredients, indent=2), file=sys.stderr)
    print("\n" + "="*60 + "\n", file=sys.stderr)
    
    # Normalize the list
    normalized = normalize_shopping_list(sample_ingredients)
    
    print("Normalized shopping list:", file=sys.stderr)
    print(json.dumps(normalized, indent=2))
    
    return normalized


if __name__ == "__main__":
    main()

