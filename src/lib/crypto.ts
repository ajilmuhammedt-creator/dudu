// src/lib/crypto.ts
import crypto from 'crypto';

/**
 * Returns sha256 hex string of input
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generates a random 32-byte hex string (64 characters)
 */
export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a random 6-digit numeric string for pairing
 */
export function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes a 4-digit parent PIN using PBKDF2 or SHA256
 */
export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(`edubuddy_salt_${pin}`).digest('hex');
}
