/**
 * A2A Protocol Integration Example
 * Shows how to integrate A2A with existing agents
 */

const {
  A2AAgent,
  AgentCapability,
  globalProtocol
} = require('./a2a_protocol');

/**
 * Wrap existing agents with A2A protocol
 */

// Recipe Generator Agent
class RecipeGeneratorAgent extends A2AAgent {
  constructor() {
    super('recipe-generator', [AgentCapability.RECIPE_GENERATION], globalProtocol);
    this.register('http://localhost:3001/recipes/generate');
    
    // Register message handlers
    this.onMessage('generate_recipe', this.handleGenerateRecipe.bind(this));
    this.onMessage('search_recipe', this.handleSearchRecipe.bind(this));
  }

  async handleGenerateRecipe(data, message) {
    const { generateRecipeFromWeb } = require('./recipeGeneratorWrapper');
    
    console.log(`[RecipeGenerator] Generating recipe for: ${data.diet}`);
    
    const recipe = await generateRecipeFromWeb(data);
    
    // Notify other agents
    this.notify('meal-planner', 'recipe_generated', { recipe });
    
    return recipe;
  }

  async handleSearchRecipe(data, message) {
    // Implementation
    return { status: 'searching', query: data.query };
  }
}

// Waste Reduction Agent
class WasteReductionAgent extends A2AAgent {
  constructor() {
    super('waste-reduction', [AgentCapability.WASTE_REDUCTION], globalProtocol);
    this.register('http://localhost:4000/waste-reduction');
    
    this.onMessage('analyze_waste', this.handleAnalyzeWaste.bind(this));
    this.onMessage('suggest_substitutions', this.handleSubstitutions.bind(this));
  }

  async handleAnalyzeWaste(data, message) {
    const { analyzeWasteReduction } = require('./wasteReductionWrapper');
    
    console.log(`[WasteReduction] Analyzing ${data.recipes.length} recipes`);
    
    const analysis = await analyzeWasteReduction(
      data.recipes,
      data.userProfile || {}
    );
    
    // Notify shopping normalizer if significant waste found
    if (analysis.estimatedWasteReduction && parseFloat(analysis.estimatedWasteReduction) > 10) {
      this.notify('shopping-normalizer', 'high_waste_detected', {
        wasteReduction: analysis.estimatedWasteReduction,
        substitutions: analysis.substitutionSuggestions
      });
    }
    
    return analysis;
  }

  async handleSubstitutions(data, message) {
    // Implementation
    return { substitutions: [] };
  }
}

// Balanced Diet Agent
class BalancedDietAgent extends A2AAgent {
  constructor() {
    super('balanced-diet', [AgentCapability.BALANCED_DIET], globalProtocol);
    this.register('http://localhost:4000/balanced-diet');
    
    this.onMessage('analyze_balance', this.handleAnalyzeBalance.bind(this));
    this.onMessage('check_repetition', this.handleCheckRepetition.bind(this));
  }

  async handleAnalyzeBalance(data, message) {
    const { analyzeBalancedDiet } = require('./balancedDietWrapper');
    
    console.log(`[BalancedDiet] Analyzing meal plan for balance`);
    
    const analysis = await analyzeBalancedDiet(
      data.weeklyPlan,
      data.recipesPool,
      data.userProfile || {},
      data.history || []
    );
    
    // Request waste reduction if replacements were made
    if (analysis.replacements && analysis.replacements.length > 0) {
      const wasteAgent = this.discover(AgentCapability.WASTE_REDUCTION);
      if (wasteAgent.payload.agents.length > 0) {
        const wasteAgentId = wasteAgent.payload.agents[0].id;
        
        // Send request to waste reduction agent
        await this.request(wasteAgentId, 'analyze_waste', {
          recipes: analysis.optimizedRecipes || data.weeklyPlan,
          userProfile: data.userProfile
        });
      }
    }
    
    return analysis;
  }

  async handleCheckRepetition(data, message) {
    // Implementation
    return { hasRepetition: false };
  }
}

// Meal Planner Agent
class MealPlannerAgent extends A2AAgent {
  constructor() {
    super('meal-planner', [AgentCapability.MEAL_PLANNING], globalProtocol);
    this.register('http://localhost:4000/plan');
    
    this.onMessage('generate_plan', this.handleGeneratePlan.bind(this));
    this.onMessage('recipe_generated', this.handleRecipeGenerated.bind(this));
  }

  async handleGeneratePlan(data, message) {
    console.log(`[MealPlanner] Generating plan for user: ${data.userId}`);
    
    // Discover recipe generator
    const recipeAgents = this.discover(AgentCapability.RECIPE_GENERATION);
    if (recipeAgents.payload.agents.length === 0) {
      throw new Error('No recipe generator available');
    }
    
    const recipeAgentId = recipeAgents.payload.agents[0].id;
    
    // Request recipes for the week (parallel)
    const recipeRequests = [];
    for (let i = 0; i < 7; i++) {
      recipeRequests.push(
        this.request(recipeAgentId, 'generate_recipe', {
          diet: data.diet,
          avoidIngredients: data.avoidIngredients,
          maxCookMins: data.maxCookMins,
          servings: data.servings,
          style: data.style || 'any'
        })
      );
    }
    
    const recipes = await Promise.all(recipeRequests);
    
    // Create week plan
    const weekPlan = recipes.map((response, idx) => ({
      day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx],
      recipe: response.payload.result
    }));
    
    // Request balance analysis
    const balancedAgents = this.discover(AgentCapability.BALANCED_DIET);
    if (balancedAgents.payload.agents.length > 0) {
      const balancedAgentId = balancedAgents.payload.agents[0].id;
      
      const balanceResponse = await this.request(balancedAgentId, 'analyze_balance', {
        weeklyPlan: weekPlan,
        recipesPool: recipes.map(r => r.payload.result),
        userProfile: data.userProfile,
        history: data.history || []
      });
      
      return {
        weekPlan: balanceResponse.payload.result.updatedWeeklyPlan || weekPlan,
        metrics: balanceResponse.payload.result.metrics
      };
    }
    
    return { weekPlan };
  }

  handleRecipeGenerated(data, message) {
    // Handle notification from recipe generator
    console.log(`[MealPlanner] Received recipe: ${data.recipe.title}`);
  }
}

// Shopping Normalizer Agent
class ShoppingNormalizerAgent extends A2AAgent {
  constructor() {
    super('shopping-normalizer', [AgentCapability.SHOPPING_NORMALIZATION], globalProtocol);
    this.register('http://localhost:3002/shopping');
    
    this.onMessage('normalize_list', this.handleNormalizeList.bind(this));
    this.onMessage('high_waste_detected', this.handleWasteNotification.bind(this));
  }

  async handleNormalizeList(data, message) {
    const { normalizeShoppingList } = require('./shoppingNormalizer');
    
    console.log(`[ShoppingNormalizer] Normalizing shopping list`);
    
    const normalized = await normalizeShoppingList(data.ingredients);
    
    return normalized;
  }

  handleWasteNotification(data, message) {
    // Handle notification from waste reduction
    console.log(`[ShoppingNormalizer] High waste detected: ${data.wasteReduction}`);
    // Could adjust shopping list based on waste data
  }
}

/**
 * Initialize all agents with A2A protocol
 */
function initializeA2AAgents() {
  console.log('[A2A] Initializing agents...');
  
  const recipeGenerator = new RecipeGeneratorAgent();
  const wasteReduction = new WasteReductionAgent();
  const balancedDiet = new BalancedDietAgent();
  const mealPlanner = new MealPlannerAgent();
  const shoppingNormalizer = new ShoppingNormalizerAgent();
  
  // Set up protocol event listeners
  globalProtocol.on('request_received', async (message) => {
    console.log(`[A2A] Request received: ${message.sender} -> ${message.recipient}: ${message.payload.action}`);
    
    // Route to appropriate agent
    const agents = {
      'recipe-generator': recipeGenerator,
      'waste-reduction': wasteReduction,
      'balanced-diet': balancedDiet,
      'meal-planner': mealPlanner,
      'shopping-normalizer': shoppingNormalizer
    };
    
    const agent = agents[message.recipient];
    if (agent) {
      await agent.handleRequest(message);
    }
  });
  
  globalProtocol.on('response_received', (message) => {
    console.log(`[A2A] Response received: ${message.sender} -> ${message.recipient}`);
  });
  
  globalProtocol.on('notification_received', (message) => {
    console.log(`[A2A] Notification: ${message.sender} -> ${message.recipient}: ${message.payload.event}`);
    
    // Route notifications
    const agents = {
      'recipe-generator': recipeGenerator,
      'waste-reduction': wasteReduction,
      'balanced-diet': balancedDiet,
      'meal-planner': mealPlanner,
      'shopping-normalizer': shoppingNormalizer
    };
    
    const agent = agents[message.recipient];
    if (agent) {
      const handler = agent.messageHandlers.get(message.payload.event);
      if (handler) {
        handler.call(agent, message.payload.data, message);
      }
    }
  });
  
  globalProtocol.on('agent_inactive', (data) => {
    console.warn(`[A2A] Agent went inactive: ${data.agentId}`);
  });
  
  console.log('[A2A] All agents initialized with A2A protocol');
  console.log('[A2A] Registry:', globalProtocol.getStats());
  
  return {
    recipeGenerator,
    wasteReduction,
    balancedDiet,
    mealPlanner,
    shoppingNormalizer,
    protocol: globalProtocol
  };
}

/**
 * Example usage
 */
async function exampleA2AUsage() {
  const agents = initializeA2AAgents();
  
  // Example: Meal planner requests a plan
  try {
    const planResponse = await agents.mealPlanner.request(
      'meal-planner', // to itself, but could be another planner
      'generate_plan',
      {
        userId: 'user-123',
        diet: 'vegetarian',
        avoidIngredients: ['mushrooms'],
        maxCookMins: 30,
        servings: 2,
        userProfile: { preferences: {} },
        history: []
      }
    );
    
    console.log('Plan generated:', planResponse);
  } catch (error) {
    console.error('Plan generation failed:', error);
  }
  
  // Get stats
  console.log('\n[A2A] Protocol Statistics:');
  console.log(JSON.stringify(agents.protocol.getStats(), null, 2));
}

module.exports = {
  RecipeGeneratorAgent,
  WasteReductionAgent,
  BalancedDietAgent,
  MealPlannerAgent,
  ShoppingNormalizerAgent,
  initializeA2AAgents,
  exampleA2AUsage
};

// Run example if executed directly
if (require.main === module) {
  exampleA2AUsage().catch(console.error);
}

