import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateOtp, sendOtpSms } from '../services/adnSms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rawNumber = process.argv[2];
if (!rawNumber) {
  console.error('Usage: node scripts/testSms.js <mobile number>');
  process.exit(1);
}

// Normalize local BD format (01XXXXXXXXX) to international (8801XXXXXXXXX)
const mobile = rawNumber.startsWith('0') ? `88${rawNumber}` : rawNumber;

const otp = generateOtp();
console.log(`Sending OTP ${otp} to ${mobile}...`);

try {
  const result = await sendOtpSms(mobile, otp);
  console.log('✅ ADN response:', JSON.stringify(result, null, 2));
} catch (err) {
  console.error('🔴 Send failed:', err.response?.data || err.message);
  process.exit(1);
}
