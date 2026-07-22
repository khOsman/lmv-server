import express from 'express';
import { loginWithPassword } from '../services/salesforce.js';
import { createSession } from '../store/sessionStore.js';

const router = express.Router();

// POST /auth/login { username, password } -> { token, dmName }
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const sf = await loginWithPassword({ username, password });
    const token = createSession({ ...sf, username });
    res.json({ token, dmName: username });
  } catch (err) {
    console.error('🔴 DM login failed:', err.response?.data || err.message);
    res.status(401).json({ message: 'Invalid Salesforce username or password.' });
  }
});

export default router;
