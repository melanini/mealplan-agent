// /agent/sessionManager.js
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const sessionStore = new Map();

function createSession(userId) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session = {
    sessionId,
    userId,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
    data: {
      recentRecipes: [],
      planHistory: [],
      feedback: [],
      preferences: {}
    }
  };
  
  sessionStore.set(sessionId, session);
  console.log(`[${new Date().toISOString()}] session_created sessionId=${sessionId} userId=${userId}`);
  
  return session;
}

function getSession(sessionId) {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId);
    console.log(`[${new Date().toISOString()}] session_expired sessionId=${sessionId}`);
    return null;
  }
  
  session.lastAccessedAt = Date.now();
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  
  return session;
}

function updateSession(sessionId, data) {
  const session = getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  Object.assign(session.data, data);
  session.lastAccessedAt = Date.now();
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  
  sessionStore.set(sessionId, session);
  console.log(`[${new Date().toISOString()}] session_updated sessionId=${sessionId}`);
  
  return session;
}

function clearSession(sessionId) {
  const existed = sessionStore.has(sessionId);
  sessionStore.delete(sessionId);
  
  if (existed) {
    console.log(`[${new Date().toISOString()}] session_cleared sessionId=${sessionId}`);
  }
  
  return existed;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[${new Date().toISOString()}] sessions_cleanup_completed removed=${cleaned}`);
  }
  
  return cleaned;
}

setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  createSession,
  getSession,
  updateSession,
  clearSession,
  cleanupExpiredSessions
};

