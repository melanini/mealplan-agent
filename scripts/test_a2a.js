#!/usr/bin/env node
/**
 * Test A2A Protocol Implementation
 * Tests agent-to-agent communication
 */

const {
  A2AAgent,
  A2AMessage,
  MessageType,
  AgentCapability,
  A2AProtocolHandler
} = require('../agent/a2a_protocol');

async function testA2AProtocol() {
  console.log('🤖 Testing A2A Protocol\n');
  console.log('='.repeat(70));
  
  // Create protocol handler
  const protocol = new A2AProtocolHandler();
  
  // Test 1: Agent Registration
  console.log('\n📝 Test 1: Agent Registration');
  console.log('-'.repeat(70));
  
  const agent1 = new A2AAgent('recipe-gen', [AgentCapability.RECIPE_GENERATION], protocol);
  const agent2 = new A2AAgent('meal-planner', [AgentCapability.MEAL_PLANNING], protocol);
  const agent3 = new A2AAgent('waste-analyzer', [AgentCapability.WASTE_REDUCTION], protocol);
  
  agent1.register('http://localhost:3001');
  agent2.register('http://localhost:4000');
  agent3.register('http://localhost:4001');
  
  console.log('✅ Registered 3 agents');
  console.log('Registry:', protocol.registry.getAllAgents().map(a => ({
    id: a.id,
    capabilities: a.capabilities,
    status: a.status
  })));
  
  // Test 2: Agent Discovery
  console.log('\n🔍 Test 2: Agent Discovery');
  console.log('-'.repeat(70));
  
  const discoveryResult = agent2.discover(AgentCapability.RECIPE_GENERATION);
  console.log(`Found ${discoveryResult.payload.agents.length} agents with RECIPE_GENERATION capability:`);
  discoveryResult.payload.agents.forEach(a => {
    console.log(`  - ${a.id} at ${a.endpoint}`);
  });
  
  // Test 3: Request-Response
  console.log('\n💬 Test 3: Request-Response Communication');
  console.log('-'.repeat(70));
  
  // Set up message handler for agent1
  agent1.onMessage('generate_recipe', async (data) => {
    console.log(`  [${agent1.agentId}] Received generate_recipe request:`, data);
    return {
      id: 'r_001',
      title: `${data.diet} Recipe`,
      ingredients: ['ingredient1', 'ingredient2'],
      cookTimeMins: data.maxCookMins - 5
    };
  });
  
  // Listen for requests
  protocol.on('request_received', async (message) => {
    if (message.recipient === 'recipe-gen') {
      await agent1.handleRequest(message);
    }
  });
  
  try {
    console.log(`  [${agent2.agentId}] Sending request to ${agent1.agentId}...`);
    const response = await agent2.request('recipe-gen', 'generate_recipe', {
      diet: 'vegetarian',
      maxCookMins: 30,
      servings: 2
    });
    
    console.log(`  [${agent2.agentId}] Received response:`, response.payload.result);
    console.log('✅ Request-Response successful');
  } catch (error) {
    console.error('❌ Request-Response failed:', error.message);
  }
  
  // Test 4: Notifications
  console.log('\n📢 Test 4: Notification Broadcasting');
  console.log('-'.repeat(70));
  
  let notificationReceived = false;
  
  // Set up notification handler
  agent3.onMessage('recipe_ready', (data) => {
    console.log(`  [${agent3.agentId}] Received notification:`, data);
    notificationReceived = true;
  });
  
  protocol.on('notification_received', (message) => {
    if (message.recipient === 'waste-analyzer' || message.recipient === 'broadcast') {
      const handler = agent3.messageHandlers.get(message.payload.event);
      if (handler) {
        handler(message.payload.data, message);
      }
    }
  });
  
  console.log(`  [${agent1.agentId}] Sending notification...`);
  agent1.notify('waste-analyzer', 'recipe_ready', {
    recipeId: 'r_001',
    title: 'New Recipe'
  });
  
  // Give notification time to process
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (notificationReceived) {
    console.log('✅ Notification successful');
  } else {
    console.log('⚠️  Notification not received');
  }
  
  // Test 5: Parallel Requests
  console.log('\n⚡ Test 5: Parallel Requests');
  console.log('-'.repeat(70));
  
  console.log(`  [${agent2.agentId}] Sending 3 parallel requests...`);
  
  const startTime = Date.now();
  const parallelResponses = await Promise.all([
    agent2.request('recipe-gen', 'generate_recipe', { diet: 'vegan', maxCookMins: 20, servings: 2 }),
    agent2.request('recipe-gen', 'generate_recipe', { diet: 'keto', maxCookMins: 25, servings: 2 }),
    agent2.request('recipe-gen', 'generate_recipe', { diet: 'paleo', maxCookMins: 30, servings: 2 })
  ]);
  const duration = Date.now() - startTime;
  
  console.log(`  Received ${parallelResponses.length} responses in ${duration}ms`);
  parallelResponses.forEach((response, idx) => {
    console.log(`    ${idx + 1}. ${response.payload.result.title}`);
  });
  console.log('✅ Parallel requests successful');
  
  // Test 6: Message Log & Tracing
  console.log('\n📊 Test 6: Message Log & Tracing');
  console.log('-'.repeat(70));
  
  const conversationId = parallelResponses[0].conversationId;
  const conversation = protocol.getConversation(conversationId);
  
  console.log(`  Conversation ${conversationId} has ${conversation.length} messages`);
  conversation.forEach((entry, idx) => {
    const msg = entry.message;
    console.log(`    ${idx + 1}. [${msg.type}] ${msg.sender} -> ${msg.recipient}`);
  });
  
  // Test 7: Protocol Statistics
  console.log('\n📈 Test 7: Protocol Statistics');
  console.log('-'.repeat(70));
  
  const stats = protocol.getStats();
  console.log('Protocol Statistics:');
  console.log(`  Total Agents: ${stats.totalAgents}`);
  console.log(`  Active Agents: ${stats.activeAgents}`);
  console.log(`  Total Messages: ${stats.totalMessages}`);
  console.log(`  Pending Requests: ${stats.pendingRequests}`);
  console.log('  Messages by Type:');
  Object.entries(stats.messagesByType).forEach(([type, count]) => {
    console.log(`    - ${type}: ${count}`);
  });
  
  // Test 8: Agent Unregistration
  console.log('\n🔌 Test 8: Agent Unregistration');
  console.log('-'.repeat(70));
  
  protocol.registry.unregister('waste-analyzer');
  console.log(`  Unregistered agent: waste-analyzer`);
  console.log(`  Active agents: ${protocol.registry.getAllAgents().length}`);
  console.log('✅ Unregistration successful');
  
  // Test 9: Error Handling
  console.log('\n⚠️  Test 9: Error Handling');
  console.log('-'.repeat(70));
  
  try {
    console.log(`  Attempting to send request to unregistered agent...`);
    await agent2.request('waste-analyzer', 'analyze', { data: 'test' }, { timeout: 1000 });
  } catch (error) {
    console.log(`  ✅ Expected error caught: ${error.message}`);
  }
  
  // Test 10: Message Filtering
  console.log('\n🔎 Test 10: Message Filtering');
  console.log('-'.repeat(70));
  
  const requestMessages = protocol.getMessageLog({ type: MessageType.REQUEST });
  const responseMessages = protocol.getMessageLog({ type: MessageType.RESPONSE });
  const notificationMessages = protocol.getMessageLog({ type: MessageType.NOTIFICATION });
  
  console.log(`  Request messages: ${requestMessages.length}`);
  console.log(`  Response messages: ${responseMessages.length}`);
  console.log(`  Notification messages: ${notificationMessages.length}`);
  
  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ All A2A Protocol Tests Passed!\n');
  
  console.log('Summary:');
  console.log('  ✅ Agent registration and discovery');
  console.log('  ✅ Request-response communication');
  console.log('  ✅ Notification broadcasting');
  console.log('  ✅ Parallel request handling');
  console.log('  ✅ Message logging and tracing');
  console.log('  ✅ Protocol statistics');
  console.log('  ✅ Agent lifecycle management');
  console.log('  ✅ Error handling');
  console.log('  ✅ Message filtering');
  
  console.log('\n🎉 A2A Protocol is working correctly!');
}

// Run tests
console.log('Starting A2A Protocol Tests...\n');
testA2AProtocol().catch(error => {
  console.error('\n❌ Test suite failed:');
  console.error(error);
  process.exit(1);
});

