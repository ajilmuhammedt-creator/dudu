// src/lib/rate-limit.ts

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding rate limiter
 * @param key unique identifier (e.g. `register:ip`, `device:token_hash`, `pair:userId`)
 * @param limit maximum allowed requests
 * @param windowMs time window in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetInSec: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, resetInSec: Math.ceil((record.resetAt - now) / 1000) };
}
