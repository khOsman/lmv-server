import { getSession } from '../store/sessionStore.js';

export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const session = token && getSession(token);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated. Please log in again.' });
  }

  req.sfSession = session;
  next();
}
