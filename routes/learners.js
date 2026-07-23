import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { soqlQuery, soqlEscape, updateRecord } from '../services/salesforce.js';
import { generateOtp, sendOtpSms } from '../services/adnSms.js';
import { setOtp, verifyOtp } from '../store/otpStore.js';
import sf from '../config/sfSchema.js';

const router = express.Router();

// POST /learners/:id/send-otp -> looks up the learner's phone, generates an
// OTP, stores it server-side, and sends it via the ADN SMS gateway.
router.post('/:id/send-otp', requireAuth, async (req, res) => {
  const { accessToken, instanceUrl } = req.sfSession;
  const learnerId = req.params.id;

  try {
    const soql =
      `SELECT Id, ${sf.fields.learnerPhone} FROM ${sf.learnerObject} ` +
      `WHERE Id = '${soqlEscape(learnerId)}'`;
    const [learner] = await soqlQuery({ accessToken, instanceUrl, soql });
    if (!learner) return res.status(404).json({ message: 'Learner not found.' });

    const phone = learner[sf.fields.learnerPhone];
    if (!phone) return res.status(400).json({ message: 'Learner has no phone number on file.' });

    const otp = generateOtp();
    setOtp(learnerId, otp);
    await sendOtpSms(phone, otp);

    res.json({ success: true });
  } catch (err) {
    console.error('🔴 send-otp failed:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
});

// POST /learners/:id/verify-otp { otp } -> on match, updates Salesforce
// with Verified status + a new PVC code. PVC is permanent (no expiry field
// exists on Apprenticeship_Learner__c).
router.post('/:id/verify-otp', requireAuth, async (req, res) => {
  const { accessToken, instanceUrl } = req.sfSession;
  const learnerId = req.params.id;
  const { otp } = req.body || {};

  if (!otp) return res.status(400).json({ message: 'OTP is required.' });

  const result = verifyOtp(learnerId, String(otp).trim());
  if (!result.ok) return res.status(400).json({ message: result.reason });

  // PVC__c is Text(6) Unique Case Insensitive - retry on the rare collision.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const pvcCode = generatePvcCode();
    try {
      await updateRecord({
        accessToken,
        instanceUrl,
        objectName: sf.learnerObject,
        id: learnerId,
        fields: {
          [sf.fields.learnerStatus]: 'Verified',
          [sf.fields.learnerPvcCode]: pvcCode,
        },
      });
      return res.json({ status: 'verified', pvcCode });
    } catch (err) {
      const isDuplicate = err.response?.data?.[0]?.errorCode === 'DUPLICATE_VALUE';
      if (isDuplicate && attempt < MAX_ATTEMPTS) continue;

      console.error('🔴 Salesforce update failed:', err.response?.data || err.message);
      return res.status(500).json({ message: 'OTP verified but failed to update Salesforce.' });
    }
  }
});

function generatePvcCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default router;
