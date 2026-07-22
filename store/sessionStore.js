import crypto from 'crypto';

// In-memory DM session store: our own opaque token -> that DM's Salesforce
// session. Each DM gets their own session (rather than one shared global
// token) so multiple DMs can use the app concurrently. Fine for a single
// Node instance; move to Redis if this backend is ever scaled out.
const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function createSession({ accessToken, instanceUrl, userId, username }) {
  const token = crypto.randomUUID();
  sessions.set(token, {
    accessToken,
    instanceUrl,
    userId,
    username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

export function getSession(token) {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token) {
  sessions.delete(token);
}
