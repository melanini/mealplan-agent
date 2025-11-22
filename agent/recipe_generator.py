from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.runners import InMemoryRunner
from google.genai import types
import json
import time


def create_recipe_generator_agent():
    """
    Creates a specialized agent for generating recipes based on user constraints.
    """
    agent = Agent(
        model=Gemini(model_name="gemini-2.0-flash-exp"),
        system_instruction="""You are a recipe generator that creates practical, simple recipes.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanations, no extra text
2. Use common, accessible ingredients found in typical grocery stores
3. Keep steps simple and clear (3-6 steps maximum)
4. Respect all dietary restrictions and ingredient exclusions strictly
5. Stay within the specified cooking time limit
6. Match the requested style and serving size exactly

JSON OUTPUT FORMAT (return exactly this structure):
{
  "id": "r_xxx",
  "title": "Recipe Name",
  "ingredients": [
    {"name": "ingredient name", "qty": "amount with unit"}
  ],
  "steps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "cookTimeMins": number,
  "tags": ["tag1", "tag2"],
  "servings": number
}

Generate the recipe ID using format: r_ followed by current timestamp.
Include relevant tags based on diet, style, cooking method, and characteristics.
Keep ingredient quantities precise and practical for home cooking.""",
        runner=InMemoryRunner()
    )
    
    return agent


def generate_recipe(agent, constraints):
    """
    Generate a recipe based on user constraints.
    
    Args:
        agent: The recipe generator agent
        constraints: Dict with diet, avoidIngredients, maxCookMins, servings, style
    
    Returns:
        JSON string with the generated recipe
    """
    diet = constraints.get("diet", "balanced")
    avoid = constraints.get("avoidIngredients", [])
    max_mins = constraints.get("maxCookMins", 30)
    servings = constraints.get("servings", 2)
    style = constraints.get("style", "quick")
    
    prompt = f"""Generate a recipe with these exact requirements:

Diet: {diet}
Avoid these ingredients: {', '.join(avoid) if avoid else 'none'}
Maximum cooking time: {max_mins} minutes
Servings: {servings}
Style: {style}

Return ONLY the JSON object. No markdown formatting, no code blocks, no explanations."""
    
    response = agent.run(prompt)
    return response


def validate_and_parse_recipe(response_text):
    """
    Validate and parse the recipe JSON response.
    """
    try:
        # Strip markdown code blocks if present
        text = response_text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            if text.startswith("json"):
                text = text[4:].strip()
        
        recipe = json.loads(text)
        
        # Validate required fields
        required = ["id", "title", "ingredients", "steps", "cookTimeMins", "tags", "servings"]
        for field in required:
            if field not in recipe:
                raise ValueError(f"Missing required field: {field}")
        
        return recipe
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}")


if __name__ == "__main__":
    # Initialize agent
    agent = create_recipe_generator_agent()
    
    # Example input
    user_constraints = {
        "diet": "flexitarian",
        "avoidIngredients": ["gluten", "lactose"],
        "maxCookMins": 25,
        "servings": 2,
        "style": "Mediterranean, quick"
    }
    
    print("Generating recipe with constraints:")
    print(json.dumps(user_constraints, indent=2))
    print("\n" + "="*50 + "\n")
    
    # Generate recipe
    response = generate_recipe(agent, user_constraints)
    
    try:
        recipe = validate_and_parse_recipe(response)
        print(json.dumps(recipe, indent=2))
    except ValueError as e:
        print(f"Error: {e}")
        print(f"Raw response: {response}")

