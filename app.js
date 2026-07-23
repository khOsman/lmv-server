import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import authRouter from './routes/auth.js';
import branchesRouter from './routes/branches.js';
import learnersRouter from './routes/learners.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ service: 'lmv_server', status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Salesforce's community-hosted (Experience Cloud) OAuth flow can't
// redirect directly to a custom URL scheme - it needs a real https
// redirect_uri. This page is that target: it takes the code/state Salesforce
// sends back and immediately hands off to the Flutter app via the app's
// custom scheme, which Android intercepts natively (no App Links/
// assetlinks.json verification needed - this is just a plain
// webpage-to-deep-link hop).
app.get('/oauthredirect', (req, res) => {
  const allowedParams = ['code', 'state', 'error', 'error_description'];
  const params = new URLSearchParams();
  for (const key of allowedParams) {
    if (req.query[key] != null) params.set(key, String(req.query[key]));
  }
  const target = `com.brac.learnerverificationapp:///oauthredirect?${params.toString()}`;

  res.type('html').send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Signing you in...</title></head>
<body>
  <p>Signing you in&hellip; if you're not redirected automatically,
    <a id="link" href="${target}">tap here</a>.</p>
  <script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>`);
});

app.use('/auth', authRouter);
app.use('/branches', branchesRouter);
app.use('/learners', learnersRouter);

app.listen(port, () => {
  console.log(`✅ lmv_server running on port ${port}`);
});
