import axios from 'axios';
import FormData from 'form-data';

/**
 * ADN SMS (https://portal.adnsms.com) is a plain SMS delivery gateway - it
 * does not generate or verify OTP codes itself. We compose and store the
 * code ourselves (see ../store/otpStore.js) and just use ADN to deliver it
 * as a normal single SMS.
 */
export async function sendSms(mobile, messageBody) {
  const appUrl = (process.env.ADN_APP_URL || '').replace(/\/+$/, '');
  if (!appUrl || !process.env.ADN_API_KEY || !process.env.ADN_API_SECRET) {
    throw new Error('ADN SMS is not configured - set ADN_APP_URL/ADN_API_KEY/ADN_API_SECRET in .env.');
  }

  const form = new FormData();
  form.append('api_key', process.env.ADN_API_KEY);
  form.append('api_secret', process.env.ADN_API_SECRET);
  form.append('request_type', 'SINGLE_SMS');
  form.append('message_type', 'TEXT');
  form.append('mobile', mobile);
  form.append('message_body', messageBody);

  const { data } = await axios.post(`${appUrl}/api/v1/secure/send-sms`, form, {
    headers: { ...form.getHeaders(), Accept: 'application/json' },
  });

  if (data.api_response_code !== 200) {
    throw new Error(data.api_response_message || 'ADN SMS send failed.');
  }
  return data;
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtpSms(mobile, otp) {
  const message = `Your BRAC learner verification code is ${otp}. It expires in 5 minutes.`;
  return sendSms(mobile, message);
}
