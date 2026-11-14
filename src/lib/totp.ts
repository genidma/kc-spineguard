const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a base32 string into a Uint8Array.
 */
export function base32Decode(str: string): Uint8Array {
  const clean = str.replace(/[\s-]/g, '').toUpperCase();
  const len = clean.length;
  const view = new Uint8Array(Math.floor((len * 5) / 8));
  
  let bits = 0;
  let value = 0;
  let index = 0;
  
  for (let i = 0; i < len; i++) {
    const val = ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    
    value = (value << 5) | val;
    bits += 5;
    
    if (bits >= 8) {
      view[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return view;
}

/**
 * Generates a random base32 secret key.
 */
export function generateSecret(length = 16): string {
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += ALPHABET[randomValues[i] % 32];
  }
  return secret;
}

/**
 * Generates a 6-digit TOTP code for a given base32 secret and timestamp.
 */
export async function generateTOTP(secret: string, time = Date.now(), step = 30): Promise<string> {
  const keyBytes = base32Decode(secret);
  const counter = Math.floor(time / 1000 / step);
  
  // Counter as 8-byte buffer (big endian)
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(0, 0);
  counterView.setUint32(4, counter);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    counterBuffer
  );
  
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a TOTP code against a base32 secret, allowing a tolerance window.
 */
export async function verifyTOTP(token: string, secret: string, windowSteps = 2): Promise<boolean> {
  const now = Date.now();
  for (let i = -windowSteps; i <= windowSteps; i++) {
    const generated = await generateTOTP(secret, now + i * 30 * 1000);
    if (generated === token.trim()) {
      return true;
    }
  }
  return false;
}

/**
 * Hashes a backup code string using SHA-256 and returns a hex string.
 */
export async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.trim().toUpperCase());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a list of random backup codes (formatted as XXXX-XXXX).
 */
export function generateBackupCodes(count = 8, length = 8): string[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codes: string[] = [];
  for (let c = 0; c < count; c++) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[randomValues[i] % chars.length];
    }
    const formatted = code.slice(0, 4) + '-' + code.slice(4);
    codes.push(formatted);
  }
  return codes;
}
