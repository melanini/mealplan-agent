/**
 * A2A (Agent-to-Agent) Protocol Implementation
 * Enables standardized communication between agents
 * Based on OpenAI Agent Protocol specification
 */

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

/**
 * A2A Message Types
 */
const MessageType = {
  REQUEST: 'request',
  RESPONSE: 'response',
  NOTIFICATION: 'notification',
  ERROR: 'error',
  CAPABILITY: 'capability',
  DISCOVERY: 'discovery'
};

/**
 * Agent Capabilities
 */
const AgentCapability = {
  RECIPE_GENERATION: 'recipe_generation',
  MEAL_PLANNING: 'meal_planning',
  WASTE_REDUCTION: 'waste_reduction',
  BALANCED_DIET: 'balanced_diet',
  SHOPPING_NORMALIZATION: 'shopping_normalization',
  FEEDBACK_COMPACTION: 'feedback_compaction',
  USER_PROFILE_MANAGEMENT: 'user_profile_management',
  RECIPE_SEARCH: 'recipe_search'
};

/**
 * A2A Message Format
 */
class A2AMessage {
  constructor(type, payload, options = {}) {
    this.id = options.id || uuidv4();
    this.type = type;
    this.timestamp = new Date().toISOString();
    this.sender = options.sender || 'unknown';
    this.recipient = options.recipient || null;
    this.conversationId = options.conversationId || uuidv4();
    this.correlationId = options.correlationId || null; // For request-response pairing
    this.payload = payload;
    this.metadata = options.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      sender: this.sender,
      recipient: this.recipient,
      conversationId: this.conversationId,
      correlationId: this.correlationId,
      payload: this.payload,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new A2AMessage(json.type, json.payload, {
      id: json.id,
      sender: json.sender,
      recipient: json.recipient,
      conversationId: json.conversationId,
      correlationId: json.correlationId,
      metadata: json.metadata
    });
  }
}

/**
 * Agent Registry
 * Manages available agents and their capabilities
 */
class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }

  register(agentId, capabilities, endpoint) {
    this.agents.set(agentId, {
      id: agentId,
      capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
      endpoint: endpoint,
      status: 'active',
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });
    
    console.log(`[A2A Registry] Registered agent: ${agentId} with capabilities:`, capabilities);
  }

  unregister(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      console.log(`[A2A Registry] Unregistered agent: ${agentId}`);
      return true;
    }
    return false;
  }

  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  findAgentsByCapability(capability) {
    const matchingAgents = [];
    for (const [agentId, agent] of this.agents.entries()) {
      if (agent.capabilities.includes(capability)) {
        matchingAgents.push(agent);
      }
    }
    return matchingAgents;
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  updateHeartbeat(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastSeen = new Date().toISOString();
      agent.status = 'active';
    }
  }

  markInactive(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'inactive';
    }
  }
}

/**
 * A2A Protocol Handler
 * Manages agent-to-agent communication
 */
class A2AProtocolHandler extends EventEmitter {
  constructor() {
    super();
    this.registry = new AgentRegistry();
    this.pendingRequests = new Map(); // correlationId -> Promise resolver
    this.messageLog = []; // For debugging/tracing
    this.maxLogSize = 1000;
  }

  /**
   * Register an agent with capabilities
   */
  registerAgent(agentId, capabilities, endpoint) {
    this.registry.register(agentId, capabilities, endpoint);
    
    // Broadcast capability announcement
    const message = new A2AMessage(MessageType.CAPABILITY, {
      agentId,
      capabilities,
      endpoint
    }, {
      sender: agentId,
      recipient: 'broadcast'
    });
    
    this.emit('agent_registered', message);
    this.logMessage(message);
    
    return message;
  }

  /**
   * Discover agents by capability
   */
  discoverAgents(capability) {
    const agents = this.registry.findAgentsByCapability(capability);
    
    const message = new A2AMessage(MessageType.DISCOVERY, {
      capability,
      agents: agents.map(a => ({
        id: a.id,
        capabilities: a.capabilities,
        endpoint: a.endpoint,
        status: a.status
      }))
    });
    
    this.logMessage(message);
    return message;
  }

  /**
   * Send a request to another agent
   */
  async sendRequest(fromAgentId, toAgentId, action, payload, options = {}) {
    const recipient = this.registry.getAgent(toAgentId);
    
    if (!recipient) {
      throw new Error(`Agent not found: ${toAgentId}`);
    }

    if (recipient.status !== 'active') {
      throw new Error(`Agent is not active: ${toAgentId}`);
    }

    const message = new A2AMessage(MessageType.REQUEST, {
      action,
      data: payload
    }, {
      sender: fromAgentId,
      recipient: toAgentId,
      conversationId: options.conversationId,
      metadata: {
        timeout: options.timeout || 30000,
        priority: options.priority || 'normal',
        ...options.metadata
      }
    });

    this.logMessage(message);
    this.emit('request_sent', message);

    // Create promise for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timeout: ${message.id}`));
      }, options.timeout || 30000);

      this.pendingRequests.set(message.id, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        message
      });

      // Emit for actual delivery (handled by transport layer)
      this.emit('deliver_request', message, recipient);
    });
  }

  /**
   * Send a response to a request
   */
  sendResponse(requestMessage, result, error = null) {
    const message = new A2AMessage(
      error ? MessageType.ERROR : MessageType.RESPONSE,
      error ? { error: error.message, code: error.code } : { result },
      {
        sender: requestMessage.recipient,
        recipient: requestMessage.sender,
        conversationId: requestMessage.conversationId,
        correlationId: requestMessage.id
      }
    );

    this.logMessage(message);
    this.emit('response_sent', message);

    // Resolve pending request if exists
    const pending = this.pendingRequests.get(requestMessage.id);
    if (pending) {
      if (error) {
        pending.reject(error);
      } else {
        pending.resolve(message);
      }
      this.pendingRequests.delete(requestMessage.id);
    }

    return message;
  }

  /**
   * Send a notification (fire and forget)
   */
  sendNotification(fromAgentId, toAgentId, event, data) {
    const message = new A2AMessage(MessageType.NOTIFICATION, {
      event,
      data
    }, {
      sender: fromAgentId,
      recipient: toAgentId || 'broadcast'
    });

    this.logMessage(message);
    this.emit('notification_sent', message);

    return message;
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    const msg = message instanceof A2AMessage ? message : A2AMessage.fromJSON(message);
    
    this.logMessage(msg);

    switch (msg.type) {
      case MessageType.REQUEST:
        this.emit('request_received', msg);
        break;
        
      case MessageType.RESPONSE:
        this.emit('response_received', msg);
        // Resolve pending request
        const pending = this.pendingRequests.get(msg.correlationId);
        if (pending) {
          pending.resolve(msg);
          this.pendingRequests.delete(msg.correlationId);
        }
        break;
        
      case MessageType.NOTIFICATION:
        this.emit('notification_received', msg);
        break;
        
      case MessageType.ERROR:
        this.emit('error_received', msg);
        const errorPending = this.pendingRequests.get(msg.correlationId);
        if (errorPending) {
          errorPending.reject(new Error(msg.payload.error));
          this.pendingRequests.delete(msg.correlationId);
        }
        break;
        
      case MessageType.CAPABILITY:
        this.emit('capability_announced', msg);
        break;
        
      case MessageType.DISCOVERY:
        this.emit('discovery_response', msg);
        break;
    }

    return msg;
  }

  /**
   * Log message for debugging
   */
  logMessage(message) {
    this.messageLog.push({
      timestamp: new Date().toISOString(),
      message: message.toJSON()
    });

    // Keep log size manageable
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.shift();
    }
  }

  /**
   * Get message log
   */
  getMessageLog(filter = {}) {
    let log = this.messageLog;

    if (filter.sender) {
      log = log.filter(entry => entry.message.sender === filter.sender);
    }

    if (filter.recipient) {
      log = log.filter(entry => entry.message.recipient === filter.recipient);
    }

    if (filter.type) {
      log = log.filter(entry => entry.message.type === filter.type);
    }

    if (filter.conversationId) {
      log = log.filter(entry => entry.message.conversationId === filter.conversationId);
    }

    return log;
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId) {
    return this.messageLog.filter(entry => 
      entry.message.conversationId === conversationId
    );
  }

  /**
   * Health check for agents
   */
  performHealthCheck() {
    const now = new Date();
    const timeout = 60000; // 1 minute

    for (const agent of this.registry.getAllAgents()) {
      const lastSeen = new Date(agent.lastSeen);
      const timeSinceLastSeen = now - lastSeen;

      if (timeSinceLastSeen > timeout) {
        this.registry.markInactive(agent.id);
        this.emit('agent_inactive', { agentId: agent.id, lastSeen: agent.lastSeen });
      }
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const agents = this.registry.getAllAgents();
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      inactiveAgents: agents.filter(a => a.status === 'inactive').length,
      totalMessages: this.messageLog.length,
      pendingRequests: this.pendingRequests.size,
      messagesByType: this.messageLog.reduce((acc, entry) => {
        const type = entry.message.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

/**
 * Agent Wrapper
 * Provides A2A protocol interface for agents
 */
class A2AAgent {
  constructor(agentId, capabilities, protocolHandler) {
    this.agentId = agentId;
    this.capabilities = capabilities;
    this.protocol = protocolHandler;
    this.messageHandlers = new Map();
  }

  /**
   * Register this agent
   */
  register(endpoint) {
    return this.protocol.registerAgent(this.agentId, this.capabilities, endpoint);
  }

  /**
   * Discover other agents
   */
  discover(capability) {
    return this.protocol.discoverAgents(capability);
  }

  /**
   * Send request to another agent
   */
  async request(toAgentId, action, payload, options = {}) {
    return await this.protocol.sendRequest(
      this.agentId,
      toAgentId,
      action,
      payload,
      options
    );
  }

  /**
   * Send notification
   */
  notify(toAgentId, event, data) {
    return this.protocol.sendNotification(this.agentId, toAgentId, event, data);
  }

  /**
   * Respond to a request
   */
  respond(requestMessage, result, error = null) {
    return this.protocol.sendResponse(requestMessage, result, error);
  }

  /**
   * Register message handler
   */
  onMessage(action, handler) {
    this.messageHandlers.set(action, handler);
  }

  /**
   * Handle incoming request
   */
  async handleRequest(message) {
    const action = message.payload.action;
    const handler = this.messageHandlers.get(action);

    if (!handler) {
      return this.respond(message, null, new Error(`Unknown action: ${action}`));
    }

    try {
      const result = await handler(message.payload.data, message);
      return this.respond(message, result);
    } catch (error) {
      return this.respond(message, null, error);
    }
  }

  /**
   * Send heartbeat
   */
  heartbeat() {
    this.protocol.registry.updateHeartbeat(this.agentId);
  }
}

/**
 * Create global protocol instance
 */
const globalProtocol = new A2AProtocolHandler();

// Start health check interval
setInterval(() => {
  globalProtocol.performHealthCheck();
}, 30000); // Check every 30 seconds

module.exports = {
  A2AMessage,
  MessageType,
  AgentCapability,
  AgentRegistry,
  A2AProtocolHandler,
  A2AAgent,
  globalProtocol
};

