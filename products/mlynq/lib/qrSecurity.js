import { supabase } from './supabase';

const QR_SECRET_FALLBACK = 'ISTE_QR_SECRET_DEV_FALLBACK_32ch';

/**
 * Returns the configured QR signing secret.
 */
export function getQrSigningSecret() {
  return import.meta.env?.VITE_QR_SIGNING_SECRET || QR_SECRET_FALLBACK;
}

/**
 * Converts ArrayBuffer/Uint8Array to hex string.
 */
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Converts Uint8Array to Base64 string safely.
 */
function uint8ToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Uint8Array to Base64URL string (RFC 4648 §5).
 */
function uint8ToBase64Url(bytes) {
  return uint8ToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Derives a 32-byte AES-GCM CryptoKey from the QR signing secret.
 */
async function deriveAesKey(secret) {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const keyHash = await window.crypto.subtle.digest('SHA-256', secretBytes);

  return window.crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Computes the 32-character SHA-256 token hash matching m-Lynq Flutter mobile app:
 * sha256('${userId}:${timestamp}:${secret}').substring(0, 32)
 */
export async function computeTokenHash(userId, timestamp, secret = getQrSigningSecret()) {
  const tokenPayload = `${userId}:${timestamp}:${secret}`;
  const encoder = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(tokenPayload));
  const hex = bufferToHex(hashBuffer);
  return hex.substring(0, 32);
}

/**
 * Encrypts a JSON plaintext string with AES-256-GCM.
 * Output format: "<iv_base64url>.<ciphertext_and_tag_base64>"
 * Compatible with Dart 'encrypt' AES-256-GCM and Web Crypto API.
 */
export async function encryptQrPayload(plainText, secret = getQrSigningSecret()) {
  const key = await deriveAesKey(secret);
  // 16-byte random IV matching mobile encrypt package: enc.IV.fromSecureRandom(16)
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plainText);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBytes
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const base64UrlIv = uint8ToBase64Url(iv);
  const base64Cipher = uint8ToBase64(cipherBytes);

  return `${base64UrlIv}.${base64Cipher}`;
}

/**
 * Decrypts an AES-256-GCM encrypted QR payload string.
 */
export async function decryptQrPayload(code, secret = getQrSigningSecret()) {
  const parts = code.trim().split('.');
  if (parts.length !== 2) throw new Error('Invalid encrypted QR payload format');

  let base64Iv = parts[0].replace(/-/g, '+').replace(/_/g, '/');
  while (base64Iv.length % 4) base64Iv += '=';
  const ivBytes = Uint8Array.from(atob(base64Iv), c => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));

  const key = await deriveAesKey(secret);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    cipherBytes
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Generates a dynamic, encrypted attendance QR token for a student.
 * 1. Computes timestamp and 30-second expiry.
 * 2. Computes token hash.
 * 3. Registers token in Supabase `qr_tokens` table for single-use verification.
 * 4. Encrypts `{"uid": userId, "token": tokenHash, "ts": now}` with AES-256-GCM.
 * 5. Returns encrypted payload string and metadata.
 */
export async function generateStudentAttendanceToken(userId) {
  if (!userId) throw new Error('User ID is required to generate attendance QR');

  const now = Date.now();
  const secret = getQrSigningSecret();
  const tokenHash = await computeTokenHash(userId, now, secret);
  const expiresAt = new Date(now + 30 * 1000).toISOString();

  // Insert token into Supabase qr_tokens table
  const { error: dbError } = await supabase.from('qr_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    is_used: false,
  });

  if (dbError) {
    console.warn('Could not register dynamic token in qr_tokens:', dbError.message);
  }

  // Construct JSON payload
  const plainPayload = JSON.stringify({
    uid: userId,
    token: tokenHash,
    ts: now,
  });

  // Encrypt with AES-256-GCM
  const encryptedPayload = await encryptQrPayload(plainPayload, secret);

  return {
    qrData: encryptedPayload,
    tokenHash,
    timestamp: now,
    expiresAt: now + 30 * 1000,
    lifespanSeconds: 30,
  };
}
