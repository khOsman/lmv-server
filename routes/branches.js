import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { soqlQuery, soqlEscape } from '../services/salesforce.js';
import sf from '../config/sfSchema.js';

const router = express.Router();

// GET /branches -> branches visible to the logged-in DM, each with its
// learners embedded. No explicit DM/Branch filter is applied here - the
// DM's own Salesforce session (from /auth/login) only has visibility into
// the Master_Branch__c / Apprenticeship_Learner__c records their Public
// Group sharing rules grant them, so Salesforce does the scoping for us.
//
// Only learners with a blank Selection__c are returned: this app is the
// pre-selection verification gate. Once TaroWorks runs the learner
// selection survey and sets Selection__c to Yes/No, that learner is done
// with this app and should no longer show up here.
router.get('/', requireAuth, async (req, res) => {
  const { accessToken, instanceUrl } = req.sfSession;

  try {
    const branchSoql = `SELECT Id, ${sf.fields.branchName} FROM ${sf.branchObject}`;
    const branches = await soqlQuery({ accessToken, instanceUrl, soql: branchSoql });

    const result = await Promise.all(
      branches.map(async (branch) => {
        const learnerSoql =
          `SELECT Id, ${sf.fields.learnerName}, ${sf.fields.learnerGender}, ${sf.fields.learnerPhone}, ` +
          `${sf.fields.learnerStatus}, ${sf.fields.learnerPvcCode} ` +
          `FROM ${sf.learnerObject} WHERE ${sf.fields.learnerBranch} = '${soqlEscape(branch.Id)}' ` +
          `AND ${sf.fields.learnerSelection} = null`;
        const learners = await soqlQuery({ accessToken, instanceUrl, soql: learnerSoql });

        return {
          branchId: branch.Id,
          branchName: branch[sf.fields.branchName],
          learners: learners.map((learner) => ({
            learnerId: learner.Id,
            name: learner[sf.fields.learnerName] || '',
            gender: learner[sf.fields.learnerGender] || '',
            phone: learner[sf.fields.learnerPhone] || '',
            maskedPhone: maskPhone(learner[sf.fields.learnerPhone]),
            status: (learner[sf.fields.learnerStatus] || 'Pending').toLowerCase(),
            pvcCode: learner[sf.fields.learnerPvcCode] || null,
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
