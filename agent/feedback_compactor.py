from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.runners import InMemoryRunner
from google.genai import types
import json


def create_feedback_compactor_agent():
    """
    Creates a specialized agent for compacting user feedback into structured preferences.
    """
    agent = Agent(
        model=Gemini(model_name="gemini-2.0-flash-exp"),
        system_instruction="""You are a feedback compactor that extracts structured preferences from user text.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no explanations, no extra text
2. Extract only information explicitly mentioned in the feedback
3. Use empty arrays/objects for fields not mentioned
4. Be conservative - don't infer beyond what's stated

JSON OUTPUT FORMAT (include only fields that apply):
{
  "likes": ["ingredient1", "ingredient2"],
  "dislikes": ["ingredient3"],
  "intolerances": ["lactose", "gluten"],
  "weekdayPreferences": {
    "monday": {"maxCookMins": 10},
    "tuesday": {"maxCookMins": 30}
  },
  "preferredTexture": "crispy",
  "dietaryStyle": "vegetarian"
}

FIELD DEFINITIONS:
- likes: Foods, ingredients, cuisines the user enjoys
- dislikes: Foods the user doesn't like (not allergies)
- intolerances: Allergies or medical restrictions
- weekdayPreferences: Per-day cooking time limits (use lowercase day names)
- preferredTexture: crispy, soft, crunchy, smooth, etc.
- dietaryStyle: vegetarian, vegan, flexitarian, pescatarian, etc.

Return only the JSON object with relevant fields.""",
        runner=InMemoryRunner()
    )
    
    return agent


def compact_user_feedback(agent, feedback_text):
    """
    Compact free-text user feedback into structured JSON.
    
    Args:
        agent: The feedback compactor agent
        feedback_text: Raw user feedback string
    
    Returns:
        JSON string with compacted preferences
    """
    prompt = f"""User feedback: "{feedback_text}"

Return compact JSON with any of: likes[], dislikes[], intolerances[], weekdayPreferences{{}}, preferredTexture, dietaryStyle.

Return JSON only."""
    
    response = agent.run(prompt)
    return response


def validate_and_parse_feedback(response_text):
    """
    Validate and parse the compacted feedback JSON.
    """
    try:
        # Strip markdown if present
        text = response_text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            if text.startswith("json"):
                text = text[4:].strip()
        
        compacted = json.loads(text)
        
        # Validate field types
        if "likes" in compacted and not isinstance(compacted["likes"], list):
            raise ValueError("likes must be an array")
        if "dislikes" in compacted and not isinstance(compacted["dislikes"], list):
            raise ValueError("dislikes must be an array")
        if "intolerances" in compacted and not isinstance(compacted["intolerances"], list):
            raise ValueError("intolerances must be an array")
        if "weekdayPreferences" in compacted and not isinstance(compacted["weekdayPreferences"], dict):
            raise ValueError("weekdayPreferences must be an object")
        
        return compacted
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response: {e}")


if __name__ == "__main__":
    # Initialize agent
    agent = create_feedback_compactor_agent()
    
    # Example feedback
    test_cases = [
        "I'm lactose intolerant and can only cook for 10 minutes on Mondays",
        "I love Italian food but hate mushrooms. I'm vegetarian.",
        "Quick meals on weekdays please - 15 mins max. I enjoy crispy textures.",
        "No gluten, no dairy. I like Mediterranean style food."
    ]
    
    print("Feedback Compaction Examples")
    print("=" * 50)
    
    for feedback in test_cases:
        print(f"\nInput: {feedback}")
        print("-" * 50)
        
        response = compact_user_feedback(agent, feedback)
        
        try:
            compacted = validate_and_parse_feedback(response)
            print(json.dumps(compacted, indent=2))
        except ValueError as e:
            print(f"Error: {e}")
            print(f"Raw response: {response}")
        
        print()

