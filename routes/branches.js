import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { soqlQuery, soqlEscape } from '../services/salesforce.js';
import sf from '../config/sfSchema.js';

const router = express.Router();

// GET /branches -> branches assigned to the logged-in DM, each with its
// learners embedded.
router.get('/', requireAuth, async (req, res) => {
  const { accessToken, instanceUrl, userId } = req.sfSession;

  try {
    const branchSoql =
      `SELECT Id, ${sf.fields.branchName} FROM ${sf.branchObject} ` +
      `WHERE ${sf.fields.branchDM} = '${soqlEscape(userId)}'`;
    const branches = await soqlQuery({ accessToken, instanceUrl, soql: branchSoql });

    const result = await Promise.all(
      branches.map(async (branch) => {
        const learnerSoql =
          `SELECT Id, ${sf.fields.learnerName}, ${sf.fields.learnerPhone}, ` +
          `${sf.fields.learnerStatus}, ${sf.fields.learnerPvcCode}, ${sf.fields.learnerPvcExpiry} ` +
          `FROM ${sf.learnerObject} WHERE ${sf.fields.learnerBranch} = '${soqlEscape(branch.Id)}'`;
        const learners = await soqlQuery({ accessToken, instanceUrl, soql: learnerSoql });

        return {
          branchId: branch.Id,
          branchName: branch[sf.fields.branchName],
          learners: learners.map((learner) => ({
            learnerId: learner.Id,
            name: learner[sf.fields.learnerName] || '',
            phone: learner[sf.fields.learnerPhone] || '',
            maskedPhone: maskPhone(learner[sf.fields.learnerPhone]),
            status: (learner[sf.fields.learnerStatus] || 'pending').toLowerCase(),
            pvcCode: learner[sf.fields.learnerPvcCode] || null,
            pvcExpiry: learner[sf.fields.learnerPvcExpiry] || null,
          })),
        };
      }),
    );

    res.json(result);
  } catch (err) {
    console.error('🔴 Failed to load branches:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to load branches from Salesforce.' });
  }
});

function maskPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return `**** **** ${digits.slice(-4)}`;
}

export default router;
