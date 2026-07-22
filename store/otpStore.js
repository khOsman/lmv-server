// In-memory OTP store: learnerId -> { code, expiresAt, attempts }.
// Fine for a single Node instance; move to Redis if scaled out.
const otps = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export function setOtp(learnerId, code) {
  otps.set(learnerId, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
}

export function verifyOtp(learnerId, code) {
  const entry = otps.get(learnerId);
  if (!entry) return { ok: false, reason: 'No OTP was requested for this learner.' };

  if (Date.now() > entry.expiresAt) {
    otps.delete(learnerId);
    return { ok: false, reason: 'OTP has expired. Please resend.' };
  }

  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    otps.delete(learnerId);
    return { ok: false, reason: 'Too many incorrect attempts. Please resend the OTP.' };
  }

  if (entry.code !== code) {
    return { ok: false, reason: 'Invalid OTP.' };
  }

  otps.delete(learnerId);
  return { ok: true };
}
