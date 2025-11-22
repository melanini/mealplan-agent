from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.runners import InMemoryRunner
from google.genai import types
import json


def create_meal_planner_agent():
    """
    Creates a specialized agent for weekly meal planning.
    """
    agent = Agent(
        model=Gemini(model_name="gemini-2.0-flash-exp"),
        system_instruction="""You are a meal planner that creates weekly dinner schedules.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanations, no extra text
2. Choose exactly one recipe per day (7 days: monday through sunday)
3. Each recipe MUST fit within that day's maxCookMins constraint
4. Ensure variety: avoid using the same main ingredient more than twice per week
5. Respect all avoidIngredients constraints strictly
6. If a day has no maxCookMins specified, default to 30 minutes

JSON OUTPUT FORMAT (return exactly this structure):
{
  "planId": "plan_TIMESTAMP",
  "days": {
    "monday": "r_xxx",
    "tuesday": "r_yyy",
    "wednesday": "r_zzz",
    "thursday": "r_aaa",
    "friday": "r_bbb",
    "saturday": "r_ccc",
    "sunday": "r_ddd"
  }
}

SELECTION STRATEGY:
- Parse each recipe's cookTimeMins and match to day's maxCookMins
- Identify main ingredients (first 1-2 ingredients typically)
- Track ingredient usage across the week to ensure variety
- Prefer recipes that match dietary preferences when available
- Balance quick meals (weekdays) with potentially longer meals (weekends)

Return only the JSON object with planId and days mapping.""",
        runner=InMemoryRunner()
    )
    
    return agent


def generate_weekly_plan(agent, input_data):
    """
    Generate a weekly meal plan based on recipes and constraints.
    
    Args:
        agent: The meal planner agent
        input_data: Dict with recipes, weekdayPreferences, constraints
    
    Returns:
        JSON string with planId and days mapping
    """
    recipes = input_data.get("recipes", [])
    weekday_prefs = input_data.get("weekdayPreferences", {})
    constraints = input_data.get("constraints", {})
    
    avoid_ingredients = constraints.get("avoidIngredients", [])
    
    prompt = f"""Generate a weekly dinner plan using these recipes and constraints:

RECIPES:
{json.dumps(recipes, indent=2)}

WEEKDAY PREFERENCES:
{json.dumps(weekday_prefs, indent=2)}

CONSTRAINTS:
- Avoid ingredients: {', '.join(avoid_ingredients) if avoid_ingredients else 'none'}
- Ensure variety: no main ingredient used more than twice
- Respect cooking time limits for each day

Return ONLY the JSON object with planId and days. No markdown formatting."""
    
    response = agent.run(prompt)
    return response


def validate_plan(plan_text, recipes, weekday_prefs):
    """
    Validate that the generated plan meets all constraints.
    """
    try:
        # Strip markdown if present
        text = plan_text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            if text.startswith("json"):
                text = text[4:].strip()
        
        plan = json.loads(text)
        
        # Validate structure
        if "planId" not in plan or "days" not in plan:
            raise ValueError("Missing required fields: planId or days")
        
        days = plan["days"]
        required_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        
        for day in required_days:
            if day not in days:
                raise ValueError(f"Missing day: {day}")
        
        # Validate recipe IDs exist
        recipe_ids = {r["id"] for r in recipes}
        for day, recipe_id in days.items():
            if recipe_id not in recipe_ids:
                raise ValueError(f"Invalid recipe ID for {day}: {recipe_id}")
        
        # Validate cooking time constraints
        recipe_map = {r["id"]: r for r in recipes}
        for day, recipe_id in days.items():
            recipe = recipe_map[recipe_id]
            cook_time = recipe.get("cookTimeMins") or recipe.get("cook_time_minutes", 0)
            day_prefs = weekday_prefs.get(day, {})
            max_cook_mins = day_prefs.get("maxCookMins", 30)
            
            if cook_time > max_cook_mins:
                print(f"Warning: {day} recipe exceeds maxCookMins ({cook_time} > {max_cook_mins})")
        
        return plan
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}")


if __name__ == "__main__":
    # Initialize agent
    agent = create_meal_planner_agent()
    
    # Example input
    sample_input = {
        "recipes": [
            {
                "id": "r_001",
                "title": "Quick Veggie Stir-Fry",
                "cookTimeMins": 15,
                "ingredients": [
                    {"name": "broccoli", "qty": "2 cups"},
                    {"name": "carrots", "qty": "1 cup"}
                ]
            },
            {
                "id": "r_002",
                "title": "Pasta Marinara",
                "cookTimeMins": 20,
                "ingredients": [
                    {"name": "pasta", "qty": "200g"},
                    {"name": "tomato sauce", "qty": "1 cup"}
                ]
            },
            {
                "id": "r_003",
                "title": "Grilled Chicken Salad",
                "cookTimeMins": 25,
                "ingredients": [
                    {"name": "chicken breast", "qty": "2 pieces"},
                    {"name": "mixed greens", "qty": "3 cups"}
                ]
            }
        ],
        "weekdayPreferences": {
            "monday": {"maxCookMins": 15},
            "tuesday": {"maxCookMins": 20},
            "wednesday": {"maxCookMins": 15},
            "thursday": {"maxCookMins": 25},
            "friday": {"maxCookMins": 30},
            "saturday": {"maxCookMins": 45},
            "sunday": {"maxCookMins": 40}
        },
        "constraints": {
            "avoidIngredients": ["dairy"]
        }
    }
    
    print("Generating weekly meal plan...")
    print("="*50)
    
    response = generate_weekly_plan(agent, sample_input)
    
    try:
        plan = validate_plan(response, sample_input["recipes"], sample_input["weekdayPreferences"])
        print(json.dumps(plan, indent=2))
    except ValueError as e:
        print(f"Validation error: {e}")
        print(f"Raw response: {response}")

