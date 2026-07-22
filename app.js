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

app.use('/auth', authRouter);
app.use('/branches', branchesRouter);
app.use('/learners', learnersRouter);

app.listen(port, () => {
  console.log(`✅ lmv_server running on port ${port}`);
});
