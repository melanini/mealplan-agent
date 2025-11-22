# 🎭 Mealprep Agent MCP Server

Model Context Protocol (MCP) server for the Mealprep Agent system, enabling AI agents to collaborate seamlessly through a standardized interface.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for AI agents and tools to communicate. It provides:

- **Standardized Tool Interface**: All agents expose the same interface
- **Discoverability**: AI can discover available tools
- **Type Safety**: Well-defined input/output schemas
- **Composability**: Tools can be chained together

## Available Tools

### 🍳 Recipe Generator
Generate new recipes based on dietary constraints.

```json
{
  "name": "recipe_generator",
  "input": {
    "diet": "vegetarian",
    "avoidIngredients": ["mushrooms"],
    "maxCookMins": 25,
    "servings": 2,
    "style": "Mediterranean"
  }
}
```

### 📅 Meal Planner
Arrange recipes into a weekly schedule.

```json
{
  "name": "meal_planner",
  "input": {
    "recipes": [...],
    "weekdayPreferences": {...}
  }
}
```

### 💬 Feedback Compactor
Extract structured preferences from free text.

```json
{
  "name": "feedback_compactor",
  "input": {
    "feedbackText": "Too spicy, I don't like mushrooms"
  }
}
```

### 🛒 Shopping Normalizer
Normalize and aggregate ingredient lists.

```json
{
  "name": "shopping_normalizer",
  "input": {
    "ingredients": ["2 tomatoes", "3 tomato", "1 lb tomatoes"]
  }
}
```

### ♻️ Waste Reduction
Analyze recipes for waste reduction opportunities.

```json
{
  "name": "waste_reduction",
  "input": {
    "recipes": [...],
    "userProfile": {...}
  }
}
```

### 🥗 Balanced Diet
Ensure nutritional balance and prevent repetition.

```json
{
  "name": "balanced_diet",
  "input": {
    "weeklyPlan": [...],
    "recipesPool": [...],
    "history": [...]
  }
}
```

### 👤 User Profile Manager
Get or update user profiles.

```json
{
  "name": "user_profile_manager",
  "input": {
    "userId": "melani-123",
    "action": "get"
  }
}
```

### 🔍 Recipe Search
Search for recipes by criteria.

```json
{
  "name": "recipe_search",
  "input": {
    "maxCookMins": 30,
    "tags": ["vegetarian"],
    "exclude": ["mushrooms"]
  }
}
```

### 🎭 Orchestrate Meal Plan
Full orchestration with all agents.

```json
{
  "name": "orchestrate_meal_plan",
  "input": {
    "userId": "melani-123",
    "weekStart": "2025-11-25"
  }
}
```

## Setup

### Install Dependencies

```bash
cd mcp
npm install
```

### Environment Variables

```bash
# Optional - defaults to localhost
export TOOLS_BASE_URL=http://localhost
export AGENT_BASE_URL=http://localhost:4000
```

### Start MCP Server

```bash
npm start
```

The server runs on stdio (standard input/output) for MCP communication.

## Usage

### With MCP Clients

Any MCP-compatible client can use this server. Example with Claude Desktop:

1. Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mealprep-agent": {
      "command": "node",
      "args": ["/path/to/mealprep-agent/mcp/mcp_server.js"]
    }
  }
}
```

2. Restart Claude Desktop

3. Ask Claude to use the tools:
   ```
   "Generate a meal plan for user melani-123 for next week"
   ```

Claude will automatically call the `orchestrate_meal_plan` tool!

### Programmatically

```javascript
const { MealPrepMCPServer } = require('./mcp_server');

const server = new MealPrepMCPServer();
await server.start();

// Server is now listening on stdio
```

### Command Line Testing

```bash
# List available tools
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp_server.js

# Call a tool
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "waste_reduction",
    "arguments": {
      "recipes": [...],
      "userProfile": {...}
    }
  },
  "id": 2
}' | node mcp_server.js
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 MCP Client                      │
│            (Claude, Custom AI, etc.)            │
└─────────────────────┬───────────────────────────┘
                      │ stdio
                      ▼
         ┌────────────────────────────┐
         │     MCP Server             │
         │  (mcp_server.js)           │
         └────────────┬───────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ┌─────────┐            ┌──────────────┐
    │ Python  │            │ Node.js      │
    │ Agents  │            │ Wrappers     │
    └─────────┘            └──────────────┘
         │                         │
         └────────────┬────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   Backend Services         │
         │ (Recipe, Profile, etc.)    │
         └────────────────────────────┘
```

## Agent Collaboration

### Sequential Flow (Default)

Agents run one after another:

```
Recipe Search → Meal Planner → Balanced Diet → Waste Reduction → Shopping List
```

### Parallel Execution (Advanced)

Some agents can run in parallel:

```
                 ┌─→ Balanced Diet ─┐
Recipe Search ───┤                   ├─→ Merge → Final Plan
                 └─→ Waste Reduction ┘
```

### Iterative Refinement (Future)

Agents iterate to optimize:

```
Initial Plan → Analyze → Refine → Analyze → Refine → Final Plan
      ▲                                               │
      └───────────────────────────────────────────────┘
                    (if not optimal)
```

## Tool Schemas

All tools follow MCP schema format:

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, JSONSchema>;
    required?: string[];
  };
}
```

Output format:

```typescript
interface MCPResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    uri?: string;
  }>;
  isError?: boolean;
}
```

## Error Handling

All tools provide graceful error handling:

```json
{
  "content": [{
    "type": "text",
    "text": "{\"error\": \"Recipe not found\", \"tool\": \"recipe_search\"}"
  }],
  "isError": true
}
```

## Performance

- **Average Tool Call**: 2-4 seconds
- **Orchestration**: 4-6 seconds
- **Timeout**: 30 seconds per agent
- **Fallbacks**: All agents have fallback logic

## Testing

### Run Test Suite

```bash
npm test
```

### Manual Testing

```bash
# Test orchestration
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "orchestrate_meal_plan",
    "arguments": {
      "userId": "test-user",
      "weekStart": "2025-11-25"
    }
  },
  "id": 1
}' | node mcp_server.js
```

## Monitoring

The server logs all operations to stderr (stdout is reserved for MCP protocol):

```javascript
console.error('Tool called:', toolName);
console.error('Execution time:', duration, 'ms');
console.error('Result:', success ? 'success' : 'error');
```

## Extending

### Add a New Tool

1. Define the tool in `MCP_TOOLS` array:

```javascript
{
  name: 'my_new_tool',
  description: 'Does something useful',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string' }
    },
    required: ['param1']
  }
}
```

2. Add handler method:

```javascript
async handleMyNewTool(args) {
  const { param1 } = args;
  
  // Your logic here
  const result = await myAgent.process(param1);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}
```

3. Register in switch statement:

```javascript
case 'my_new_tool':
  return await this.handleMyNewTool(args);
```

## Troubleshooting

### "Agent timeout"
- Increase timeout in agent wrapper
- Check if Python agent is responding
- Verify network connectivity to backend services

### "Tool not found"
- Check tool name spelling
- Run `tools/list` to see available tools
- Restart MCP server

### "Invalid input schema"
- Verify JSON format
- Check required fields
- See tool schema documentation

## Documentation

- **Orchestration Plan**: See `ORCHESTRATION_PLAN.md`
- **Agent Docs**: See individual agent README files
- **MCP Spec**: https://modelcontextprotocol.io/

## License

MIT

---

**Version**: 1.0.0  
**Status**: 🚧 In Development  
**Last Updated**: November 22, 2025

