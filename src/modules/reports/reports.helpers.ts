import crypto from 'crypto';
import configs from '../../configs/configs';

// Crockford Base32 alphabet: 32 chars (omits I, L, O, U to avoid misreading and accidental words)
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const generatePasscode = (): string => {
  const bytes = crypto.randomBytes(16);
  let out = '';
  for (let i = 0; i < 16; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
};

export const hashPasscode = (passcode: string): string => {
  return crypto
    .createHmac('sha256', configs.passcodePepper)
    .update(passcode.trim().toUpperCase())
    .digest('hex');
};

export const isValidPasscodeFormat = (passcode: string): boolean => {
  if (!passcode || typeof passcode !== 'string') return false;
  const cleaned = passcode.trim().toUpperCase();
  if (cleaned.length !== 16) return false;
  for (let i = 0; i < cleaned.length; i++) {
    if (!ALPHABET.includes(cleaned[i])) {
      return false;
    }
  }
  return true;
};
