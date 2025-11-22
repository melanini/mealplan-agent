#!/usr/bin/env node
/**
 * MCP (Model Context Protocol) Server for Mealprep Agent
 * Provides standardized interface for AI agents to collaborate
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Import agent wrappers
const { analyzeWasteReduction } = require('../agent/wasteReductionWrapper');
const { analyzeBalancedDiet, formatHistoryFromPlans } = require('../agent/balancedDietWrapper');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const TOOLS_BASE_URL = process.env.TOOLS_BASE_URL || 'http://localhost';
const AGENT_BASE_URL = process.env.AGENT_BASE_URL || 'http://localhost:4000';

/**
 * MCP Tool Definitions
 * Each agent is exposed as a tool with standardized input/output
 */
const MCP_TOOLS = [
  {
    name: 'recipe_generator',
    description: 'Generate a new recipe based on dietary constraints and preferences',
    inputSchema: {
      type: 'object',
      properties: {
        diet: {
          type: 'string',
          description: 'Dietary preference (e.g., vegan, vegetarian, flexitarian)',
        },
        avoidIngredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredients to avoid',
        },
        maxCookMins: {
          type: 'number',
          description: 'Maximum cooking time in minutes',
        },
        servings: {
          type: 'number',
          description: 'Number of servings',
        },
        style: {
          type: 'string',
          description: 'Cuisine style (e.g., Mediterranean, Asian, Mexican)',
        },
      },
      required: ['diet', 'maxCookMins', 'servings'],
    },
  },
  {
    name: 'meal_planner',
    description: 'Generate a weekly meal plan from a list of recipes',
    inputSchema: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of recipe objects',
        },
        weekdayPreferences: {
          type: 'object',
          description: 'Preferences per weekday (maxCookMins, etc.)',
        },
        constraints: {
          type: 'object',
          description: 'Constraints like avoidIngredients',
        },
      },
      required: ['recipes'],
    },
  },
  {
    name: 'feedback_compactor',
    description: 'Compact free-text user feedback into structured preferences',
    inputSchema: {
      type: 'object',
      properties: {
        feedbackText: {
          type: 'string',
          description: 'Free-text feedback from user',
        },
      },
      required: ['feedbackText'],
    },
  },
  {
    name: 'shopping_normalizer',
    description: 'Normalize and aggregate shopping list ingredients',
    inputSchema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of ingredient strings',
        },
      },
      required: ['ingredients'],
    },
  },
  {
    name: 'waste_reduction',
    description: 'Analyze recipes for waste reduction opportunities',
    inputSchema: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of recipe objects with ingredients',
        },
        userProfile: {
          type: 'object',
          description: 'User profile with intolerances and dislikes',
        },
      },
      required: ['recipes'],
    },
  },
  {
    name: 'balanced_diet',
    description: 'Ensure nutritional balance and prevent recipe repetition',
    inputSchema: {
      type: 'object',
      properties: {
        weeklyPlan: {
          type: 'array',
          items: { type: 'object' },
          description: 'Weekly meal plan to analyze',
        },
        recipesPool: {
          type: 'array',
          items: { type: 'object' },
          description: 'Available recipes for replacements',
        },
        userProfile: {
          type: 'object',
          description: 'User profile with dietary preferences',
        },
        history: {
          type: 'array',
          items: { type: 'object' },
          description: 'Past 4 weeks of meal plans',
        },
      },
      required: ['weeklyPlan', 'recipesPool'],
    },
  },
  {
    name: 'user_profile_manager',
    description: 'Get or update user profile information',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        action: {
          type: 'string',
          enum: ['get', 'update'],
          description: 'Action to perform',
        },
        updates: {
          type: 'object',
          description: 'Profile updates (for update action)',
        },
      },
      required: ['userId', 'action'],
    },
  },
  {
    name: 'recipe_search',
    description: 'Search for recipes based on criteria',
    inputSchema: {
      type: 'object',
      properties: {
        maxCookMins: {
          type: 'number',
          description: 'Maximum cooking time',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recipe tags to filter by',
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredients to exclude',
        },
      },
    },
  },
  {
    name: 'orchestrate_meal_plan',
    description: 'Full orchestration: generate optimized weekly meal plan with all agents',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        weekStart: {
          type: 'string',
          description: 'Week start date (ISO format)',
        },
      },
      required: ['userId'],
    },
  },
];

/**
 * MCP Server Implementation
 */
class MealPrepMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mealprep-agent-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: MCP_TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'recipe_generator':
            return await this.handleRecipeGenerator(args);
          case 'meal_planner':
            return await this.handleMealPlanner(args);
          case 'feedback_compactor':
            return await this.handleFeedbackCompactor(args);
          case 'shopping_normalizer':
            return await this.handleShoppingNormalizer(args);
          case 'waste_reduction':
            return await this.handleWasteReduction(args);
          case 'balanced_diet':
            return await this.handleBalancedDiet(args);
          case 'user_profile_manager':
            return await this.handleUserProfile(args);
          case 'recipe_search':
            return await this.handleRecipeSearch(args);
          case 'orchestrate_meal_plan':
            return await this.handleOrchestration(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message,
                tool: name,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleRecipeGenerator(args) {
    // Call recipe generation Python agent (stub - needs implementation)
    const result = {
      message: 'Recipe generator called',
      input: args,
      status: 'stub_implementation',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleMealPlanner(args) {
    // Call meal planning Python agent (stub - needs implementation)
    const result = {
      message: 'Meal planner called',
      input: args,
      status: 'stub_implementation',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleFeedbackCompactor(args) {
    // Call feedback compaction Python agent (stub - needs implementation)
    const result = {
      message: 'Feedback compactor called',
      input: args,
      status: 'stub_implementation',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleShoppingNormalizer(args) {
    // Call shopping normalizer (already implemented)
    const { normalizeShoppingList } = require('../agent/shoppingNormalizer');
    
    try {
      const result = await normalizeShoppingList(args.ingredients);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Shopping normalizer failed: ${error.message}`);
    }
  }

  async handleWasteReduction(args) {
    const { recipes, userProfile = {} } = args;
    
    try {
      const result = await analyzeWasteReduction(recipes, userProfile);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Waste reduction analysis failed: ${error.message}`);
    }
  }

  async handleBalancedDiet(args) {
    const { weeklyPlan, recipesPool, userProfile = {}, history = [] } = args;
    
    try {
      const result = await analyzeBalancedDiet(
        weeklyPlan,
        recipesPool,
        userProfile,
        history
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Balanced diet analysis failed: ${error.message}`);
    }
  }

  async handleUserProfile(args) {
    const { userId, action, updates } = args;
    const baseUrl = `${TOOLS_BASE_URL}:3000`;
    
    try {
      if (action === 'get') {
        const response = await axios.get(`${baseUrl}/profile/${userId}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } else if (action === 'update') {
        const response = await axios.patch(`${baseUrl}/profile/${userId}`, updates);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      throw new Error(`User profile operation failed: ${error.message}`);
    }
  }

  async handleRecipeSearch(args) {
    const { maxCookMins, tags = [], exclude = [] } = args;
    const baseUrl = `${TOOLS_BASE_URL}:3001`;
    
    try {
      const params = new URLSearchParams();
      if (maxCookMins) params.append('maxCookMins', maxCookMins);
      tags.forEach(tag => params.append('tags', tag));
      exclude.forEach(item => params.append('exclude[]', item));
      
      const response = await axios.get(`${baseUrl}/recipes?${params.toString()}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Recipe search failed: ${error.message}`);
    }
  }

  async handleOrchestration(args) {
    const { userId, weekStart } = args;
    
    try {
      // Call the main agent orchestration endpoint
      const response = await axios.post(`${AGENT_BASE_URL}/plan/generate`, {
        userId,
        weekStart,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Orchestration failed: ${error.message}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Mealprep MCP Server running on stdio');
  }
}

// Start server
if (require.main === module) {
  const server = new MealPrepMCPServer();
  server.start().catch(console.error);
}

module.exports = { MealPrepMCPServer };

