import express from 'express';
import { verifySalesforceSession } from '../services/salesforce.js';
import { createSession } from '../store/sessionStore.js';

const router = express.Router();

// POST /auth/session { accessToken, instanceUrl } -> { token, dmName }
// The app already completed the native Authorization Code + PKCE flow
// directly against Salesforce; this just validates the resulting session
// (by calling Salesforce's own userinfo endpoint) and issues our own
// opaque session token used for every other request.
router.post('/session', async (req, res) => {
  const { accessToken, instanceUrl } = req.body || {};
  if (!accessToken || !instanceUrl) {
    return res.status(400).json({ message: 'accessToken and instanceUrl are required.' });
  }

  try {
    const sf = await verifySalesforceSession({ accessToken, instanceUrl });
    const token = createSession({ accessToken, instanceUrl, userId: sf.userId, username: sf.username });
    res.json({ token, dmName: sf.username });
  } catch (err) {
    console.error('🔴 Session validation failed:', err.response?.data || err.message);
    res.status(401).json({ message: 'Could not validate Salesforce session.' });
  }
});

export default router;
